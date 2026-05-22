import type { AppStoreApp } from '@/lib/discovery/mobile';
import {
  estimateMonthlyRevenue,
  keywordInTopTitles,
  hasWeakIncumbents,
} from '@/lib/discovery/mobile';
import type { Competitor } from '@/types';

// ─── Thresholds ───────────────────────────────────────────────────────────────

const SATURATION_HIGH = 30;
const SATURATION_EXTREME = 45;
const TOP10_RATING_STRONG = 4.7;
const TOP10_RATING_HIGH = 4.3;
const TOP5_SHARE_VERY_DOMINANT = 0.75;
const TOP5_SHARE_DOMINANT = 0.6;
const TOP10_SHARE_STRONG = 0.6;
const TOP10_SHARE_HIGH = 0.4;
const RATING_ABOVE_45 = 4.5;
// A market is only "locked" when incumbents are genuinely exceptional (4.75+),
// reviews are extremely concentrated (Gini > 0.80), AND there is real review
// volume proving the dominance — small niches with few total reviews are not locked.
const MARKET_LOCKED_RATING = 4.75;
const MARKET_LOCKED_SKEW = 0.80;
const MARKET_LOCKED_MIN_REVIEWS = 50_000;
const TOP1_DOMINANT = 0.4;
const PAIN_SCORE_CEILING = 4; // practical weighted-hit ceiling for truncated Tavily snippets

// ─── Pain patterns ────────────────────────────────────────────────────────────

type PainCluster =
  | 'bugs'
  | 'performance'
  | 'pricing'
  | 'missing_features'
  | 'ux';

interface PainPattern {
  keywords: string[];
  weight: number;
  cluster: PainCluster;
}

