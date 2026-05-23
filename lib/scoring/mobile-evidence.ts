import type { AppStoreApp, AppStoreReview } from '@/lib/discovery/mobile';
import type { MobileMetrics, MobileScores } from './mobile';

type ReviewThemeFrequency = 'rare' | 'common' | 'frequent';

export interface IdeaEvidenceContext {
  description: string;
  audience?: string;
  problem?: string;
}

export interface RelevantAppStoreApp extends AppStoreApp {
  relevanceScore: number;
  matchedTerms: string[];
  isRelevant: boolean;
}

export interface KeywordMarketSnapshot {
  keyword: string;
  relevanceScore: number;
  rawAppCount: number;
  relevantAppCount: number;
  metrics: MobileMetrics;
  scores: MobileScores;
  entryScore: number;
}

export interface EvidenceQuality {
  relevantApps: number;
  rawApps: number;
  reviewsAnalyzed: number;
  keywordRelevance: number;
  discardedKeywords: string[];
  limitations: string[];
}

export interface DeterministicReviewTheme {
  theme: string;
  frequency: ReviewThemeFrequency;
  examples: string[];
}

const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'app',
  'apps',
  'for',
  'from',
  'get',
  'help',
  'helps',
  'in',
  'into',
  'ios',
  'mobile',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'this',
  'to',
  'tool',
  'use',
  'user',
  'users',
  'with',
  'your',
]);

const THEME_PATTERNS: Array<{
  theme: string;
  keywords: string[];
}> = [
  {
    theme: 'Crashes and reliability',
    keywords: ['bug', 'crash', 'broken', 'freeze', 'froze', 'error', 'glitch'],
  },
  {
    theme: 'Slow or heavy performance',
    keywords: ['slow', 'lag', 'battery', 'drain', 'performance', 'loading'],
  },
  {
    theme: 'Pricing and subscription frustration',
    keywords: ['price', 'expensive', 'subscription', 'cost', 'paid', 'charge', 'money'],
  },
  {
    theme: 'Missing workflow features',
    keywords: ['missing', 'feature', 'wish', 'need', 'want', 'add', 'lack'],
  },
  {
    theme: 'Confusing user experience',
    keywords: ['confus', 'hard', 'difficult', 'frustrat', 'annoying', 'clunky', 'complicated'],
  },
  {
    theme: 'Onboarding or setup friction',
    keywords: ['onboarding', 'setup', 'sign up', 'login', 'account', 'tutorial'],
  },
  {
    theme: 'Ads or monetization pressure',
    keywords: ['ad ', 'ads', 'advert', 'popup', 'pop up', 'paywall'],
  },
  {
    theme: 'Trust, privacy, or data concern',
    keywords: ['privacy', 'data', 'tracking', 'permission', 'secure', 'trust'],
  },
  {
    theme: 'Support and account issues',
    keywords: ['support', 'refund', 'cancel', 'customer service', 'restore purchase'],
  },
];

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    )
  );
}

function containsTerm(text: string, term: string): boolean {
  return text.includes(term) || text.includes(term.replace(/-/g, ' '));
}

export function scoreAppRelevance(
  app: AppStoreApp,
  keyword: string,
  context: IdeaEvidenceContext
): RelevantAppStoreApp {
  const title = app.trackName.toLowerCase();
  const subtitle = (app.trackSubtitle ?? '').toLowerCase();
  const category = (app.primaryGenreName ?? '').toLowerCase();
  const description = (app.description ?? '').toLowerCase();
  const prominent = `${title} ${subtitle}`;
  const allText = `${prominent} ${category} ${description}`;

  const keywordTerms = tokenize(keyword);
  const contextTerms = tokenize(
    `${context.description} ${context.audience ?? ''} ${context.problem ?? ''}`
  );
  const matchedTerms = Array.from(
    new Set(
      [...keywordTerms, ...contextTerms].filter((term) =>
        containsTerm(allText, term)
      )
    )
  );

  const keywordHits = keywordTerms.filter((term) =>
    containsTerm(allText, term)
  ).length;
  const keywordProminentHits = keywordTerms.filter((term) =>
    containsTerm(prominent, term)
  ).length;
  const contextHits = contextTerms.filter((term) =>
    containsTerm(allText, term)
  ).length;
  const contextProminentHits = contextTerms.filter((term) =>
    containsTerm(prominent, term)
  ).length;
  const categoryHit = contextTerms.some((term) => containsTerm(category, term));

  const keywordScore =
    keywordTerms.length > 0 ? (keywordHits / keywordTerms.length) * 45 : 0;
  const prominentScore =
    keywordTerms.length > 0
      ? (keywordProminentHits / keywordTerms.length) * 25
      : 0;
  const contextScore =
    contextTerms.length > 0 ? (contextHits / contextTerms.length) * 15 : 0;
  const contextProminentScore =
    contextTerms.length > 0
      ? (contextProminentHits / contextTerms.length) * 10
      : 0;
  const categoryScore = categoryHit ? 5 : 0;
  const relevanceScore = Math.round(
    Math.min(
      100,
      keywordScore +
        prominentScore +
        contextScore +
        contextProminentScore +
        categoryScore
    )
  );

  return {
    ...app,
    relevanceScore,
    matchedTerms,
    isRelevant:
      relevanceScore >= 35 ||
      keywordProminentHits >= Math.min(2, Math.max(1, keywordTerms.length)),
  };
}

