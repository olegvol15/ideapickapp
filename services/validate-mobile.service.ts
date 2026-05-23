import { openai } from '@/lib/openai';
import { buildMobileAnalysisMessages } from '@/prompts/validate.prompts';
import { MobileExplanationSchema } from '@/lib/schemas';
import type { EnhancedValidationResult } from '@/lib/schemas';
import {
  fetchAppStoreApps,
  appToCompetitor,
  dedupeApps,
  fetchAppStoreReviews,
  extractTrackId,
  searchGooglePlay,
} from '@/lib/discovery/mobile';
import type { AppStoreApp, AppStoreReview } from '@/lib/discovery/mobile';
import {
  computeAppStoreMetrics,
  computeNicheMetrics,
  computePainAnalysis,
  computeMobileScores,
  computeDecision,
  computeDimensionScores,
  computeFinalDecision,
  computeFinalScore,
  computeMarketInsights,
  computeOpportunityInsights,
  computeWinAngles,
  mapToUIScores,
  mapDecisionToUI,
  confidenceLabel,
} from '@/lib/scoring/mobile';
import type { DimensionScores } from '@/lib/scoring/mobile';
import {
  buildEvidenceQuality,
  buildReviewPainSnippets,
  computeEvidenceConfidenceScore,
  entryScore,
  extractReviewThemes,
  filterRelevantApps,
} from '@/lib/scoring/mobile-evidence';
import { selectBestNiche } from '@/lib/scoring/selectBestNiche';
import type { KeywordMarketAnalysis } from '@/lib/scoring/selectBestNiche';
import { dedupeCompetitors } from '@/lib/validate/competitors';
import { AppError } from '@/lib/errors/app-error';
import { searchAll } from '@/lib/search';
import type { KeywordExpansion } from '@/lib/keywords/expandKeywords';
import type { Competitor } from '@/types';

interface MobileValidationParams {
  description: string;
  productType: string;
  audience: string | undefined;
  problem: string | undefined;
  monetization: string | undefined;
  differentiation: string | undefined;
  signalQuery: string | undefined;
  llmCompetitors: Array<{
    name: string;
    url: string;
    source: string;
    snippet: string;
  }>;
  expansion: KeywordExpansion;
  onResearch: (competitors: Competitor[]) => void;
}