const PAIN_PATTERNS: PainPattern[] = [
  {
    keywords: ['bug', 'crash', 'broken', 'freeze', 'error', 'glitch'],
    weight: 1,
    cluster: 'bugs',
  },
  {
    keywords: ['slow', 'lag', 'battery', 'performance', 'drain', 'memory'],
    weight: 2,
    cluster: 'performance',
  },
  {
    keywords: [
      'price',
      'expensive',
      'subscription',
      'cost',
      'paid',
      'charge',
      'money',
    ],
    weight: 2,
    cluster: 'pricing',
  },
  {
    keywords: ['missing', 'feature', 'wish', 'need', 'want', 'add', 'lack'],
    weight: 3,
    cluster: 'missing_features',
  },
  {
    keywords: [
      'confus',
      'hard',
      'difficult',
      'frustrat',
      'annoying',
      'clunky',
      'complicated',
      'hate',
      'ux',
    ],
    weight: 3,
    cluster: 'ux',
  },
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface MobileMetrics {
  totalApps: number;
  totalReviews: number;
  // Distribution — replaces naive averages
  top10AvgRating: number;
  bottom40AvgRating: number;
  medianRating: number;
  ratingVariance: number;
  top1ReviewShare: number;
  top5ReviewShare: number;
  top10ReviewShare: number;
  reviewDistributionSkew: number; // Gini approximation 0–1
  ratingDistributionAbove45: number;
  // Derived structural flags
  marketDominance: 'HIGH' | 'MEDIUM' | 'LOW';
  marketLocked: boolean;
}

export interface PainAnalysis {
  weightedScore: number;
  topPainClusters: Array<{ cluster: PainCluster; share: number }>;
}

export interface NicheResult {
  query: string;
  totalApps: number;
  top5ReviewShare: number;
  reviewDistributionSkew: number;
  marketDominance: 'HIGH' | 'MEDIUM' | 'LOW';
  keywordInTopTitles?: boolean;
  hasWeakIncumbents?: boolean;
  topAppRevEstimate?: { low: number; high: number } | null;
}

export interface WinAngle {
  title: string;
  signal: string;
  angle: string;
}

export interface MobileScores {
  competitionScore: number;
  saturationScore: number;
  qualityBarrierScore: number;
  marketPowerScore: number;
  opportunityScore: number;
}

export type MobileDecision =
  | 'BUILD'
  | 'RISKY'        // kept for initial deterministic pass compat
  | 'TEST_FIRST'
  | 'NICHE_ONLY'
  | 'PIVOT_ANGLE'
  | 'DO_NOT_BUILD';

export interface DimensionScores {
  // Deterministic — computed from real App Store + Tavily data
  painEvidence: number;       // 0–10
  wedgeClarity: number;       // 0–10
  differentiationGap: number; // 0–10
  competitionPenalty: number; // 0–20
  // LLM-assessed — set to defaults until LLM provides them
  mvpSimplicity: number;         // 0–10
  distributionAccess: number;    // 0–10
  monetizationPotential: number; // 0–10
  coldStartRisk: number;         // 0–10 (higher = riskier penalty)
}

// ─── Distribution helpers ─────────────────────────────────────────────────────

function reviewShare(
  byReviews: AppStoreApp[],
  fromIdx: number,
  toIdx: number,
  total: number
): number {
  if (total === 0) return 0;
  const slice = byReviews.slice(fromIdx, toIdx);
  return slice.reduce((s, a) => s + (a.userRatingCount ?? 0), 0) / total;
}

function giniApproximation(reviewCounts: number[]): number {
  if (reviewCounts.length === 0) return 0;
  const sorted = [...reviewCounts].sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((s, r) => s + r, 0);
  if (total === 0) return 0;
  let lorenzSum = 0;
  let cumReviews = 0;
  for (const r of sorted) {
    cumReviews += r;
    lorenzSum += cumReviews / total;
  }
  return Math.max(0, Math.min(1, 1 - (2 * lorenzSum) / n));
}

function avgRatingOf(apps: AppStoreApp[]): number {
  const rated = apps.filter((a) => a.averageUserRating != null);
  if (rated.length === 0) return 0;
  return rated.reduce((s, a) => s + a.averageUserRating!, 0) / rated.length;
}

function dominanceLabel(
  top5Share: number,
  top1Share: number
): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (top5Share > TOP5_SHARE_VERY_DOMINANT || top1Share > TOP1_DOMINANT)
    return 'HIGH';
  if (top5Share > 0.5) return 'MEDIUM';
  return 'LOW';
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export function computeAppStoreMetrics(apps: AppStoreApp[]): MobileMetrics {
  const empty: MobileMetrics = {
    totalApps: 0,
    totalReviews: 0,
    top10AvgRating: 0,
    bottom40AvgRating: 0,
    medianRating: 0,
    ratingVariance: 0,
    top1ReviewShare: 0,
    top5ReviewShare: 0,
    top10ReviewShare: 0,
    reviewDistributionSkew: 0,
    ratingDistributionAbove45: 0,
    marketDominance: 'LOW',
    marketLocked: false,
  };
  if (apps.length === 0) return empty;

  const totalApps = apps.length;
  const byReviews = [...apps].sort(
    (a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0)
  );
  const totalReviews = byReviews.reduce(
    (s, a) => s + (a.userRatingCount ?? 0),
    0
  );

  const top1ReviewShare = reviewShare(byReviews, 0, 1, totalReviews);
  const top5ReviewShare = reviewShare(byReviews, 0, 5, totalReviews);
  const top10ReviewShare = reviewShare(byReviews, 0, 10, totalReviews);

  const reviewDistributionSkew = giniApproximation(
    byReviews.map((a) => a.userRatingCount ?? 0)
  );

  const top10AvgRating = avgRatingOf(byReviews.slice(0, 10));
  const bottom40Start = Math.floor(totalApps * 0.6);
  const bottom40AvgRating = avgRatingOf(byReviews.slice(bottom40Start));

  const ratedApps = apps.filter((a) => a.averageUserRating != null);
  const ratedSorted = [...ratedApps].sort(
    (a, b) => a.averageUserRating! - b.averageUserRating!
  );
  const medianRating =
    ratedSorted.length > 0
      ? ratedSorted[Math.floor(ratedSorted.length / 2)].averageUserRating!
      : 0;

  const ratings = ratedApps.map((a) => a.averageUserRating!);
  const meanR =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r, 0) / ratings.length
      : 0;
  const meanR2 =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r * r, 0) / ratings.length
      : 0;
  const ratingVariance = Math.max(0, meanR2 - meanR * meanR);

  const ratingDistributionAbove45 =
    ratedApps.length > 0
      ? ratedApps.filter((a) => a.averageUserRating! >= RATING_ABOVE_45)
          .length / ratedApps.length
      : 0;

  const marketDominance = dominanceLabel(top5ReviewShare, top1ReviewShare);
  const marketLocked =
    top10AvgRating > MARKET_LOCKED_RATING &&
    reviewDistributionSkew > MARKET_LOCKED_SKEW &&
    totalReviews >= MARKET_LOCKED_MIN_REVIEWS;

  return {
    totalApps,
    totalReviews,
    top10AvgRating,
    bottom40AvgRating,
    medianRating,
    ratingVariance,
    top1ReviewShare,
    top5ReviewShare,
    top10ReviewShare,
    reviewDistributionSkew,
    ratingDistributionAbove45,
    marketDominance,
    marketLocked,
  };
}

