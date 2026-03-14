import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { buildExpandMessages } from '@/prompts/roadmap.prompts';
import type { ExpandRequest, RoadmapGraph } from '@/types/roadmap.types';

export async function POST(req: NextRequest) {
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

    const graph = JSON.parse(
      completion.choices[0]?.message?.content ?? '{}'
    ) as RoadmapGraph;

    return NextResponse.json(graph);
  } catch (err) {
    console.error('[/api/roadmap/expand]', err);
    return NextResponse.json(
      { error: 'Failed to expand node.' },
      { status: 500 }
    );
  }
}
