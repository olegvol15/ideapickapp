import { NextResponse } from 'next/server';
import { createClient } from './server';
import type { User } from '@supabase/supabase-js';
import type { Ratelimit } from '@upstash/ratelimit';

type AuthOk = { user: User; error: null };
type AuthErr = { user: null; error: NextResponse };

export async function requireAuth(): Promise<AuthOk | AuthErr> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user, error: null };
}

export async function checkRateLimit(
  limiter: Ratelimit,
  userId: string
): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await limiter.limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }
  return null;
}
