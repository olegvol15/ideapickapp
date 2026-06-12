import { openai } from '@/lib/openai';
import {
  buildCompetitorListMessages,
  buildCompetitorOpinionMessages,
  buildMentionedProductsMessages,
} from '@/prompts/validate.prompts';
import {
  CompetitorListLLMSchema,
  CompetitorOpinionLLMSchema,
  MentionedProductsLLMSchema,
} from '@/lib/schemas';
import type { CompetitorInsight } from '@/lib/schemas';
import {
  collectOpinionMaterials,
  resolveOpinionBullets,
} from '@/lib/evidence/competitor-opinions';
import type { OpinionMaterial } from '@/lib/evidence/competitor-opinions';
import type { CompetitorCandidate } from '@/lib/evidence/competitor-candidates';
import type { PooledQuote } from '@/lib/evidence/quote-pool';

interface CompetitorAnalysisParams {
  description: string;
  productType: string;
  audience?: string;
  problem?: string;
}

const FALLBACK_DESCRIPTION =
  'Mentioned by users in the collected complaints.';

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

export async function identifyKnownCompetitors(
  params: CompetitorAnalysisParams
): Promise<CompetitorCandidate[]> {
  try {
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
    if (!parsed.success) return [];
    return parsed.data.competitors.map((competitor) => ({
      ...competitor,
      lane: 'known' as const,
    }));
  } catch {
    return [];
  }
}

export async function extractMentionedProducts(
  pool: PooledQuote[]
): Promise<CompetitorCandidate[]> {
  if (pool.length === 0) return [];
  try {
    const json = await completeJson(
      buildMentionedProductsMessages(
        pool.map((quote) => ({ id: quote.id, text: quote.text }))
      ),
      0.2,
      400
    );
    const parsed = MentionedProductsLLMSchema.safeParse(json);
    if (!parsed.success) return [];

    return parsed.data.products.flatMap((product) => {
      const quoteIds = product.quoteIds.filter(
        (id) => pool[id] && pool[id].id === id
      );
      if (quoteIds.length === 0) return [];
      return [{ name: product.name, lane: 'mentioned' as const, quoteIds }];
    });
  } catch {
    return [];
  }
}

function citedQuoteMaterials(
  candidate: CompetitorCandidate,
  pool: PooledQuote[]
): OpinionMaterial[] {
  return (candidate.quoteIds ?? []).flatMap((id, index) => {
    const quote = pool[id];
    if (!quote) return [];
    return [
      {
        id: `Q${index}`,
        text: quote.text,
        label: quote.sourceLabel,
        url: quote.url,
        kind: 'mixed' as const,
      },
    ];
  });
}

async function buildInsight(
  candidate: CompetitorCandidate,
  params: CompetitorAnalysisParams,
  pool: PooledQuote[]
): Promise<CompetitorInsight> {
  const base: CompetitorInsight = {
    name: candidate.name,
    url: candidate.url,
    description: candidate.description ?? FALLBACK_DESCRIPTION,
    likes: [],
    dislikes: [],
    origin: candidate.lane === 'mentioned' ? 'mentioned' : 'market',
    mentionCount: candidate.quoteIds?.length || undefined,
  };

  try {
    const materials = [
      ...(await collectOpinionMaterials(candidate, params.productType)),
      ...citedQuoteMaterials(candidate, pool),
    ];
    const json = await completeJson(
      buildCompetitorOpinionMessages(
        params.description,
        { name: candidate.name, description: base.description },
        materials
      ),
      0.4,
      600
    );
    const parsed = CompetitorOpinionLLMSchema.safeParse(json);
    if (!parsed.success) return base;
    return {
      ...base,
      description:
        candidate.description ?? parsed.data.description ?? base.description,
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
export async function buildCompetitorInsights(
  candidates: CompetitorCandidate[],
  params: CompetitorAnalysisParams,
  pool: PooledQuote[]
): Promise<CompetitorInsight[]> {
  try {
    return await Promise.all(
      candidates.map((candidate) => buildInsight(candidate, params, pool))
    );
  } catch {
    return [];
  }
}
