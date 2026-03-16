import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkEmailLimiter } from '@/lib/rate-limit';
import { withErrorHandling } from '@/lib/errors/api-handler';
import { AppError } from '@/lib/errors/app-error';

const BodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success, reset } = await checkEmailLimiter.limit(ip);
  if (!success) throw AppError.rateLimit(reset - Date.now());

  let email: string;
  try {
    const body = await req.json();
    ({ email } = BodySchema.parse(body));
  } catch {
    throw AppError.validation('Invalid email');
  }

  const url = new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`);
  url.searchParams.set('filter', email);
  url.searchParams.set('per_page', '1');

  const res = await fetch(url.toString(), {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
  });

  if (!res.ok) throw AppError.internal();

  const { users } = await res.json() as { users: unknown[] };
  return NextResponse.json({ exists: users.length > 0 });
});
