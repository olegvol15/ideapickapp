import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildRefineMessages } from '@/prompts/refine.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { refineLimiter } from '@/lib/rate-limit';
import type { Idea } from '@/types';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await checkRateLimit(refineLimiter, user.id);
  if (rateLimitError) return rateLimitError;

  let idea: Idea;
  let instruction: string;

  try {
    const body = (await req.json()) as { idea?: Idea; instruction?: string };
    if (!body.idea || !body.instruction) {
      return NextResponse.json(
        { error: 'Missing idea or instruction' },
        { status: 400 }
      );
    }
    idea = body.idea;
    instruction = body.instruction;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: buildRefineMessages(idea, instruction),
    });

    const refined = JSON.parse(
      completion.choices[0]?.message?.content ?? '{}'
    ) as Idea;

    return NextResponse.json(refined);
  } catch (err) {
    console.error('[/api/refine]', err);
    return NextResponse.json(
      { error: 'Refinement failed. Please try again.' },
      { status: 500 }
    );
  }
}
