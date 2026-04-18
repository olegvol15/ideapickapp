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
import { EnhancedValidationResultSchema, MobileExplanationSchema } from '@/lib/schemas';
import type { EnhancedValidationResult } from '@/lib/schemas';
import { searchAll } from '@/lib/search';
import { fetchAppStoreApps, appToCompetitor } from '@/lib/discovery/mobile';
import {
  computeAppStoreMetrics,
  computePainSignalScore,
  computeMobileScores,
  computeDecision,
  mapToUIScores,
  mapDecisionToUI,
} from '@/lib/scoring/mobile';
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
        { status: 'error', code: err.errorCode, message: err.message, data: err.payload },
        { status: err.statusCode, headers: err.headers }
      );
    }
    logger.error({ err, url: req.url }, 'Unhandled pre-stream error');
    return NextResponse.json(
      { status: 'error', code: 'INTERNAL_ERROR', message: 'Something went wrong', data: {} },
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
        // Step 1: In parallel — generate signal query + LLM competitor list (~1s)
        const [queryCompletion, competitorCompletion] = await Promise.all([
          openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: buildValidationQueryMessages(description, productType, audience, problem),
            temperature: 0.3,
            max_tokens: 150,
            response_format: { type: 'json_object' },
          }),
          openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: buildCompetitorMessages(description, productType, audience, problem),
            temperature: 0.2,
            max_tokens: 600,
            response_format: { type: 'json_object' },
          }),
        ]);

        let signalQuery: string | undefined;
        try {
          const q = JSON.parse(queryCompletion.choices[0]?.message?.content ?? '{}');
          signalQuery = q.signalQuery;
        } catch { /* use empty fallback */ }

        let llmCompetitors: Array<{ name: string; url: string; source: string; snippet: string }> = [];
        try {
          const c = JSON.parse(competitorCompletion.choices[0]?.message?.content ?? '{}');
          llmCompetitors = Array.isArray(c.competitors) ? c.competitors : [];
        } catch { /* use empty fallback */ }

        if (productType === 'Mobile App') {
          // Step 2M: Fetch 50 App Store apps + Tavily signals in parallel (~2-4s)
          const [signalResults, rawApps] = await Promise.all([
            signalQuery
              ? searchAll([{ query: signalQuery, type: 'signal' }])
              : Promise.resolve([]),
            fetchAppStoreApps(description, 50),
          ]);

          const appStoreCompetitors = rawApps.slice(0, 10).map(appToCompetitor);
          const competitors = dedupeCompetitors([
            ...llmCompetitors.map((c) => ({ ...c, type: 'competitor' as const })),
            ...appStoreCompetitors.map((c) => ({ ...c, type: 'competitor' as const })),
            ...signalResults,
          ]);

          emit({ type: 'research', data: { competitors } });

          // Deterministic scoring
          const metrics = computeAppStoreMetrics(rawApps);
          const painSignalScore = computePainSignalScore(
            signalResults.filter((r) => r.type === 'signal')
          );
          const scores = computeMobileScores(metrics, painSignalScore);
          const { verdict: rawDecision, reason: rawReason } = computeDecision(scores);
          const uiScores = mapToUIScores(scores, painSignalScore);
          const decision = mapDecisionToUI(rawDecision);

          // Step 3M: LLM explains the already-computed result (~6-10s)
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
              rawReason
            ),
            temperature: 0.4,
            max_tokens: 1500,
            response_format: { type: 'json_object' },
          });

          let explanationJson: unknown = {};
          try {
            explanationJson = JSON.parse(
              analysisCompletion.choices[0]?.message?.content ?? '{}'
            );
          } catch { /* use empty fallback */ }

          const explanationParsed = MobileExplanationSchema.safeParse(explanationJson);
          if (!explanationParsed.success) {
            throw AppError.invalidAiResponse('Validation failed. Please try again.');
          }

          const result: EnhancedValidationResult = {
            ...explanationParsed.data,
            ...uiScores,
            decision,
            decisionReason: rawReason,
            metrics,
            rawScores: scores,
            rawDecision,
          };

          emit({ type: 'done', data: { result, competitors } });
        } else {
          // Step 2: Tavily signals (~2-4s)
          const signalResults = signalQuery
            ? await searchAll([{ query: signalQuery, type: 'signal' }])
            : [];

          const competitors = dedupeCompetitors([
            ...llmCompetitors.map((c) => ({ ...c, type: 'competitor' as const })),
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
          } catch { /* use empty fallback */ }

          const parsed = EnhancedValidationResultSchema.safeParse(analysisJson);
          if (!parsed.success) {
            throw AppError.invalidAiResponse('Validation failed. Please try again.');
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
