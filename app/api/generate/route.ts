import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { discoverCompetitors } from '@/lib/discovery/router';
import {
  buildQueryGenerationMessages,
  buildAnalysisMessages,
} from '@/prompts/generate.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { generateLimiter } from '@/lib/rate-limit';
import { validateGenerateInput } from '@/lib/validate-input';
import { GenerateLLMOutputSchema } from '@/lib/schemas';
import { AppError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger';
import type { GenerateRequest, GenerateResponse } from '@/types';

export const POST = async (req: NextRequest): Promise<Response> => {
  // Auth, rate-limit, and input validation must complete before streaming starts
  // so the client receives the correct HTTP status code on those failures.
  let body: GenerateRequest;

  try {
    const user = await requireAuth();
    await checkRateLimit(generateLimiter, user.id);

    try {
      body = await req.json();
    } catch {
      throw AppError.validation('Invalid request body');
    }

    const { prompt, productType = '', difficulty = '' } = body;
    if (!prompt?.trim()) throw AppError.validation('Prompt is required');
    validateGenerateInput(prompt, productType, difficulty);
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

  const { prompt, productType = '', difficulty = '' } = body!;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));

      try {
        // Step 1: Generate focused search queries
        const queryCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: buildQueryGenerationMessages(prompt, productType),
          temperature: 0.4,
          max_tokens: 100,
          response_format: { type: 'json_object' },
        });

        let parsedQueries: { queries?: string[] } = {};
        try {
          parsedQueries = JSON.parse(
            queryCompletion.choices[0]?.message?.content ?? '{}'
          );
        } catch { /* use empty fallback */ }
        const { queries = [] } = parsedQueries;

        // Step 2: Discover competitors via product-type-aware strategy
        const competitors = await discoverCompetitors(queries.slice(0, 3), productType);

        // Emit early — client shows progress while step 3 runs (~15–30 s)
        emit({ type: 'competitors', data: competitors });

        // Step 3: Analyze landscape and generate 3 grounded ideas
        const analysisCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: buildAnalysisMessages(prompt, competitors, productType, difficulty),
          temperature: 0.7,
          max_tokens: 4500,
          response_format: { type: 'json_object' },
        });

        let analysisJson: unknown = {};
        try {
          analysisJson = JSON.parse(
            analysisCompletion.choices[0]?.message?.content ?? '{}'
          );
        } catch { /* use empty fallback */ }

        const parsed = GenerateLLMOutputSchema.safeParse(analysisJson);
        if (!parsed.success) {
          throw AppError.invalidAiResponse('Failed to generate ideas. Please try again.');
        }

        const result: GenerateResponse = {
          ...parsed.data,
          competitors,
          marketContext: {
            ...parsed.data.marketContext,
            competitorsFound: competitors.length,
          },
        };

        emit({ type: 'done', data: result });
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
