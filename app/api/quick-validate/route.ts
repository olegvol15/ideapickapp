import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/supabase/auth';
import { quickValidateLimiter } from '@/lib/rate-limit';
import { runQuickValidate } from '@/services/quick-validate.service';
import { AppError } from '@/lib/errors/app-error';
import { QuickValidateRequestSchema } from '@/lib/schemas';
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

    const parsed = QuickValidateRequestSchema.safeParse(body);
    if (!parsed.success) throw AppError.validation(parsed.error.issues[0]?.message ?? 'Invalid input');

    const { description, audience, problem } = parsed.data;

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
