import { openai } from '@/lib/openai';
import {
  buildCompetitorListMessages,
  buildCompetitorOpinionMessages,
} from '@/prompts/validate.prompts';
import {
  CompetitorListLLMSchema,
  CompetitorOpinionLLMSchema,
} from '@/lib/schemas';
import type { CompetitorInsight, CompetitorListLLM } from '@/lib/schemas';
import {
  collectOpinionMaterials,
  resolveOpinionBullets,
} from '@/lib/evidence/competitor-opinions';

interface CompetitorAnalysisParams {
  description: string;
  productType: string;
  audience?: string;
  problem?: string;
}

type NamedCompetitor = CompetitorListLLM['competitors'][number];

async function completeJson(
  messages: ReturnType<typeof buildCompetitorListMessages>,
  temperature: number,
  maxTokens: number
): Promise<unknown> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  });
  try {
    return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch {
    return {};
  }
}

async function identifyCompetitors(
  params: CompetitorAnalysisParams
): Promise<NamedCompetitor[]> {
  const json = await completeJson(
    buildCompetitorListMessages(
      params.description,
      params.productType,
      params.audience,
      params.problem
    ),
    0.2,
    500
  );
  const parsed = CompetitorListLLMSchema.safeParse(json);
  return parsed.success ? parsed.data.competitors : [];
}

async function buildInsight(
  competitor: NamedCompetitor,
  params: CompetitorAnalysisParams
): Promise<CompetitorInsight> {
  const base: CompetitorInsight = {
    name: competitor.name,
    url: competitor.url,
    description: competitor.description,
    likes: [],
    dislikes: [],
  };

  try {
    const materials = await collectOpinionMaterials(
      competitor.name,
      params.productType
    );
    const json = await completeJson(
      buildCompetitorOpinionMessages(params.description, competitor, materials),
      0.4,
      600
    );
    const parsed = CompetitorOpinionLLMSchema.safeParse(json);
    if (!parsed.success) return base;
    return {
      ...base,
      likes: resolveOpinionBullets(parsed.data.likes, materials),
      dislikes: resolveOpinionBullets(parsed.data.dislikes, materials),
      edge: parsed.data.edge,
    };
  } catch {
    return base;
  }
}

// Best-effort: any failure yields fewer (or no) competitor cards rather
// than failing the validation.
export async function analyzeCompetitors(
  params: CompetitorAnalysisParams
): Promise<CompetitorInsight[]> {
  try {
    const competitors = await identifyCompetitors(params);
    return await Promise.all(
      competitors.map((competitor) => buildInsight(competitor, params))
    );
  } catch {
    return [];
  }
}
