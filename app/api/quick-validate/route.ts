import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/supabase/auth';
import { quickValidateLimiter } from '@/lib/rate-limit';
import { runQuickValidate } from '@/services/quick-validate.service';
import { AppError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger';

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw AppError.authRequired();

    await checkRateLimit(quickValidateLimiter, user.id);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw AppError.validation('Invalid request body');
    }

    const { description, audience, problem } = body as Record<string, unknown>;

    if (typeof description !== 'string' || !description.trim())
      throw AppError.validation('description is required');
    if (description.length > 600)
      throw AppError.validation('description must be 600 characters or fewer');

    if (typeof audience !== 'string' || !audience.trim())
      throw AppError.validation('audience is required');
    if (audience.length > 200)
      throw AppError.validation('audience must be 200 characters or fewer');

    if (typeof problem !== 'string' || !problem.trim())
      throw AppError.validation('problem is required');
    if (problem.length > 400)
      throw AppError.validation('problem must be 400 characters or fewer');

    const result = await runQuickValidate(
      description.trim(),
      audience.trim(),
      problem.trim(),
    );

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(
        {
          status: 'error',
          code: err.errorCode,
          message: err.message,
          data: err.payload,
        },
        { status: err.statusCode, headers: err.headers },
      );
    }
    logger.error({ err }, 'Unhandled quick-validate error');
    return NextResponse.json(
      {
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
        data: {},
      },
      { status: 500 },
    );
  }
};
