import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildValidateMessages } from '@/prompts/validate.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { validateLimiter } from '@/lib/rate-limit';
import { validateIdeaSize } from '@/lib/validate-input';
import { ValidationResultSchema } from '@/lib/schemas';
import type { Idea, ValidationResult } from '@/types';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await checkRateLimit(validateLimiter, user.id);
  if (rateLimitError) return rateLimitError;
  let idea: Idea;
  try {
    const body = (await req.json()) as { idea?: Idea };
    if (!body.idea) {
      return NextResponse.json({ error: 'Missing idea' }, { status: 400 });
    }
    idea = body.idea;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const inputError = validateIdeaSize(idea);
  if (inputError) return inputError;

  try {
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
      console.error('[/api/validate] invalid LLM output', parsed.error.flatten());
      return NextResponse.json(
        { error: 'Validation failed. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed.data as ValidationResult);
  } catch (err) {
    console.error('[/api/validate]', err);
    return NextResponse.json(
      { error: 'Validation failed. Please try again.' },
      { status: 500 }
    );
  }
}
