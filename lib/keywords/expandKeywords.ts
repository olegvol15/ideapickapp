import { openai } from '@/lib/openai';
import { buildKeywordExpansionMessages } from '@/prompts/validate.prompts';

export interface KeywordExpansion {
  base: string;
  variations: string[];
  niches: string[];
}

export async function expandKeywords(input: {
  description: string;
  productType: string;
}): Promise<KeywordExpansion> {
  const fallback: KeywordExpansion = {
    base: input.description.slice(0, 50).trim(),
    variations: [],
    niches: [],
  };

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: buildKeywordExpansionMessages(input.description),
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}');

    return {
      base:
        typeof raw.base === 'string' && raw.base.trim()
          ? raw.base.trim()
          : fallback.base,
      variations: Array.isArray(raw.variations)
        ? (raw.variations as unknown[])
            .filter((v): v is string => typeof v === 'string')
            .slice(0, 3)
        : [],
      niches: Array.isArray(raw.niches)
        ? (raw.niches as unknown[])
            .filter((v): v is string => typeof v === 'string')
            .slice(0, 3)
        : [],
    };
  } catch {
    return fallback;
  }
}
