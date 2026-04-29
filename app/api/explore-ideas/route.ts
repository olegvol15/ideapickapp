import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/supabase/auth';
import { exploreIdeasLimiter } from '@/lib/rate-limit';
import { runExploreIdeas } from '@/services/explore-ideas.service';
import { AppError } from '@/lib/errors/app-error';
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

    const { interest, constraints, previousIdeas } = body as Record<string, unknown>;

    if (typeof interest !== 'string' || !interest.trim())
      throw AppError.validation('interest is required');
    if (interest.length > 100)
      throw AppError.validation('interest must be 100 characters or fewer');

    if (!Array.isArray(constraints))
      throw AppError.validation('constraints must be an array');
    if (constraints.some((c) => typeof c !== 'string'))
      throw AppError.validation('constraints must be strings');

    const prevIdeas =
      Array.isArray(previousIdeas) && previousIdeas.every((p) => typeof p === 'string')
        ? (previousIdeas as string[])
        : undefined;

    const ideas = await runExploreIdeas(interest.trim(), constraints as string[], prevIdeas);

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
