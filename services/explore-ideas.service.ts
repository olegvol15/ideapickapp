import { openai } from '@/lib/openai';
import { buildExploreIdeasMessages } from '@/prompts/explore-ideas.prompts';
import { ExploreResultSchema } from '@/lib/schemas';
import type { ExploreIdea } from '@/lib/schemas';
import { AppError } from '@/lib/errors/app-error';

export async function runExploreIdeas(
  interest: string,
  constraints: string[],
  previousIdeas?: string[],
): Promise<ExploreIdea[]> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: buildExploreIdeasMessages(interest, constraints, previousIdeas),
    temperature: 0.7,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  });

  let json: unknown;
  try {
    json = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch {
    throw AppError.invalidAiResponse('Idea exploration returned invalid JSON.');
  }

  const parsed = ExploreResultSchema.safeParse(json);
  if (!parsed.success) {
    throw AppError.invalidAiResponse('Idea exploration failed. Please try again.');
  }

  return parsed.data.ideas;
}