export function filterRelevantApps(
  apps: AppStoreApp[],
  keyword: string,
  context: IdeaEvidenceContext
): RelevantAppStoreApp[] {
  return apps
    .map((app) => scoreAppRelevance(app, keyword, context))
    .filter((app) => app.isRelevant)
    .sort(
      (a, b) =>
        b.relevanceScore - a.relevanceScore ||
        (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0)
    );
}

export function entryScore(scores: MobileScores): number {
  return scores.opportunityScore * 0.5 + (10 - scores.competitionScore) * 0.5;
}

export function buildEvidenceQuality(params: {
  rawApps: number;
  relevantApps: number;
  reviewsAnalyzed: number;
  keywordMarkets: KeywordMarketSnapshot[];
  discardedKeywords: string[];
  signalCount: number;
}): EvidenceQuality {
  const keywordRelevance =
    params.keywordMarkets.length > 0
      ? Math.round(
          params.keywordMarkets.reduce((sum, k) => sum + k.relevanceScore, 0) /
            params.keywordMarkets.length
        )
      : 0;
  const limitations: string[] = [];

  if (params.relevantApps < 8) {
    limitations.push('Fewer than 8 relevant App Store competitors matched.');
  }
  if (params.reviewsAnalyzed < 20) {
    limitations.push('Real review sample is thin.');
  }
  if (keywordRelevance < 35) {
    limitations.push('Keyword relevance is weak; App Store results may be noisy.');
  }
  if (params.signalCount < 3) {
    limitations.push('Few external pain signals were found.');
  }

  return {
    relevantApps: params.relevantApps,
    rawApps: params.rawApps,
    reviewsAnalyzed: params.reviewsAnalyzed,
    keywordRelevance,
    discardedKeywords: params.discardedKeywords,
    limitations,
  };
}

export function computeEvidenceConfidenceScore(params: {
  relevantApps: number;
  totalReviews: number;
  reviewsAnalyzed: number;
  keywordRelevance: number;
  signalCount: number;
}): number {
  const appCoverage = (Math.min(params.relevantApps, 30) / 30) * 25;
  const reviewVolume = Math.min(params.totalReviews / 20_000, 1) * 25;
  const reviewCoverage = (Math.min(params.reviewsAnalyzed, 60) / 60) * 20;
  const relevance = (Math.min(params.keywordRelevance, 80) / 80) * 20;
  const signalCoverage = (Math.min(params.signalCount, 8) / 8) * 10;
  let score = Math.round(
    appCoverage + reviewVolume + reviewCoverage + relevance + signalCoverage
  );

  if (params.keywordRelevance < 30) score = Math.min(score, 35);
  if (params.reviewsAnalyzed < 10) score = Math.min(score, 55);
  return score;
}

export function extractReviewThemes(
  reviewBatches: AppStoreReview[][]
): DeterministicReviewTheme[] {
  const lowRated = reviewBatches
    .flat()
    .filter((r) => r.rating <= 3 && r.body.trim().length > 20);
  if (lowRated.length === 0) return [];

  const themeHits = THEME_PATTERNS.map((pattern) => {
    const examples = lowRated
      .filter((review) => {
        const text = `${review.title} ${review.body}`.toLowerCase();
        return pattern.keywords.some((keyword) => text.includes(keyword));
      })
      .slice(0, 3)
      .map((review) => review.body.trim().slice(0, 140));
    return { theme: pattern.theme, count: examples.length, examples };
  })
    .filter((theme) => theme.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return themeHits.map((theme) => ({
    theme: theme.theme,
    frequency:
      theme.count >= 5 ? 'frequent' : theme.count >= 2 ? 'common' : 'rare',
    examples: theme.examples,
  }));
}

export function buildReviewPainSnippets(
  themes: DeterministicReviewTheme[]
): Array<{ snippet: string }> {
  return themes.map((theme) => ({
    snippet: `${theme.theme}: ${theme.examples.join(' ')}`,
  }));
}
