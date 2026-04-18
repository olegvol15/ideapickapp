import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import {
  buildValidationQueryMessages,
  buildCompetitorMessages,
  buildValidationAnalysisMessages,
  buildMobileAnalysisMessages,
} from '@/prompts/validate.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { validateLimiter } from '@/lib/rate-limit';
import { validateValidateInput } from '@/lib/validate-input';
import {
  EnhancedValidationResultSchema,
  MobileExplanationSchema,
} from '@/lib/schemas';
import type { EnhancedValidationResult } from '@/lib/schemas';
import { searchAll } from '@/lib/search';
import {
  fetchAppStoreApps,
  appToCompetitor,
  dedupeApps,
} from '@/lib/discovery/mobile';
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
import { expandKeywords } from '@/lib/keywords/expandKeywords';
import { selectBestNiche } from '@/lib/scoring/selectBestNiche';
import type { KeywordMarketAnalysis } from '@/lib/scoring/selectBestNiche';
import { AppError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger';
import type { ValidateRequest } from '@/types/validate.types';

export const POST = async (req: NextRequest): Promise<Response> => {
  let body: ValidateRequest;

  try {
    const user = await requireAuth();
    await checkRateLimit(validateLimiter, user.id);

    try {
      body = await req.json();
    } catch {
      throw AppError.validation('Invalid request body');
    }

    const { description, productType, audience, problem } = body;
    validateValidateInput(description, productType, audience, problem);
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        {
          status: 'error',
          code: err.errorCode,
          message: err.message,
          data: err.payload,
        },
        { status: err.statusCode, headers: err.headers }
      );
    }
    logger.error({ err, url: req.url }, 'Unhandled pre-stream error');
    return NextResponse.json(
      {
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
        data: {},
      },
      { status: 500 }
    );
  }

  const { description, productType, audience, problem } = body!;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        } catch {
          // Client disconnected before stream closed; swallow silently.
        }
      };

      try {
        // Step 1: In parallel — signal query + LLM competitors + keyword expansion (mobile only)
        const [queryCompletion, competitorCompletion, keywordExpansion] =
          await Promise.all([
            openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: buildValidationQueryMessages(
                description,
                productType,
                audience,
                problem
              ),
              temperature: 0.3,
              max_tokens: 150,
              response_format: { type: 'json_object' },
            }),
            openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: buildCompetitorMessages(
                description,
                productType,
                audience,
                problem
              ),
              temperature: 0.2,
              max_tokens: 600,
              response_format: { type: 'json_object' },
            }),
            productType === 'Mobile App'
              ? expandKeywords({ description, productType })
              : Promise.resolve(null),
          ]);

        let signalQuery: string | undefined;
        try {
          const q = JSON.parse(
            queryCompletion.choices[0]?.message?.content ?? '{}'
          );
          signalQuery = q.signalQuery;
        } catch {
          /* use empty fallback */
        }

        let llmCompetitors: Array<{
          name: string;
          url: string;
          source: string;
          snippet: string;
        }> = [];
        try {
          const c = JSON.parse(
            competitorCompletion.choices[0]?.message?.content ?? '{}'
          );
          llmCompetitors = Array.isArray(c.competitors) ? c.competitors : [];
        } catch {
          /* use empty fallback */
        }

        if (productType === 'Mobile App') {
          // Build keyword list — base + up to 5 variation/niche terms (max 6 total)
          const expansion = keywordExpansion ?? {
            base: description,
            variations: [],
            niches: [],
          };
          const allKeywords = [
            expansion.base,
            ...expansion.variations,
            ...expansion.niches,
          ].slice(0, 6);
          const [broadKeyword, ...extraKeywords] = allKeywords;

          // Step 2M: signals + base iTunes (50) + extra keyword iTunes (30 each) in parallel
          const [signalResults, broadApps, ...extraAppBatches] =
            await Promise.all([
              signalQuery
                ? searchAll([{ query: signalQuery, type: 'signal' }])
                : Promise.resolve([]),
              fetchAppStoreApps(broadKeyword, 50),
              ...extraKeywords.map((q) => fetchAppStoreApps(q, 30)),
            ]);

          // Deduplicated pool for UI competitor list
          const allApps = dedupeApps([...broadApps, ...extraAppBatches.flat()]);
          const appStoreCompetitors = allApps.slice(0, 10).map(appToCompetitor);
          const competitors = dedupeCompetitors([
            ...llmCompetitors.map((c) => ({
              ...c,
              type: 'competitor' as const,
            })),
            ...appStoreCompetitors.map((c) => ({
              ...c,
              type: 'competitor' as const,
            })),
            ...signalResults,
          ]);

          emit({ type: 'research', data: { competitors } });

          // Deterministic scoring pipeline — base market
          const onlySignals = signalResults.filter((r) => r.type === 'signal');
          const pain = computePainAnalysis(onlySignals);
          const metrics = computeAppStoreMetrics(broadApps);

          // Niche metrics for bestNiche bonus in base scoring (use extra keyword batches tagged as niches)
          const nicheKeywords = extraKeywords.slice(
            expansion.variations.length
          ); // niches portion only
          const niche0Apps = extraAppBatches[expansion.variations.length]; // first niche batch
          const legacyNicheResults = niche0Apps
            ? [
                computeNicheMetrics(
                  niche0Apps,
                  nicheKeywords[0] ?? extraKeywords[0]
                ),
              ]
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
          const confidenceScore = computeConfidenceScore(
            metrics,
            onlySignals.length
          );
          const marketInsights = computeMarketInsights(metrics);

          // Multi-keyword market analysis — score every keyword independently
          const keywordAnalyses: KeywordMarketAnalysis[] = [
            { keyword: broadKeyword, metrics, scores, decision: rawDecision },
            ...extraKeywords.map((keyword, i) => {
              const batch = extraAppBatches[i] ?? [];
              const km = computeAppStoreMetrics(batch);
              const ks = computeMobileScores(km, pain);
              const { verdict: kd } = computeDecision(ks, km);
              return { keyword, metrics: km, scores: ks, decision: kd };
            }),
          ];
          const nicheSelection = selectBestNiche(keywordAnalyses, broadKeyword);

          // Override entry strategy in decision if niche found
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
          const winAngles = computeWinAngles(
            pain,
            bestNicheForInsights,
            metrics
          );

          // Step 3M: LLM narrates the pre-computed result
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

          const explanationParsed =
            MobileExplanationSchema.safeParse(explanationJson);
          if (!explanationParsed.success) {
            throw AppError.invalidAiResponse(
              'Validation failed. Please try again.'
            );
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

          emit({ type: 'done', data: { result, competitors } });
        } else {
          // Step 2: Tavily signals (~2-4s)
          const signalResults = signalQuery
            ? await searchAll([{ query: signalQuery, type: 'signal' }])
            : [];

          const competitors = dedupeCompetitors([
            ...llmCompetitors.map((c) => ({
              ...c,
              type: 'competitor' as const,
            })),
            ...signalResults,
          ]);

          // Emit early — client shows progress while step 3 runs
          emit({ type: 'research', data: { competitors } });

          // Step 3: LLM validation analysis (~8-15s)
          const analysisCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: buildValidationAnalysisMessages(
              description,
              productType,
              audience,
              problem,
              competitors
            ),
            temperature: 0.4,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
          });

          let analysisJson: unknown = {};
          try {
            analysisJson = JSON.parse(
              analysisCompletion.choices[0]?.message?.content ?? '{}'
            );
          } catch {
            /* use empty fallback */
          }

          const parsed = EnhancedValidationResultSchema.safeParse(analysisJson);
          if (!parsed.success) {
            throw AppError.invalidAiResponse(
              'Validation failed. Please try again.'
            );
          }

          emit({ type: 'done', data: { result: parsed.data, competitors } });
        }
      } catch (err) {
        if (err instanceof AppError) {
          if (err.statusCode >= 500) logger.error({ err }, err.message);
          emit({ type: 'error', message: err.message, status: err.statusCode });
        } else {
          logger.error({ err }, 'Unhandled stream error');
          emit({ type: 'error', message: 'Something went wrong', status: 500 });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
};

function dedupeCompetitors<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (const item of items) {
    const key = item.url.split('?')[0];
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}
