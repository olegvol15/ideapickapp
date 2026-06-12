import type {
  PainEvidenceResult,
  PainQuote,
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
// 10 complaints ≈ 50, 20 ≈ 71, 40+ = 100.
const FREQUENCY_SATURATION_COUNT = 40;
const CONCENTRATION_BONUS = 10;
const CONCENTRATION_THRESHOLD = 5;

const REACHABILITY_BY_COMMUNITIES = [0, 30, 50, 65, 80, 90] as const;
const AUDIENCE_INPUT_BONUS = 10;
const DEFAULT_INTENSITY = 2;

// Reach only counts places with an audience you can actually post to:
// subreddits, app review sections, Q&A/forum platforms, and authored
// forum threads. An editorial article is evidence, not a community.
function communityKey(quote: PainQuote): string | null {
  if (quote.source === 'reddit') return quote.sourceLabel.toLowerCase();
  if (quote.source === 'appstore') return `app:${quote.appName ?? 'unknown'}`;
  const host = quote.sourceLabel.toLowerCase();
  if (quote.author || matchesDomainSuffix(host, COMMUNITY_DOMAINS)) {
    return host;
  }
  return null;
}

export function computeIdeaScore(
  result: PainEvidenceResult,
  hasAudienceInput: boolean
): { score: number; scoreBreakdown: ScoreBreakdown } {
  const complaintThemes = result.themes.filter(
    (theme) => (theme.evidenceType ?? 'complaint') === 'complaint'
  );
  const complaintQuotes = complaintThemes.flatMap((theme) => theme.quotes);

  if (complaintQuotes.length === 0) {
    return {
      score: 0,
      scoreBreakdown: {
        problemStrength: 0,
        complaintFrequency: 0,
        audienceReachability: 0,
      },
    };
  }

  const avgIntensity =
    complaintQuotes.reduce(
      (sum, quote) => sum + (quote.intensity ?? DEFAULT_INTENSITY),
      0
    ) / complaintQuotes.length;
  const problemStrength = Math.round(((avgIntensity - 1) / 2) * 100);

  const topThemeMentions = Math.max(
    ...complaintThemes.map((theme) => theme.mentionCount)
  );
  const complaintFrequency = Math.min(
    100,
    Math.round(
      100 * Math.sqrt(complaintQuotes.length / FREQUENCY_SATURATION_COUNT)
    ) + (topThemeMentions >= CONCENTRATION_THRESHOLD ? CONCENTRATION_BONUS : 0)
  );

  const communities = new Set(
    complaintQuotes
      .map(communityKey)
      .filter((key): key is string => key !== null)
  ).size;
  const audienceReachability = Math.min(
    100,
    REACHABILITY_BY_COMMUNITIES[
      Math.min(communities, REACHABILITY_BY_COMMUNITIES.length - 1)
    ] + (hasAudienceInput ? AUDIENCE_INPUT_BONUS : 0)
  );

  const score = Math.round(
    WEIGHT_PROBLEM_STRENGTH * problemStrength +
      WEIGHT_COMPLAINT_FREQUENCY * complaintFrequency +
      WEIGHT_AUDIENCE_REACHABILITY * audienceReachability
  );

  return {
    score,
    scoreBreakdown: { problemStrength, complaintFrequency, audienceReachability },
  };
}
