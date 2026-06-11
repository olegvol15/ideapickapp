import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { validateLimiter, validateDailyLimiter } from '@/lib/rate-limit';
import { validateValidateInput } from '@/lib/validate-input';
import { runPainEvidenceValidation } from '@/services/validate-evidence.service';
import { AppError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger';
import type { ValidateRequest } from '@/types/validate.types';

export const POST = async (req: NextRequest): Promise<Response> => {
  let body: ValidateRequest;

  try {
    const user = await requireAuth();
    await checkRateLimit(validateLimiter, user.id);
    await checkRateLimit(validateDailyLimiter, user.id);

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
        const { result, sources } = await runPainEvidenceValidation({
          description,
          productType,
          audience,
          problem,
          onSources: (s) => emit({ type: 'sources', data: { sources: s } }),
        });
        emit({ type: 'done', data: { result, sources } });
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