export async function runMobileValidation(
  params: MobileValidationParams
): Promise<{ result: EnhancedValidationResult; competitors: Competitor[] }> {
  const {
    description,
    productType,
    audience,
    problem,
    monetization,
    differentiation,
    signalQuery,
    llmCompetitors,
    expansion,
    onResearch,
  } = params;

  // Build keyword list — base + up to 5 variation/niche terms (max 6 total)
  const allKeywords = [
    expansion.base,
    ...expansion.variations,
    ...expansion.niches,
  ].slice(0, 6);
  const [broadKeyword, ...extraKeywords] = allKeywords;

  // Fetch signals, App Store, and Google Play results in parallel
  const [signalResults, googlePlayApps, broadApps, ...extraAppBatches] = await Promise.all([
    signalQuery
      ? searchAll([{ query: signalQuery, type: 'signal' }])
      : Promise.resolve([]),
    searchGooglePlay(broadKeyword),
    fetchAppStoreApps(broadKeyword, 50),
    ...extraKeywords.map((q) => fetchAppStoreApps(q, 30)),
  ]);

  const evidenceContext = { description, audience, problem };

  // Build keyword→apps maps (raw + relevance-filtered)
  const keywordAppMap = new Map<string, AppStoreApp[]>([
    [broadKeyword, broadApps],
    ...extraKeywords.map(
      (kw, i) => [kw, extraAppBatches[i] ?? []] as [string, AppStoreApp[]]
    ),
  ]);
  const relevantKeywordAppMap = new Map(
    [...keywordAppMap.entries()].map(([keyword, apps]) => [
      keyword,
      filterRelevantApps(apps, keyword, evidenceContext),
    ])
  );

  // Deduplicated competitor list for UI — relevance first, review volume second.
  const rawAllApps = dedupeApps([...broadApps, ...extraAppBatches.flat()]);
  const relevantAllApps = dedupeApps(
    [...relevantKeywordAppMap.values()]
      .flat()
      .sort(
        (a, b) =>
          b.relevanceScore - a.relevanceScore ||
          (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0)
      )
  );
  const appStoreCompetitors = relevantAllApps.slice(0, 10).map(appToCompetitor);

  // Build name→App Store data lookup to enrich LLM competitors
  const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const appStoreByName = new Map(
    appStoreCompetitors.map((a) => [normName(a.name), a])
  );

  const enrichedLlm = llmCompetitors.map((c) => {
    const normC = normName(c.name);
    const appData =
      appStoreByName.get(normC) ??
      [...appStoreByName.entries()].find(
        ([k]) => k.startsWith(normC) || normC.startsWith(k)
      )?.[1];
    return {
      ...c,
      type: 'competitor' as const,
      ...(appData
        ? {
            source: 'appstore' as const,
            rating: appData.rating,
            reviewCount: appData.reviewCount,
            revenueEstimate: appData.revenueEstimate,
            platform: appData.platform,
            iconUrl: appData.iconUrl,
          }
        : {}),
    };
  });

  // Only keep LLM competitors that were confirmed by the App Store search.
  // Unmatched entries are web-platform guesses with no real App Store data.
  const confirmedLlm = enrichedLlm.filter((c) => c.source === 'appstore');

  const competitors = dedupeCompetitors([
    ...confirmedLlm,
    ...appStoreCompetitors.map((c) => ({ ...c, type: 'competitor' as const })),
    ...googlePlayApps.map((c) => ({ ...c, type: 'competitor' as const })),
    ...signalResults,
  ]);

  onResearch(competitors);

  // Fetch real App Store reviews for top relevant incumbents and weak entrants.
  const topByReviews = [...relevantAllApps]
    .sort((a, b) => (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0))
    .slice(0, 3);
  const weakerEntrants = [...relevantAllApps]
    .filter((a) => (a.averageUserRating ?? 5) < 4.2)
    .sort(
      (a, b) =>
        (a.averageUserRating ?? 5) - (b.averageUserRating ?? 5) ||
        (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
    )
    .slice(0, 2);
  const reviewTargets = dedupeApps([...topByReviews, ...weakerEntrants]).slice(
    0,
    5
  );

  const reviewBatches = await Promise.all(
    reviewTargets.map((app) => {
      const id = app.trackId ?? extractTrackId(app.trackViewUrl);
      return id ? fetchAppStoreReviews(id, 20) : Promise.resolve<AppStoreReview[]>([]);
    })
  );

  const competitorReviews = new Map<string, AppStoreReview[]>(
    reviewTargets.map((app, i) => [app.trackName, reviewBatches[i] ?? []])
  );
  const deterministicReviewThemes = extractReviewThemes(reviewBatches);
  const reviewPainSignals: Competitor[] = buildReviewPainSnippets(
    deterministicReviewThemes
  ).map((item, i) => ({
    name: `App Store review theme ${i + 1}`,
    url: `appstore-review-theme:${i + 1}`,
    source: 'appstore-reviews',
    snippet: item.snippet,
    type: 'signal' as const,
  }));

  // Deterministic scoring — base market, using relevance-filtered apps only.
  const onlySignals = signalResults.filter((r) => r.type === 'signal');
  const pain = computePainAnalysis([...onlySignals, ...reviewPainSignals]);
  const broadRelevantApps = relevantKeywordAppMap.get(broadKeyword) ?? [];
  const metrics = computeAppStoreMetrics(broadRelevantApps);

  // Niche metrics for bestNiche bonus — relevance-filtered by keyword.
  const nicheKeywords = expansion.niches.filter((kw) => keywordAppMap.has(kw));
  const legacyNicheResults = nicheKeywords
    .map((keyword) => {
      const apps = relevantKeywordAppMap.get(keyword) ?? [];
      return apps.length > 0 ? computeNicheMetrics(apps, keyword) : null;
    })
    .filter((n): n is NonNullable<typeof n> => n !== null);
  const bestNicheLegacy = legacyNicheResults
    .filter((n) => n.totalApps >= 5)
    .sort((a, b) => a.top5ReviewShare - b.top5ReviewShare)[0];

  const scores = computeMobileScores(metrics, pain, bestNicheLegacy);
  const marketInsights = computeMarketInsights(metrics);

  // Preliminary broad decision (no niche awareness yet — used to seed selectBestNiche)
  const { verdict: broadDecision } = computeDecision(scores, metrics);

  // Multi-keyword market analysis — score every keyword independently
  const keywordAnalyses: KeywordMarketAnalysis[] = allKeywords.map((keyword) => {
    const batch = relevantKeywordAppMap.get(keyword) ?? [];
    const km = keyword === broadKeyword ? metrics : computeAppStoreMetrics(batch);
    const ks = keyword === broadKeyword ? scores : computeMobileScores(km, pain);
    const { verdict } =
      keyword === broadKeyword ? { verdict: broadDecision } : computeDecision(ks, km);
    return { keyword, metrics: km, scores: ks, decision: verdict };
  });
  const keywordMarkets = keywordAnalyses.map((analysis) => {
    const relevantApps = relevantKeywordAppMap.get(analysis.keyword) ?? [];
    const avgRelevance =
      relevantApps.length > 0
        ? Math.round(
            relevantApps.reduce((sum, app) => sum + app.relevanceScore, 0) /
              relevantApps.length
          )
        : 0;
    return {
      keyword: analysis.keyword,
      relevanceScore: avgRelevance,
      rawAppCount: keywordAppMap.get(analysis.keyword)?.length ?? 0,
      relevantAppCount: relevantApps.length,
      metrics: analysis.metrics,
      scores: analysis.scores,
      entryScore: entryScore(analysis.scores),
    };
  });
  const discardedKeywords = keywordMarkets
    .filter((k) => k.rawAppCount > 0 && (k.relevantAppCount < 3 || k.relevanceScore < 30))
    .map((k) => k.keyword);
  const evidenceQuality = buildEvidenceQuality({
    rawApps: rawAllApps.length,
    relevantApps: relevantAllApps.length,
    reviewsAnalyzed: reviewBatches.flat().length,
    keywordMarkets,
    discardedKeywords,
    signalCount: onlySignals.length,
  });
  const confidenceScore = computeEvidenceConfidenceScore({
    relevantApps: relevantAllApps.length,
    totalReviews: metrics.totalReviews,
    reviewsAnalyzed: evidenceQuality.reviewsAnalyzed,
    keywordRelevance: evidenceQuality.keywordRelevance,
    signalCount: onlySignals.length,
  });
  const nicheSelection = selectBestNiche(keywordAnalyses, broadKeyword);
  const bestEntryStrategy = nicheSelection.entryStrategy;

  // Initial deterministic decision — includes NICHE_ONLY detection
  const { verdict: rawDecision, reason: rawReason } = computeDecision(
    scores,
    metrics,
    nicheSelection.entryStrategy
  );

  // Deterministic dimension scores (partial — LLM dims added after LLM call)
  const deterministicDims = computeDimensionScores(
    metrics,
    pain,
    nicheSelection.entryStrategy,
    nicheSelection.bestKeywordScores.opportunityScore
  );

  const uiScores = mapToUIScores(scores, pain.weightedScore);

  const bestNicheForInsights =
    nicheSelection.entryStrategy === 'ENTER_VIA_NICHE'
      ? (legacyNicheResults.find(
          (n) => n.query === nicheSelection.bestKeyword
        ) ?? bestNicheLegacy)
      : bestNicheLegacy;

  const opportunityInsights = computeOpportunityInsights(
    pain,
    bestNicheForInsights,
    metrics
  );
  const winAngles = computeWinAngles(pain, bestNicheForInsights, metrics);

  // LLM narrates the pre-computed result and assesses LLM-only dimensions
  const analysisCompletion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: buildMobileAnalysisMessages(
      description,
      productType,
      audience,
      problem,
      competitors,
      metrics,
      scores,
      uiScores,
      rawDecision,
      rawReason,
      pain,
      marketInsights,
      opportunityInsights,
      winAngles,
      confidenceScore,
      monetization,
      competitorReviews,
      differentiation,
      deterministicDims
    ),
    temperature: 0.4,
    max_tokens: 2800,
    response_format: { type: 'json_object' },
  });

  let explanationJson: unknown = {};
  try {
    explanationJson = JSON.parse(
      analysisCompletion.choices[0]?.message?.content ?? '{}'
    );
  } catch {
    /* use empty fallback */
  }

  const explanationParsed = MobileExplanationSchema.safeParse(explanationJson);
  if (!explanationParsed.success) {
    throw AppError.invalidAiResponse('Validation failed. Please try again.');
  }

  // Merge deterministic + LLM-assessed dimension scores
  const mergedDims: DimensionScores = {
    ...deterministicDims,
    mvpSimplicity: explanationParsed.data.llmDimensionScores?.mvpSimplicity ?? 5,
    distributionAccess:
      explanationParsed.data.llmDimensionScores?.distributionAccess ?? 5,
    monetizationPotential:
      explanationParsed.data.llmDimensionScores?.monetizationPotential ?? 5,
    coldStartRisk:
      explanationParsed.data.llmDimensionScores?.coldStartRisk ?? 5,
  };

  // Final decision and score using merged dimensions
  const finalRawDecision = computeFinalDecision(mergedDims, rawDecision);
  const decision = mapDecisionToUI(finalRawDecision);
  const newScore = computeFinalScore(mergedDims);

  const result: EnhancedValidationResult = {
    ...explanationParsed.data,
    ...uiScores,
    score: newScore,
    decision,
    decisionReason: rawReason,
    confidence: confidenceLabel(confidenceScore),
    metrics,
    rawScores: scores,
    rawDecision,
    painAnalysis: pain,
    niches: legacyNicheResults,
    evidenceQuality,
    keywordMarkets,
    marketInsights,
    opportunityInsights,
    confidenceScore,
    dimensionScores: mergedDims,
    nicheAnalysis: {
      evaluatedKeywords: nicheSelection.evaluatedKeywords,
      bestKeyword: nicheSelection.bestKeyword,
      bestKeywordScores: nicheSelection.bestKeywordScores,
      alternativeKeywords: nicheSelection.alternativeKeywords,
      reasoning: nicheSelection.reasoning,
      comparisonNote: nicheSelection.comparisonNote || undefined,
    },
    bestEntryStrategy,
    reviewThemes:
      deterministicReviewThemes.length > 0
        ? deterministicReviewThemes
        : explanationParsed.data.reviewThemes,
  };

  // Attach real review snippets to competitors so the UI can display them
  const reviewsByNorm = new Map(
    [...competitorReviews.entries()].map(([name, reviews]) => [normName(name), reviews])
  );

  const enrichedCompetitors = competitors.map((c) => {
    const normC = normName(c.name);
    const appReviews =
      reviewsByNorm.get(normC) ??
      [...reviewsByNorm.entries()].find(
        ([k]) => k.startsWith(normC) || normC.startsWith(k)
      )?.[1];

    if (!appReviews || appReviews.length === 0) return c;

    const complaint = appReviews
      .filter((r) => r.rating <= 3 && r.body.trim().length > 20)
      .slice(0, 1)
      .map((r) => ({ rating: r.rating, body: r.body.trim().slice(0, 140), sentiment: 'complaint' as const }));

    const positive = appReviews
      .filter((r) => r.rating >= 4 && r.body.trim().length > 20)
      .slice(0, 1)
      .map((r) => ({ rating: r.rating, body: r.body.trim().slice(0, 140), sentiment: 'positive' as const }));

    const snippets = [...complaint, ...positive];
    return snippets.length > 0 ? { ...c, reviews: snippets } : c;
  });

  return { result, competitors: enrichedCompetitors };
}
