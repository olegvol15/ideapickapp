import { openai } from '@/lib/openai';
import { buildValidationAnalysisMessages } from '@/prompts/validate.prompts';
import { EnhancedValidationResultSchema } from '@/lib/schemas';
import type { EnhancedValidationResult } from '@/lib/schemas';
import { searchAll } from '@/lib/search';
import { dedupeCompetitors } from '@/lib/validate/competitors';
import { AppError } from '@/lib/errors/app-error';
import type { Competitor } from '@/types';

interface SaasValidationParams {
  description: string;
  productType: string;
  audience: string | undefined;
  problem: string | undefined;
  signalQuery: string | undefined;
  llmCompetitors: Array<{
    name: string;
    url: string;
    source: string;
    snippet: string;
  }>;
  onResearch: (competitors: Competitor[]) => void;
}

export async function runSaasValidation(
  params: SaasValidationParams
): Promise<{ result: EnhancedValidationResult; competitors: Competitor[] }> {
  const {
    description,
    productType,
    audience,
    problem,
    signalQuery,
    llmCompetitors,
    onResearch,
  } = params;

  // Fetch Tavily signals
  const signalResults = signalQuery
    ? await searchAll([{ query: signalQuery, type: 'signal' }])
    : [];

  const competitors = dedupeCompetitors([
    ...llmCompetitors.map((c) => ({ ...c, type: 'competitor' as const })),
    ...signalResults,
  ]);

  onResearch(competitors);

  // LLM validation analysis
  const analysisCompletion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: buildValidationAnalysisMessages(
      description,
      productType,
      audience,
      problem,
      competitors
    ),
    temperature: 0.4,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  let analysisJson: unknown = {};
  try {
    analysisJson = JSON.parse(
      analysisCompletion.choices[0]?.message?.content ?? '{}'
    );
  } catch {
    /* use empty fallback */
  }

  const parsed = EnhancedValidationResultSchema.safeParse(analysisJson);
  if (!parsed.success) {
    throw AppError.invalidAiResponse('Validation failed. Please try again.');
  }

  return { result: parsed.data, competitors };
}
