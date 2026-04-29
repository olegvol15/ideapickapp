import { openai } from '@/lib/openai';
import { buildQuickValidateMessages } from '@/prompts/quick-validate.prompts';
import { QuickValidateResultSchema } from '@/lib/schemas';
import type { QuickValidateResult } from '@/lib/schemas';
import { AppError } from '@/lib/errors/app-error';

export async function runQuickValidate(
  description: string,
  audience: string,
  problem: string,
): Promise<QuickValidateResult> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: buildQuickValidateMessages(description, audience, problem),
    temperature: 0.4,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  });

  let json: unknown;
  try {
    json = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch {
    throw AppError.invalidAiResponse('Quick validation returned invalid JSON.');
  }

  const parsed = QuickValidateResultSchema.safeParse(json);
  if (!parsed.success) {
    throw AppError.invalidAiResponse('Quick validation failed. Please try again.');
  }

  return parsed.data;
}
