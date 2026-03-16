import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildExpandMessages } from '@/prompts/roadmap.prompts';
import { requireAuth, checkRateLimit } from '@/lib/supabase/auth';
import { expandLimiter } from '@/lib/rate-limit';
import { validateExpandInput } from '@/lib/validate-input';
import { RoadmapGraphSchema } from '@/lib/schemas';
import { withErrorHandling } from '@/lib/errors/api-handler';
import { AppError } from '@/lib/errors/app-error';
import type { ExpandRequest, RoadmapGraph } from '@/types/roadmap.types';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth();
  await checkRateLimit(expandLimiter, user.id);

  let body: ExpandRequest;
  try {
    body = await req.json();
  } catch {
    throw AppError.validation('Invalid request body');
  }

  const { ideaTitle, ideaPitch, nodeId, nodeLabel, parentPath } = body;

  if (!nodeId || !nodeLabel) {
    throw AppError.validation('nodeId and nodeLabel are required');
  }

  validateExpandInput(ideaTitle, ideaPitch, nodeId, nodeLabel, parentPath);

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

  let expandJson: unknown = {};
  try {
    expandJson = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch { /* use empty fallback */ }
  const parsed = RoadmapGraphSchema.safeParse(expandJson);

  if (!parsed.success) {
    throw AppError.invalidAiResponse('Failed to expand node.');
  }

  return NextResponse.json(parsed.data as RoadmapGraph);
});
