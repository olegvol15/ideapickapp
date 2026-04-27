import { openai } from '@/lib/openai';
import { buildMobileAnalysisMessages } from '@/prompts/validate.prompts';
import { MobileExplanationSchema } from '@/lib/schemas';
import type { EnhancedValidationResult } from '@/lib/schemas';
import {
  fetchAppStoreApps,
  appToCompetitor,
  dedupeApps,
} from '@/lib/discovery/mobile';
import type { AppStoreApp } from '@/lib/discovery/mobile';
import {
  computeAppStoreMetrics,
  computeNicheMetrics,
  computePainAnalysis,
  computeMobileScores,
  computeDecision,
  computeConfidenceScore,
  computeMarketInsights,
  computeOpportunityInsights,
  computeWinAngles,
  mapToUIScores,
  mapDecisionToUI,
  confidenceLabel,
} from '@/lib/scoring/mobile';
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

  // Fetch signals + App Store results in parallel
  const [signalResults, broadApps, ...extraAppBatches] = await Promise.all([
    signalQuery
      ? searchAll([{ query: signalQuery, type: 'signal' }])
      : Promise.resolve([]),
    fetchAppStoreApps(broadKeyword, 50),
    ...extraKeywords.map((q) => fetchAppStoreApps(q, 30)),
  ]);

  // Build keyword→apps map (eliminates positional indexing)
  const keywordAppMap = new Map<string, AppStoreApp[]>([
    [broadKeyword, broadApps],
    ...extraKeywords.map(
      (kw, i) => [kw, extraAppBatches[i] ?? []] as [string, AppStoreApp[]]
    ),
  ]);

  // Deduplicated competitor list for UI
  const allApps = dedupeApps([...broadApps, ...extraAppBatches.flat()]);
  const appStoreCompetitors = allApps.slice(0, 10).map(appToCompetitor);

  // Build name→App Store data lookup to enrich LLM competitors
  const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const appStoreByName = new Map(
    appStoreCompetitors.map((a) => [normName(a.name), a])
  );

  const enrichedLlm = llmCompetitors.map((c) => {
    const appData = appStoreByName.get(normName(c.name));
    return {
      ...c,
      type: 'competitor' as const,
      ...(appData
        ? {
            rating: appData.rating,
            reviewCount: appData.reviewCount,
            revenueEstimate: appData.revenueEstimate,
            platform: appData.platform,
          }
        : {}),
    };
  });

  const competitors = dedupeCompetitors([
    ...enrichedLlm,
    ...appStoreCompetitors.map((c) => ({ ...c, type: 'competitor' as const })),
    ...signalResults,
  ]);

  onResearch(competitors);

  // Deterministic scoring — base market
  const onlySignals = signalResults.filter((r) => r.type === 'signal');
  const pain = computePainAnalysis(onlySignals);
  const metrics = computeAppStoreMetrics(broadApps);

  // Niche metrics for bestNiche bonus — look up by keyword name
  const nicheKeywords = expansion.niches.filter((kw) => keywordAppMap.has(kw));
  const niche0Apps = nicheKeywords[0]
    ? (keywordAppMap.get(nicheKeywords[0]) ?? [])
    : [];
  const legacyNicheResults =
    niche0Apps.length > 0
      ? [computeNicheMetrics(niche0Apps, nicheKeywords[0])]
      : [];
  const bestNicheLegacy = legacyNicheResults
    .filter((n) => n.totalApps >= 5)
    .sort((a, b) => a.top5ReviewShare - b.top5ReviewShare)[0];

  const scores = computeMobileScores(metrics, pain, bestNicheLegacy);
  const { verdict: rawDecision, reason: rawReason } = computeDecision(
    scores,
    metrics
  );
  const uiScores = mapToUIScores(scores, pain.weightedScore);
  const decision = mapDecisionToUI(rawDecision);
  const confidenceScore = computeConfidenceScore(metrics, onlySignals.length);
  const marketInsights = computeMarketInsights(metrics);

  // Multi-keyword market analysis — score every keyword independently
  const keywordAnalyses: KeywordMarketAnalysis[] = [
    { keyword: broadKeyword, metrics, scores, decision: rawDecision },
    ...[...expansion.variations, ...expansion.niches]
      .filter((kw) => keywordAppMap.has(kw))
      .map((keyword) => {
        const batch = keywordAppMap.get(keyword)!;
        const km = computeAppStoreMetrics(batch);
        const ks = computeMobileScores(km, pain);
        const { verdict: kd } = computeDecision(ks, km);
        return { keyword, metrics: km, scores: ks, decision: kd };
      }),
  ];
  const nicheSelection = selectBestNiche(keywordAnalyses, broadKeyword);
  const bestEntryStrategy = nicheSelection.entryStrategy;

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

  // LLM narrates the pre-computed result
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
      confidenceScore
    ),
    temperature: 0.4,
    max_tokens: 1800,
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

  const result: EnhancedValidationResult = {
    ...explanationParsed.data,
    ...uiScores,
    decision,
    decisionReason: rawReason,
    confidence: confidenceLabel(confidenceScore),
    metrics,
    rawScores: scores,
    rawDecision,
    painAnalysis: pain,
    niches: legacyNicheResults,
    marketInsights,
    opportunityInsights,
    confidenceScore,
    nicheAnalysis: {
      evaluatedKeywords: nicheSelection.evaluatedKeywords,
      bestKeyword: nicheSelection.bestKeyword,
      bestKeywordScores: nicheSelection.bestKeywordScores,
      alternativeKeywords: nicheSelection.alternativeKeywords,
      reasoning: nicheSelection.reasoning,
      comparisonNote: nicheSelection.comparisonNote || undefined,
    },
    bestEntryStrategy,
  };

  return { result, competitors };
}
