import type {
  MobileMetrics,
  MobileScores,
  MobileDecision,
} from '@/lib/scoring/mobile';

export interface KeywordMarketAnalysis {
  keyword: string;
  metrics: MobileMetrics;
  scores: MobileScores;
  decision: MobileDecision;
}

export interface NicheSelectionResult {
  bestKeyword: string;
  bestKeywordScores: MobileScores;
  bestKeywordMetrics: MobileMetrics;
  reasoning: string;
  comparisonNote: string;
  evaluatedKeywords: string[];
  alternativeKeywords: string[];
  entryStrategy: 'ENTER_VIA_NICHE' | 'BROAD_MARKET' | 'NO_VIABLE_ENTRY';
}

// score = opportunityScore * 0.5 + (10 - competitionScore) * 0.5
function entryScore(scores: MobileScores): number {
  return scores.opportunityScore * 0.5 + (10 - scores.competitionScore) * 0.5;
}

export function selectBestNiche(
  markets: KeywordMarketAnalysis[],
  baseKeyword: string
): NicheSelectionResult {
  if (markets.length === 0) {
    return {
      bestKeyword: baseKeyword,
      bestKeywordScores: emptyScores(),
      bestKeywordMetrics: emptyMetrics(),
      reasoning: 'No market data available.',
      comparisonNote: '',
      evaluatedKeywords: [],
      alternativeKeywords: [],
      entryStrategy: 'NO_VIABLE_ENTRY',
    };
  }

  const evaluatedKeywords = markets.map((m) => m.keyword);
  const baseMarket = markets.find((m) => m.keyword === baseKeyword);
  const nonBaseMarkets = markets.filter((m) => m.keyword !== baseKeyword);

  const scoredNonBase = nonBaseMarkets
    .map((m) => ({ ...m, entry: entryScore(m.scores) }))
    .sort((a, b) => b.entry - a.entry);

  const baseEntry = baseMarket ? entryScore(baseMarket.scores) : 0;
  const baseIsLowCompetition = (baseMarket?.scores.competitionScore ?? 10) < 4;

  // Select best: prefer non-base unless base has unusually low competition and outscores
  let best: KeywordMarketAnalysis;
  if (scoredNonBase.length > 0) {
    const topNiche = scoredNonBase[0];
    if (baseIsLowCompetition && baseMarket && baseEntry > topNiche.entry) {
      best = baseMarket;
    } else {
      best = topNiche;
    }
  } else {
    best = baseMarket ?? markets[0];
  }

  let bestIsBase = best.keyword === baseKeyword;
  const baseDecision = baseMarket?.decision;

  // Determine entry strategy
  let entryStrategy: 'ENTER_VIA_NICHE' | 'BROAD_MARKET' | 'NO_VIABLE_ENTRY';

  const allUnviable = markets.every(
    (m) =>
      m.decision === 'DO_NOT_BUILD' ||
      (m.decision === 'RISKY' && m.scores.opportunityScore < 3)
  );

  // Niche advantage threshold: niche entry score must beat base by ≥40% to override
  const NICHE_ADVANTAGE_THRESHOLD = 0.4;

  if (allUnviable) {
    entryStrategy = 'NO_VIABLE_ENTRY';
  } else if (bestIsBase) {
    const topNiche = scoredNonBase[0];
    const nicheE = topNiche?.entry ?? 0;
    if (topNiche && nicheE > baseEntry * (1 + NICHE_ADVANTAGE_THRESHOLD)) {
      best = topNiche;
      bestIsBase = false;
      entryStrategy = 'ENTER_VIA_NICHE';
    } else {
      entryStrategy = 'BROAD_MARKET';
    }
  } else if (baseDecision === 'DO_NOT_BUILD' || baseDecision === 'RISKY') {
    entryStrategy = 'ENTER_VIA_NICHE';
  } else {
    entryStrategy = 'BROAD_MARKET';
  }

  // Build human-readable reasoning
  const describeMarket = (m: KeywordMarketAnalysis) =>
    `${m.decision === 'BUILD' ? 'viable' : m.decision === 'RISKY' ? 'risky' : 'saturated'} ` +
    `(opportunity ${m.scores.opportunityScore.toFixed(1)}/10, competition ${m.scores.competitionScore.toFixed(1)}/10)`;

  const reasoning = bestIsBase
    ? `The base market "${best.keyword}" offers the best entry — ${describeMarket(best)}.`
    : `Broad market "${baseKeyword}" is ${describeMarket(baseMarket ?? best)}, but "${best.keyword}" shows ${describeMarket(best)}.`;

  const comparisonNote =
    !bestIsBase && baseMarket
      ? `Broad: "${baseKeyword}" — competition ${baseMarket.scores.competitionScore.toFixed(1)}/10, opportunity ${baseMarket.scores.opportunityScore.toFixed(1)}/10. ` +
        `Best niche: "${best.keyword}" — competition ${best.scores.competitionScore.toFixed(1)}/10, opportunity ${best.scores.opportunityScore.toFixed(1)}/10.`
      : '';

  const alternativeKeywords = scoredNonBase
    .filter((m) => m.keyword !== best.keyword)
    .slice(0, 2)
    .map((m) => m.keyword);

  return {
    bestKeyword: best.keyword,
    bestKeywordScores: best.scores,
    bestKeywordMetrics: best.metrics,
    reasoning,
    comparisonNote,
    evaluatedKeywords,
    alternativeKeywords,
    entryStrategy,
  };
}

function emptyScores(): MobileScores {
  return {
    competitionScore: 5,
    saturationScore: 5,
    qualityBarrierScore: 5,
    marketPowerScore: 5,
    opportunityScore: 5,
  };
}

function emptyMetrics(): MobileMetrics {
  return {
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
}
