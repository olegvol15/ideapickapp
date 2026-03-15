import { createClient } from './server';
import { AppError } from '../errors/app-error';
import type { User } from '@supabase/supabase-js';
import type { Ratelimit } from '@upstash/ratelimit';

export async function requireAuth(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw AppError.authRequired();
  }

  return user;
}

export async function checkRateLimit(
  limiter: Ratelimit,
  userId: string
): Promise<void> {
  const { success, reset } = await limiter.limit(userId);
  if (!success) {
    throw AppError.rateLimit(reset - Date.now());
  }
}
