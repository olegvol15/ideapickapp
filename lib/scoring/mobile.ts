import type { AppStoreApp } from '@/lib/discovery/mobile';
import type { Competitor } from '@/types';

// ─── Thresholds ───────────────────────────────────────────────────────────────

const SATURATION_HIGH = 30;
const SATURATION_EXTREME = 45;
const RATING_HIGH = 4.0;
const RATING_VERY_HIGH = 4.5;
const REVIEWS_HIGH = 1000;
const REVIEWS_VERY_HIGH = 5000;
const TOP5_SHARE_DOMINANT = 0.6;
const TOP5_SHARE_VERY_DOMINANT = 0.8;
const PAIN_KEYWORDS = [
  'problem', 'issue', 'bad', 'hate', 'missing',
  'frustrat', 'broken', 'crash', 'terrible', 'awful',
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface MobileMetrics {
  totalApps: number;
  avgRating: number;
  avgReviews: number;
  totalReviews: number;
  top5ReviewShare: number;
  ratingDistributionAbove45: number;
}

export interface MobileScores {
  competitionScore: number;
  saturationScore: number;
  qualityBarrierScore: number;
  marketPowerScore: number;
  opportunityScore: number;
}

export type MobileDecision = 'BUILD' | 'RISKY' | 'DO_NOT_BUILD';

// ─── Metrics ──────────────────────────────────────────────────────────────────

export function computeAppStoreMetrics(apps: AppStoreApp[]): MobileMetrics {
  if (apps.length === 0) {
    return { totalApps: 0, avgRating: 0, avgReviews: 0, totalReviews: 0, top5ReviewShare: 0, ratingDistributionAbove45: 0 };
  }

  const totalApps = apps.length;
  const ratedApps = apps.filter((a) => a.averageUserRating != null);
  const avgRating =
    ratedApps.length > 0
      ? ratedApps.reduce((s, a) => s + a.averageUserRating!, 0) / ratedApps.length
      : 0;

  const reviewedApps = apps.filter((a) => a.userRatingCount != null);
  const totalReviews = reviewedApps.reduce((s, a) => s + a.userRatingCount!, 0);
  const avgReviews = reviewedApps.length > 0 ? totalReviews / reviewedApps.length : 0;

  const sorted = [...reviewedApps].sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0));
  const top5Reviews = sorted.slice(0, 5).reduce((s, a) => s + (a.userRatingCount ?? 0), 0);
  const top5ReviewShare = totalReviews > 0 ? top5Reviews / totalReviews : 0;

  const ratingDistributionAbove45 =
    ratedApps.length > 0
      ? ratedApps.filter((a) => (a.averageUserRating ?? 0) >= RATING_VERY_HIGH).length / ratedApps.length
      : 0;

  return { totalApps, avgRating, avgReviews, totalReviews, top5ReviewShare, ratingDistributionAbove45 };
}

// ─── Pain signal score ────────────────────────────────────────────────────────

export function computePainSignalScore(signalResults: Competitor[]): number {
  if (signalResults.length === 0) return 5;

  const totalHits = signalResults.reduce((sum, r) => {
    const text = r.snippet.toLowerCase();
    return sum + PAIN_KEYWORDS.filter((k) => text.includes(k)).length;
  }, 0);

  const avgHits = totalHits / signalResults.length;
  return Math.min(10, Math.round((avgHits / 3) * 10));
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function computeMobileScores(metrics: MobileMetrics, painSignalScore: number): MobileScores {
  let competitionScore = 0;
  if (metrics.totalApps >= SATURATION_EXTREME) competitionScore += 4;
  else if (metrics.totalApps >= SATURATION_HIGH) competitionScore += 2;
  if (metrics.avgRating >= RATING_VERY_HIGH) competitionScore += 2;
  else if (metrics.avgRating >= RATING_HIGH) competitionScore += 1;
  if (metrics.top5ReviewShare >= TOP5_SHARE_VERY_DOMINANT) competitionScore += 3;
  else if (metrics.top5ReviewShare >= TOP5_SHARE_DOMINANT) competitionScore += 2;
  competitionScore = Math.min(10, competitionScore);

  let saturationScore = 0;
  if (metrics.totalApps >= SATURATION_EXTREME) saturationScore = 8;
  else if (metrics.totalApps >= SATURATION_HIGH) saturationScore = 5;
  else if (metrics.totalApps > 10) saturationScore = 3;

  let qualityBarrierScore = 0;
  if (metrics.avgRating >= RATING_VERY_HIGH) qualityBarrierScore += 4;
  else if (metrics.avgRating >= RATING_HIGH) qualityBarrierScore += 2;
  if (metrics.avgReviews >= REVIEWS_VERY_HIGH) qualityBarrierScore += 3;
  else if (metrics.avgReviews >= REVIEWS_HIGH) qualityBarrierScore += 2;
  if (metrics.ratingDistributionAbove45 >= 0.7) qualityBarrierScore += 3;
  qualityBarrierScore = Math.min(10, qualityBarrierScore);

  let marketPowerScore = 0;
  if (metrics.top5ReviewShare >= TOP5_SHARE_VERY_DOMINANT) marketPowerScore = 9;
  else if (metrics.top5ReviewShare >= TOP5_SHARE_DOMINANT) marketPowerScore = 6;
  else if (metrics.top5ReviewShare >= 0.4) marketPowerScore = 4;

  const baseOpportunity = Math.max(
    0,
    10 - Math.round((competitionScore + qualityBarrierScore + marketPowerScore) / 3)
  );
  const opportunityScore = Math.round((baseOpportunity * 7 + painSignalScore * 3) / 10);

  return { competitionScore, saturationScore, qualityBarrierScore, marketPowerScore, opportunityScore };
}

// ─── Decision ─────────────────────────────────────────────────────────────────

export function computeDecision(scores: MobileScores): { verdict: MobileDecision; reason: string } {
  if (scores.competitionScore >= 8 && scores.marketPowerScore >= 7) {
    return {
      verdict: 'DO_NOT_BUILD',
      reason: 'Highly saturated. Incumbents dominate by review volume.',
    };
  }
  if (
    scores.competitionScore >= 6 ||
    scores.marketPowerScore >= 6 ||
    scores.qualityBarrierScore >= 7
  ) {
    return {
      verdict: 'RISKY',
      reason: 'Competitive market. Quality bar is high.',
    };
  }
  return {
    verdict: 'BUILD',
    reason: 'Market has room. Limited incumbent dominance.',
  };
}

// ─── UI mapping ───────────────────────────────────────────────────────────────

export function mapToUIScores(
  scores: MobileScores,
  painSignalScore: number
): { score: number; painScore: number; competitionScore: number; opportunityScore: number } {
  const painScore = painSignalScore * 10;
  const competitionScore = scores.competitionScore * 10;
  const opportunityScore = scores.opportunityScore * 10;
  const score = Math.round((painScore + (100 - competitionScore) + opportunityScore) / 3);
  return { score, painScore, competitionScore, opportunityScore };
}

export function mapDecisionToUI(verdict: MobileDecision): 'proceed' | 'test-first' | 'drop' {
  if (verdict === 'BUILD') return 'proceed';
  if (verdict === 'RISKY') return 'test-first';
  return 'drop';
}