// ─── Niche metrics ────────────────────────────────────────────────────────────

export function computeNicheMetrics(
  apps: AppStoreApp[],
  query: string
): NicheResult {
  if (apps.length === 0) {
    return {
      query,
      totalApps: 0,
      top5ReviewShare: 0,
      reviewDistributionSkew: 0,
      marketDominance: 'LOW',
    };
  }
  const byReviews = [...apps].sort(
    (a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0)
  );
  const totalReviews = byReviews.reduce(
    (s, a) => s + (a.userRatingCount ?? 0),
    0
  );
  const top5ReviewShare = reviewShare(byReviews, 0, 5, totalReviews);
  const top1ReviewShare = reviewShare(byReviews, 0, 1, totalReviews);
  const reviewDistributionSkew = giniApproximation(
    byReviews.map((a) => a.userRatingCount ?? 0)
  );
  const marketDominance = dominanceLabel(top5ReviewShare, top1ReviewShare);
  const kwInTitles = keywordInTopTitles(apps, query);
  const weakIncumbents = hasWeakIncumbents(apps);
  const topRev = apps[0] ? estimateMonthlyRevenue(apps[0]) : null;
  return {
    query,
    totalApps: apps.length,
    top5ReviewShare,
    reviewDistributionSkew,
    marketDominance,
    keywordInTopTitles: kwInTitles,
    hasWeakIncumbents: weakIncumbents,
    topAppRevEstimate:
      topRev && (topRev.low > 0 || topRev.high > 0) ? topRev : null,
  };
}

// ─── Pain analysis ────────────────────────────────────────────────────────────

