import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import {
  buildValidationQueryMessages,
  buildCompetitorMessages,
  buildValidationAnalysisMessages,
} from '@/prompts/validate.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { validateLimiter } from '@/lib/rate-limit';
import { validateValidateInput } from '@/lib/validate-input';
import { EnhancedValidationResultSchema } from '@/lib/schemas';
import { searchAll } from '@/lib/search';
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
      const emit = (event: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));

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

        // Step 2: Tavily — signals only (Reddit/forum pain signals) (~2-4s)
        const signalResults = signalQuery
          ? await searchAll([{ query: signalQuery, type: 'signal' }])
          : [];

        const competitors = [
          ...llmCompetitors.map((c) => ({ ...c, type: 'competitor' as const })),
          ...signalResults,
        ];

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
