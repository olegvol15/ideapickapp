import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildRefineMessages } from '@/prompts/refine.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { refineLimiter } from '@/lib/rate-limit';
import { validateInstruction, validateIdeaSize } from '@/lib/validate-input';
import { IdeaSchema } from '@/lib/schemas';
import { withErrorHandling } from '@/lib/errors/api-handler';
import { AppError } from '@/lib/errors/app-error';
import type { Idea } from '@/types';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth();
  await checkRateLimit(refineLimiter, user.id);

  let idea: Idea;
  let instruction: string;

  try {
    const body = (await req.json()) as { idea?: Idea; instruction?: string };
    if (!body.idea || !body.instruction) {
      throw AppError.validation('Missing idea or instruction');
    }
    idea = body.idea;
    instruction = body.instruction;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw AppError.validation('Invalid request body');
  }

  validateInstruction(instruction);
  validateIdeaSize(idea);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.6,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
    messages: buildRefineMessages(idea, instruction),
  });

  const parsed = IdeaSchema.safeParse(
    JSON.parse(completion.choices[0]?.message?.content ?? '{}')
  );

  if (!parsed.success) {
    throw AppError.invalidAiResponse('Refinement failed. Please try again.');
  }

  return NextResponse.json(parsed.data as Idea);
});
