import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { openai } from '@/lib/openai';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { refineLimiter } from '@/lib/rate-limit';
import { withErrorHandling } from '@/lib/errors/api-handler';
import { AppError } from '@/lib/errors/app-error';
import { buildContentMessages } from '@/prompts/content.prompts';

const BodySchema = z.object({
  type: z.enum(['tweet', 'reddit']),
  goal: z.enum(['validate', 'community', 'features', 'launch']),
  idea: z.object({
    title: z.string().max(200),
    pitch: z.string().max(600),
    audience: z.string().max(300),
    problem: z.string().max(400),
  }),
  stepContext: z.string().max(300).optional(),
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth();
  await checkRateLimit(refineLimiter, user.id);

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    throw AppError.validation('Invalid request body');
  }

  const { type, goal, idea, stepContext } = body;
  const maxTokens = type === 'tweet' ? 150 : 500;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: maxTokens,
    messages: buildContentMessages(type, idea, goal, stepContext),
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw AppError.ai('LLM returned empty response');

  return NextResponse.json({ content: raw.trim() });
});
