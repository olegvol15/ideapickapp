import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildValidateMessages } from '@/prompts/validate.prompts';
import type { Idea, ValidationResult } from '@/types';

export async function POST(req: NextRequest) {
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

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: buildValidateMessages(idea),
    });

    const result = JSON.parse(
      completion.choices[0]?.message?.content ?? '{}'
    ) as ValidationResult;

    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/validate]', err);
    return NextResponse.json(
      { error: 'Validation failed. Please try again.' },
      { status: 500 }
    );
  }
}