export function computePainAnalysis(signalResults: Competitor[]): PainAnalysis {
  if (signalResults.length === 0)
    return { weightedScore: 5, topPainClusters: [] };

  let totalWeighted = 0;
  const clusterHits: Record<PainCluster, number> = {
    bugs: 0,
    performance: 0,
    pricing: 0,
    missing_features: 0,
    ux: 0,
  };

  for (const result of signalResults) {
    const text = result.snippet.toLowerCase();
    for (const pattern of PAIN_PATTERNS) {
      const hits = pattern.keywords.filter((k) => text.includes(k)).length;
      if (hits > 0) {
        totalWeighted += pattern.weight * hits;
        clusterHits[pattern.cluster] += hits;
      }
    }
  }

  const rawScore = totalWeighted / signalResults.length;
  const weightedScore = Math.min(
    10,
    Math.round((rawScore / PAIN_SCORE_CEILING) * 10)
  );

  const totalClusterHits = Object.values(clusterHits).reduce(
    (s, n) => s + n,
    0
  );
  const topPainClusters = (
    Object.entries(clusterHits) as [PainCluster, number][]
  )
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cluster, hits]) => ({
      cluster,
      share:
        totalClusterHits > 0 ? Math.round((hits / totalClusterHits) * 100) : 0,
    }));

  return { weightedScore, topPainClusters };
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function computeMobileScores(
  metrics: MobileMetrics,
  pain: PainAnalysis,
  bestNiche?: NicheResult
): MobileScores {
  // competitionScore (0–10) — uses distribution metrics, not averages
  let competitionScore = 0;
  if (metrics.totalApps >= SATURATION_EXTREME) competitionScore += 4;
  else if (metrics.totalApps >= SATURATION_HIGH) competitionScore += 2;
  if (metrics.top10AvgRating >= TOP10_RATING_STRONG) competitionScore += 2;
  else if (metrics.top10AvgRating >= TOP10_RATING_HIGH) competitionScore += 1;
  if (metrics.top5ReviewShare >= TOP5_SHARE_VERY_DOMINANT)
    competitionScore += 3;
  else if (metrics.top5ReviewShare >= TOP5_SHARE_DOMINANT)
    competitionScore += 2;
  competitionScore = Math.min(10, competitionScore);

  // saturationScore (0–10)
  let saturationScore = 0;
  if (metrics.totalApps >= SATURATION_EXTREME) saturationScore = 8;
  else if (metrics.totalApps >= SATURATION_HIGH) saturationScore = 5;
  else if (metrics.totalApps > 10) saturationScore = 3;

  // qualityBarrierScore — now uses top10AvgRating and top10ReviewShare
  let qualityBarrierScore = 0;
  if (metrics.top10AvgRating >= TOP10_RATING_STRONG) qualityBarrierScore += 4;
  else if (metrics.top10AvgRating >= TOP10_RATING_HIGH)
    qualityBarrierScore += 2;
  if (metrics.top10ReviewShare >= TOP10_SHARE_STRONG) qualityBarrierScore += 3;
  else if (metrics.top10ReviewShare >= TOP10_SHARE_HIGH)
    qualityBarrierScore += 2;
  if (metrics.ratingDistributionAbove45 >= 0.7) qualityBarrierScore += 3;
  qualityBarrierScore = Math.min(10, qualityBarrierScore);

  // marketPowerScore — uses marketDominance (which factors in top1ReviewShare)
  let marketPowerScore = 0;
  if (metrics.marketDominance === 'HIGH') marketPowerScore = 9;
  else if (metrics.top5ReviewShare >= TOP5_SHARE_DOMINANT) marketPowerScore = 6;
  else if (metrics.top5ReviewShare >= 0.4) marketPowerScore = 4;

  // opportunityScore — weighted formula replacing naive inverse
  const inverseCompetition = 10 - competitionScore;
  const inverseMarketPower = 10 - marketPowerScore;
  let opportunityScore =
    pain.weightedScore * 0.5 +
    inverseCompetition * 0.2 +
    inverseMarketPower * 0.3;

  // Amplification: high competition + high pain = real frustrated users, viable niche entry
  if (competitionScore >= 6 && pain.weightedScore >= 6) {
    opportunityScore += 1.5;
  }

  // Niche bonus: if best niche shows materially lower dominance
  if (
    bestNiche &&
    bestNiche.totalApps >= 5 &&
    bestNiche.top5ReviewShare < metrics.top5ReviewShare * 0.7
  ) {
    opportunityScore += 1;
  }

  // ASO-proxy bonuses — cheap entry-ease signals
  if (bestNiche?.keywordInTopTitles === false) opportunityScore += 1.0;
  if (bestNiche?.hasWeakIncumbents === true) opportunityScore += 1.5;

  opportunityScore = Math.min(10, Math.max(0, opportunityScore));

  return {
    competitionScore,
    saturationScore,
    qualityBarrierScore,
    marketPowerScore,
    opportunityScore,
  };
}

// ─── Decision ─────────────────────────────────────────────────────────────────

