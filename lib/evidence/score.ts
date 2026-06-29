import type {
  CompetitorInsight,
  PainEvidenceResult,
  PainQuote,
  PainTheme,
  ScoreBreakdown,
} from '@/lib/schemas';
import { COMMUNITY_DOMAINS, matchesDomainSuffix } from './domains';

// Idea Score = 40% problem strength + 35% complaint frequency
//            + 25% audience reachability. Buildability is deliberately
// excluded in v1 — no skills/time inputs exist to ground it.
const WEIGHT_PROBLEM_STRENGTH = 0.4;
const WEIGHT_COMPLAINT_FREQUENCY = 0.35;
const WEIGHT_AUDIENCE_REACHABILITY = 0.25;

// sqrt curve: raw counts depend on search luck, so gains taper off.
// Direct complaints are scarce; related discussion and competitor dislikes
// top up the effective count below, so saturation sits above the typical
// direct-complaint count to keep the curve from maxing on corroboration.
const FREQUENCY_SATURATION_COUNT = 24;
const CONCENTRATION_BONUS = 10;
const CONCENTRATION_THRESHOLD = 5;

// Related discussion is demand signal, but weaker than a direct complaint,
// and a flood of it must not outrun the direct complaints that anchor the
// score. Competitor dislikes are source-backed complaints about existing
// products — they corroborate, so they count a little more than generic
// related chatter but must not dominate.
const RELATED_WEIGHT = 0.3;
const DISLIKE_WEIGHT = 0.2;
// Competitors corroborate pain; cap how many of their dislikes count so a
// crowded market (many competitors × many bullets) can't flood the score.
const MAX_COUNTED_DISLIKES = 8;

const REACHABILITY_BY_COMMUNITIES = [0, 30, 50, 65, 80, 90] as const;
const AUDIENCE_INPUT_BONUS = 10;
// Credible existing competitors prove a reachable, monetizable audience —
// a small nudge, not enough to auto-max reach on its own.
const COMPETITOR_REACH_BONUS_PER = 5;
const MAX_COMPETITOR_REACH_BONUS = 5;

// Saturation penalty: entrenched incumbents make a market hard to win, so a
// crowded field of established apps discounts the final score. Review count is
// the entrenchment signal — a popular category with several heavily-reviewed
// incumbents (e.g. Tinder, Hinge, Bumble) is the hardest to break into.
const STRONG_INCUMBENT_REVIEWS = 50_000;
const SATURATION_PENALTY_PER_INCUMBENT = 0.08;
const MAX_SATURATION_PENALTY = 0.25;

const DEFAULT_INTENSITY = 2;
// A paying user of an existing product who still complains is real,
// recurring pain — between "recurring" (2) and "severe" (3).
const DISLIKE_INTENSITY = 2.5;
const SEVERE_INTENSITY = 3;
const MAX_SEVERE_BONUS = 15;

// Reach only counts places with an audience you can actually post to:
// subreddits, app review sections, Q&A/forum platforms, and authored
// forum threads. An editorial article is evidence, not a community.
function communityKey(quote: PainQuote): string | null {
  if (quote.source === 'reddit') return quote.sourceLabel.toLowerCase();
  if (quote.source === 'appstore') return `app:${quote.appName ?? 'unknown'}`;
  if (quote.source === 'x') return `x:${quote.author ?? 'unknown'}`;
  const host = quote.sourceLabel.toLowerCase();
  if (quote.author || matchesDomainSuffix(host, COMMUNITY_DOMAINS)) {
    return host;
  }
  return null;
}

interface CompetitorSignal {
  competitorCount: number;
  dislikeCount: number;
}

function competitorSignal(competitors: CompetitorInsight[]): CompetitorSignal {
  return {
    competitorCount: competitors.length,
    dislikeCount: competitors.reduce((sum, c) => sum + c.dislikes.length, 0),
  };
}

// Fraction (0–MAX) to discount the score by, scaled by how many entrenched
// incumbents crowd the market. Review counts come from App Store matches, so
// web/SaaS competitors (no review signal) contribute no penalty.
function saturationFactor(competitors: CompetitorInsight[]): number {
  const strongCount = competitors.filter(
    (competitor) => (competitor.reviewCount ?? 0) >= STRONG_INCUMBENT_REVIEWS
  ).length;
  return Math.min(
    MAX_SATURATION_PENALTY,
    strongCount * SATURATION_PENALTY_PER_INCUMBENT
  );
}

