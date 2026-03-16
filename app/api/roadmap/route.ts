import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildRoadmapMessages } from '@/prompts/roadmap.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { roadmapLimiter } from '@/lib/rate-limit';
import { validateIdeaSize } from '@/lib/validate-input';
import { RoadmapGraphSchema } from '@/lib/schemas';
import { withErrorHandling } from '@/lib/errors/api-handler';
import { AppError } from '@/lib/errors/app-error';
import type { Idea } from '@/types';
import type { RoadmapGraph } from '@/types/roadmap.types';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth();
  await checkRateLimit(roadmapLimiter, user.id);

  let idea: Idea;
  try {
    const body = await req.json();
    idea = body.idea;
  } catch {
    throw AppError.validation('Invalid request body');
  }

  if (!idea?.title) {
    throw AppError.validation('Idea is required');
  }

  validateIdeaSize(idea);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: buildRoadmapMessages(idea),
    temperature: 0.6,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  let roadmapJson: unknown = {};
  try {
    roadmapJson = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch { /* use empty fallback */ }
  const parsed = RoadmapGraphSchema.safeParse(roadmapJson);

  if (!parsed.success) {
    throw AppError.invalidAiResponse('Failed to generate roadmap.');
  }

  return NextResponse.json(parsed.data as RoadmapGraph);
});