export function computeDecision(
  scores: MobileScores,
  metrics: MobileMetrics,
  nicheEntryStrategy?: 'ENTER_VIA_NICHE' | 'BROAD_MARKET' | 'NO_VIABLE_ENTRY'
): { verdict: MobileDecision; reason: string } {
  // NICHE_ONLY: broad market is blocked but a focused niche is viable
  if (
    nicheEntryStrategy === 'ENTER_VIA_NICHE' &&
    (metrics.marketLocked || metrics.marketDominance === 'HIGH') &&
    scores.opportunityScore >= 2
  ) {
    return {
      verdict: 'NICHE_ONLY',
      reason:
        'Broad market is dominated by incumbents, but a focused niche entry is viable.',
    };
  }

  if (metrics.marketLocked && scores.opportunityScore < 3) {
    return {
      verdict: 'DO_NOT_BUILD',
      reason: 'Market is locked by incumbents with no viable entry angle.',
    };
  }
  if (scores.competitionScore >= 8 && scores.opportunityScore < 3) {
    return {
      verdict: 'DO_NOT_BUILD',
      reason:
        'Market is extremely saturated with no viable pain signal to exploit.',
    };
  }
  if (scores.competitionScore >= 7 && scores.opportunityScore >= 6) {
    return {
      verdict: 'RISKY',
      reason:
        'High competition but pain signals suggest a viable niche opening.',
    };
  }
  if (scores.competitionScore < 6 && scores.opportunityScore >= 5) {
    return {
      verdict: 'BUILD',
      reason: 'Market has room and real user pain supports entry.',
    };
  }
  return {
    verdict: 'RISKY',
    reason: 'Competitive market with limited differentiation signals.',
  };
}

// ─── New dimension scoring ────────────────────────────────────────────────────

export function computeDimensionScores(
  metrics: MobileMetrics,
  pain: PainAnalysis,
  nicheEntryStrategy: 'ENTER_VIA_NICHE' | 'BROAD_MARKET' | 'NO_VIABLE_ENTRY',
  nicheOpportunityScore: number
): Pick<
  DimensionScores,
  'painEvidence' | 'wedgeClarity' | 'differentiationGap' | 'competitionPenalty'
> {
  const painEvidence = Math.min(10, pain.weightedScore * 2.5);

  const wedgeClarity =
    nicheEntryStrategy === 'ENTER_VIA_NICHE'
      ? Math.min(10, nicheOpportunityScore * 10)
      : Math.max(0, Math.min(10, (1 - metrics.top5ReviewShare) * 10 * 0.8));

  // Higher differentiationGap when weaker competitors exist and ratings spread
  const differentiationGap = Math.min(
    10,
    Math.max(
      0,
      (5 - (metrics.bottom40AvgRating > 0 ? metrics.bottom40AvgRating : 3.5)) +
        metrics.ratingVariance * 2
    )
  );

  const competitionPenalty = metrics.marketLocked
    ? 20
    : metrics.marketDominance === 'HIGH'
      ? 12
      : metrics.marketDominance === 'MEDIUM'
        ? 6
        : 0;

  return { painEvidence, wedgeClarity, differentiationGap, competitionPenalty };
}

export function computeFinalScore(dims: DimensionScores): number {
  const base =
    (dims.painEvidence * 0.22 +
      dims.wedgeClarity * 0.25 +
      dims.differentiationGap * 0.13 +
      dims.mvpSimplicity * 0.15 +
      dims.distributionAccess * 0.15 +
      dims.monetizationPotential * 0.1) *
    10;
  return Math.round(
    Math.max(0, Math.min(100, base - dims.competitionPenalty - dims.coldStartRisk))
  );
}