function problemStrength(
  complaintQuotes: PainQuote[],
  dislikeCount: number
): number {
  const intensities = [
    ...complaintQuotes.map((quote) => quote.intensity ?? DEFAULT_INTENSITY),
    ...Array<number>(dislikeCount).fill(DISLIKE_INTENSITY),
  ];
  if (intensities.length === 0) return 0;

  const avgIntensity =
    intensities.reduce((sum, value) => sum + value, 0) / intensities.length;
  const base = ((avgIntensity - 1) / 2) * 100;

  // Reward peak pain so ideas backed by severe complaints separate from
  // those backed only by mild, evenly-rated gripes.
  const severeShare =
    intensities.filter((value) => value >= SEVERE_INTENSITY).length /
    intensities.length;
  const severeBonus = severeShare * MAX_SEVERE_BONUS;

  return Math.min(100, Math.round(base + severeBonus));
}

function complaintFrequency(
  complaintThemes: PainTheme[],
  relatedCount: number,
  dislikeCount: number
): number {
  const complaintCount = complaintThemes.reduce(
    (sum, theme) => sum + theme.quotes.length,
    0
  );
  // Direct complaints anchor the signal — related chatter can top it up to
  // at most a couple beyond the direct count, never run away with it.
  const relatedContribution = Math.min(
    RELATED_WEIGHT * relatedCount,
    complaintCount + 2
  );
  const effectiveCount =
    complaintCount + relatedContribution + DISLIKE_WEIGHT * dislikeCount;

  const base = Math.round(
    100 * Math.sqrt(effectiveCount / FREQUENCY_SATURATION_COUNT)
  );
  const topThemeMentions = complaintThemes.length
    ? Math.max(...complaintThemes.map((theme) => theme.mentionCount))
    : 0;
  const concentration =
    topThemeMentions >= CONCENTRATION_THRESHOLD ? CONCENTRATION_BONUS : 0;

  return Math.min(100, base + concentration);
}

function audienceReachability(
  themes: PainTheme[],
  competitorCount: number,
  hasAudienceInput: boolean
): number {
  // Related discussions still reveal communities you can reach, so count
  // every theme's quotes here, not just complaints.
  const communities = new Set(
    themes
      .flatMap((theme) => theme.quotes)
      .map(communityKey)
      .filter((key): key is string => key !== null)
  ).size;
  const competitorBonus = Math.min(
    competitorCount * COMPETITOR_REACH_BONUS_PER,
    MAX_COMPETITOR_REACH_BONUS
  );

  return Math.min(
    100,
    REACHABILITY_BY_COMMUNITIES[
      Math.min(communities, REACHABILITY_BY_COMMUNITIES.length - 1)
    ] +
      (hasAudienceInput ? AUDIENCE_INPUT_BONUS : 0) +
      competitorBonus
  );
}

export function computeIdeaScore(
  result: PainEvidenceResult,
  hasAudienceInput: boolean
): { score: number; scoreBreakdown: ScoreBreakdown } {
  const complaintThemes = result.themes.filter(
    (theme) => (theme.evidenceType ?? 'complaint') === 'complaint'
  );
  const complaintQuotes = complaintThemes.flatMap((theme) => theme.quotes);
  const relatedCount = result.themes
    .filter((theme) => theme.evidenceType === 'related')
    .reduce((sum, theme) => sum + theme.quotes.length, 0);
  const { competitorCount, dislikeCount } = competitorSignal(
    result.competitors ?? []
  );
  const countedDislikes = Math.min(dislikeCount, MAX_COUNTED_DISLIKES);

  const breakdown: ScoreBreakdown = {
    problemStrength: problemStrength(complaintQuotes, countedDislikes),
    complaintFrequency: complaintFrequency(
      complaintThemes,
      relatedCount,
      countedDislikes
    ),
    audienceReachability: audienceReachability(
      result.themes,
      competitorCount,
      hasAudienceInput
    ),
  };

  const gross =
    WEIGHT_PROBLEM_STRENGTH * breakdown.problemStrength +
    WEIGHT_COMPLAINT_FREQUENCY * breakdown.complaintFrequency +
    WEIGHT_AUDIENCE_REACHABILITY * breakdown.audienceReachability;

  const factor = saturationFactor(result.competitors ?? []);
  const score = Math.round(gross * (1 - factor));
  // Surfaced as a 0–100 saturation level (higher = more crowded). The penalty
  // cap maps to 100, keeping the displayed level aligned with the actual discount.
  breakdown.marketSaturation = Math.round(
    (factor / MAX_SATURATION_PENALTY) * 100
  );

  return { score, scoreBreakdown: breakdown };
}
