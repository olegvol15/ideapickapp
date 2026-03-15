import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildValidateMessages } from '@/prompts/validate.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { validateLimiter } from '@/lib/rate-limit';
import { validateIdeaSize } from '@/lib/validate-input';
import { ValidationResultSchema } from '@/lib/schemas';
import { withErrorHandling } from '@/lib/errors/api-handler';
import { AppError } from '@/lib/errors/app-error';
import type { Idea, ValidationResult } from '@/types';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth();
  await checkRateLimit(validateLimiter, user.id);

  let idea: Idea;
  try {
    const body = (await req.json()) as { idea?: Idea };
    if (!body.idea) {
      throw AppError.validation('Missing idea');
    }
    idea = body.idea;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.validation('Invalid request body');
  }

  validateIdeaSize(idea);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_tokens: 600,
    response_format: { type: 'json_object' },
    messages: buildValidateMessages(idea),
  });

  const parsed = ValidationResultSchema.safeParse(
    JSON.parse(completion.choices[0]?.message?.content ?? '{}')
  );

  if (!parsed.success) {
    throw AppError.invalidAiResponse('Validation failed. Please try again.');
  }

  return NextResponse.json(parsed.data as ValidationResult);
});
