import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildExpandMessages } from '@/prompts/roadmap.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { expandLimiter } from '@/lib/rate-limit';
import { validateExpandInput } from '@/lib/validate-input';
import { RoadmapGraphSchema } from '@/lib/schemas';
import type { ExpandRequest, RoadmapGraph } from '@/types/roadmap.types';

export async function POST(req: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await checkRateLimit(expandLimiter, user.id);
  if (rateLimitError) return rateLimitError;
  let body: ExpandRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { ideaTitle, ideaPitch, nodeId, nodeLabel, parentPath } = body;

  if (!nodeId || !nodeLabel) {
    return NextResponse.json(
      { error: 'nodeId and nodeLabel are required' },
      { status: 400 }
    );
  }

  const inputError = validateExpandInput(ideaTitle, ideaPitch, nodeId, nodeLabel, parentPath);
  if (inputError) return inputError;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: buildExpandMessages(
        ideaTitle,
        ideaPitch,
        nodeId,
        nodeLabel,
        parentPath
      ),
      temperature: 0.6,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const parsed = RoadmapGraphSchema.safeParse(
      JSON.parse(completion.choices[0]?.message?.content ?? '{}')
    );

    if (!parsed.success) {
      console.error('[/api/roadmap/expand] invalid LLM output', parsed.error.flatten());
      return NextResponse.json(
        { error: 'Failed to expand node.' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed.data as RoadmapGraph);
  } catch (err) {
    console.error('[/api/roadmap/expand]', err);
    return NextResponse.json(
      { error: 'Failed to expand node.' },
      { status: 500 }
    );
  }
}