export function computeFinalDecision(
  dims: DimensionScores,
  initialDecision: MobileDecision
): MobileDecision {
  // NICHE_ONLY is structural — determined by market concentration, not LLM scores
  if (initialDecision === 'NICHE_ONLY') return 'NICHE_ONLY';

  const finalScore = computeFinalScore(dims);

  if (finalScore >= 65 && dims.wedgeClarity >= 6 && dims.distributionAccess >= 5) {
    return 'BUILD';
  }
  // Real pain but wrong execution angle — the product concept needs pivoting
  if (dims.painEvidence >= 6 && dims.wedgeClarity < 4 && dims.mvpSimplicity < 4) {
    return 'PIVOT_ANGLE';
  }
  if (finalScore >= 40 && (dims.wedgeClarity >= 4 || dims.painEvidence >= 6)) {
    return 'TEST_FIRST';
  }
  if (finalScore < 35 || dims.painEvidence < 3) {
    return 'DO_NOT_BUILD';
  }
  return 'RISKY';
}

// ─── Confidence score ─────────────────────────────────────────────────────────

export function computeConfidenceScore(
  metrics: MobileMetrics,
  signalCount: number
): number {
  const dataCoverage = (Math.min(metrics.totalApps, 50) / 50) * 40;
  const signalCoverage = (Math.min(signalCount, 10) / 10) * 30;
  const reviewVolume = Math.min(metrics.totalReviews / 10_000, 1) * 30;
  return Math.round(dataCoverage + signalCoverage + reviewVolume);
}

export function confidenceLabel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

// ─── Computed insights ────────────────────────────────────────────────────────

export function computeMarketInsights(metrics: MobileMetrics): string[] {
  const insights: string[] = [];
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  if (metrics.top5ReviewShare > 0.75) {
    insights.push(
      `Top 5 apps control ${pct(metrics.top5ReviewShare)} of all reviews`
    );
  } else if (metrics.top5ReviewShare > 0.5) {
    insights.push(
      `Top 5 apps hold ${pct(metrics.top5ReviewShare)} of all reviews`
    );
  }
  if (metrics.top1ReviewShare > TOP1_DOMINANT) {
    insights.push(
      `The #1 app alone accounts for ${pct(metrics.top1ReviewShare)} of all reviews`
    );
  }
  if (metrics.top10AvgRating > 4.6) {
    insights.push(
      `Top 10 apps average ${metrics.top10AvgRating.toFixed(2)} stars — the quality bar is very high`
    );
  } else if (metrics.top10AvgRating > 4.2) {
    insights.push(
      `Top 10 apps average ${metrics.top10AvgRating.toFixed(2)} stars`
    );
  }
  if (
    metrics.bottom40AvgRating > 0 &&
    metrics.top10AvgRating - metrics.bottom40AvgRating > 0.8
  ) {
    insights.push(
      `Weaker apps average ${metrics.bottom40AvgRating.toFixed(2)} stars — incumbents are significantly ahead`
    );
  }
  if (metrics.marketLocked) {
    insights.push(
      'Market is structurally locked: high ratings combined with concentrated reviews'
    );
  }
  if (metrics.ratingVariance < 0.1 && metrics.top10AvgRating > 4.0) {
    insights.push(
      'Ratings are tightly clustered — the market has matured and standardized'
    );
  }

  return insights.slice(0, 5);
}

export function computeOpportunityInsights(
  pain: PainAnalysis,
  bestNiche: NicheResult | undefined,
  metrics: MobileMetrics
): string[] {
  const insights: string[] = [];

  for (const { cluster, share } of pain.topPainClusters.slice(0, 2)) {
    if (cluster === 'pricing')
      insights.push(`${share}% of user signals mention pricing complaints`);
    else if (cluster === 'ux')
      insights.push(
        `UX/usability dissatisfaction detected in ${share}% of signals`
      );
    else if (cluster === 'missing_features')
      insights.push(
        `Users frequently request features incumbents don't provide (${share}% of signals)`
      );
    else if (cluster === 'performance')
      insights.push(`Performance complaints found in ${share}% of signals`);
    else if (cluster === 'bugs')
      insights.push(`Bug and stability complaints in ${share}% of signals`);
  }

  if (bestNiche && bestNiche.top5ReviewShare < metrics.top5ReviewShare * 0.7) {
    insights.push(
      `Niche angle "${bestNiche.query}" shows lower market concentration (${Math.round(bestNiche.top5ReviewShare * 100)}% vs ${Math.round(metrics.top5ReviewShare * 100)}% broad)`
    );
  }

  if (bestNiche?.keywordInTopTitles === false) {
    insights.push(
      `Keyword "${bestNiche.query}" isn't in any top-5 app title — organic ranking gap exists`
    );
  }
  if (bestNiche?.hasWeakIncumbents === true) {
    insights.push(
      `At least 2 of the top-5 apps in "${bestNiche.query}" are new with < 500 reviews — real entry window`
    );
  }

  if (pain.weightedScore >= 7) {
    insights.push(
      'Strong pain signals — real user frustration exists in this space'
    );
  } else if (pain.weightedScore <= 3) {
    insights.push(
      'Weak pain signals — users appear satisfied with existing solutions'
    );
  }

  return insights.slice(0, 5);
}

