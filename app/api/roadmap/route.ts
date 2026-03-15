import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildRoadmapMessages } from '@/prompts/roadmap.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { roadmapLimiter } from '@/lib/rate-limit';
import type { Idea } from '@/types';
import type { RoadmapGraph } from '@/types/roadmap.types';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await checkRateLimit(roadmapLimiter, user.id);
  if (rateLimitError) return rateLimitError;
  let idea: Idea;
  try {
    const body = await req.json();
    idea = body.idea;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  if (!idea?.title) {
    return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: buildRoadmapMessages(idea),
      temperature: 0.6,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const graph = JSON.parse(
      completion.choices[0]?.message?.content ?? '{}'
    ) as RoadmapGraph;

    return NextResponse.json(graph);
  } catch (err) {
    console.error('[/api/roadmap]', err);
    return NextResponse.json(
      { error: 'Failed to generate roadmap.' },
      { status: 500 }
    );
  }
}
