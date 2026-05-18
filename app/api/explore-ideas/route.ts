import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/supabase/auth';
import { exploreIdeasLimiter } from '@/lib/rate-limit';
import { runExploreIdeas } from '@/services/explore-ideas.service';
import { AppError } from '@/lib/errors/app-error';
import { ExploreIdeasRequestSchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw AppError.authRequired();

    await checkRateLimit(exploreIdeasLimiter, user.id);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw AppError.validation('Invalid request body');
    }

    const parsed = ExploreIdeasRequestSchema.safeParse(body);
    if (!parsed.success) throw AppError.validation(parsed.error.issues[0]?.message ?? 'Invalid input');

    const { interest, constraints, previousIdeas } = parsed.data;

    const ideas = await runExploreIdeas(interest.trim(), constraints, previousIdeas);

    return NextResponse.json({ ideas });
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
    logger.error({ err }, 'Unhandled explore-ideas error');
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