export function computeWinAngles(
  pain: PainAnalysis,
  bestNiche: NicheResult | undefined,
  metrics: MobileMetrics
): WinAngle[] {
  const angles: WinAngle[] = [];

  const clusterMap = new Map(
    pain.topPainClusters.map((c) => [c.cluster, c.share])
  );

  const pricingShare = clusterMap.get('pricing') ?? 0;
  const uxShare = clusterMap.get('ux') ?? 0;
  const featShare = clusterMap.get('missing_features') ?? 0;

  if (pricingShare > 20) {
    angles.push({
      title: 'Pricing gap',
      signal: `${pricingShare}% of signals mention pricing frustration`,
      angle:
        'Offer transparent or lower pricing to the price-sensitive segment',
    });
  }
  if (uxShare > 20) {
    angles.push({
      title: 'Complexity gap',
      signal: `UX complaints in ${uxShare}% of signals`,
      angle:
        'Simplified onboarding targeting users frustrated with current apps',
    });
  }
  if (featShare > 20) {
    angles.push({
      title: 'Workflow gap',
      signal: `Feature requests in ${featShare}% of signals`,
      angle: 'Ship the missing workflow incumbents consistently ignore',
    });
  }
  if (
    bestNiche &&
    bestNiche.marketDominance !== 'HIGH' &&
    bestNiche.totalApps >= 5
  ) {
    angles.push({
      title: 'Niche gap',
      signal: `"${bestNiche.query}" shows ${bestNiche.marketDominance.toLowerCase()} market concentration`,
      angle: `Target the "${bestNiche.query}" audience specifically — lower incumbent dominance`,
    });
  }
  if (
    angles.length < 2 &&
    metrics.top10AvgRating - metrics.bottom40AvgRating > 0.8
  ) {
    angles.push({
      title: 'Segment gap',
      signal:
        'Top apps skew heavily toward one segment, leaving weaker coverage elsewhere',
      angle: 'Target the underserved segment that incumbents overlook',
    });
  }

  return angles.slice(0, 3);
}

// ─── UI mapping ───────────────────────────────────────────────────────────────

export function mapToUIScores(
  scores: MobileScores,
  painWeightedScore: number
): {
  score: number;
  painScore: number;
  competitionScore: number;
  opportunityScore: number;
} {
  const painScore = Math.round(painWeightedScore * 10);
  const competitionScore = Math.round(scores.competitionScore * 10);
  const opportunityScore = Math.round(scores.opportunityScore * 10);
  const score = Math.round(
    opportunityScore * 0.6 + painScore * 0.25 + (100 - competitionScore) * 0.15
  );
  return { score, painScore, competitionScore, opportunityScore };
}

export function mapDecisionToUI(
  verdict: MobileDecision
): 'build' | 'proceed' | 'test-first' | 'niche-only' | 'pivot-angle' | 'drop' {
  if (verdict === 'BUILD') return 'build';
  if (verdict === 'RISKY' || verdict === 'TEST_FIRST') return 'test-first';
  if (verdict === 'NICHE_ONLY') return 'niche-only';
  if (verdict === 'PIVOT_ANGLE') return 'pivot-angle';
  return 'drop';
}
