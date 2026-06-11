import { openai } from '@/lib/openai';
import {
  buildPainQueryMessages,
  buildThemeClusterMessages,
} from '@/prompts/validate.prompts';
import {
  PainQueryResponseSchema,
  ThemeClusterLLMSchema,
} from '@/lib/schemas';
import type {
  PainEvidenceResult,
  PainQueryResponse,
  ThemeClusterLLM,
} from '@/lib/schemas';
import { searchPainQuotes } from '@/lib/evidence/web-quotes';
import {
  assembleResult,
  buildQuotePool,
  emptyResult,
  formatQuoteAccountingIssues,
  hasQuoteAccountingIssues,
  validateQuoteAccounting,
} from '@/lib/evidence/quote-pool';
import { AppError } from '@/lib/errors/app-error';
import type { EvidenceSource } from '@/types/validate.types';

interface PainEvidenceParams {
  description: string;
  productType: string;
  audience?: string;
  problem?: string;
  onSources: (sources: EvidenceSource[]) => void;
}

const CLUSTER_BATCH_SIZE = 25;

async function clusterPainQuotes(
  problemStatement: string,
  pool: ReturnType<typeof buildQuotePool>,
  correction?: string
): Promise<ThemeClusterLLM | null> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: buildThemeClusterMessages(problemStatement, pool, correction),
    temperature: 0.4,
    max_tokens: 3500,
    response_format: { type: 'json_object' },
  });

  let clusterJson: unknown = {};
  try {
    clusterJson = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch {
    /* fall through to schema failure */
  }

  const clusters = ThemeClusterLLMSchema.safeParse(clusterJson);
  return clusters.success ? clusters.data : null;
}

async function clusterPainQuoteBatch(
  problemStatement: string,
  batch: ReturnType<typeof buildQuotePool>
): Promise<ThemeClusterLLM> {
  try {
    let clusters = await clusterPainQuotes(problemStatement, batch);
    let correction =
      clusters === null
        ? 'The response did not match the required JSON schema. Include summary, themes, evidenceType, and excluded.'
        : '';
    let accounting = clusters
      ? validateQuoteAccounting(batch.length, clusters)
      : null;

    if (accounting && hasQuoteAccountingIssues(accounting)) {
      correction = formatQuoteAccountingIssues(accounting);
    }

    if (!clusters || (accounting && hasQuoteAccountingIssues(accounting))) {
      clusters = await clusterPainQuotes(problemStatement, batch, correction);
      accounting = clusters
        ? validateQuoteAccounting(batch.length, clusters)
        : null;
    }

    if (clusters && accounting && !hasQuoteAccountingIssues(accounting)) {
      return clusters;
    }
  } catch {
    // Classification is best-effort. Collected evidence must still be shown.
  }

  return {
    summary: 'This evidence batch could not be classified automatically.',
    themes: [
      {
        label: 'Related evidence, unclassified',
        evidenceType: 'related',
        quoteIds: batch.map((quote) => quote.id),
      },
    ],
    excluded: [],
  };
}

function mergeClusterBatches(
  batches: ThemeClusterLLM[],
  offsets: number[]
): ThemeClusterLLM {
  const themes = new Map<
    string,
    ThemeClusterLLM['themes'][number]
  >();
  const excluded: ThemeClusterLLM['excluded'] = [];

  batches.forEach((batch, index) => {
    const offset = offsets[index];
    batch.themes.forEach((theme) => {
      const key = `${theme.evidenceType}:${theme.label.trim().toLowerCase()}`;
      const ids = theme.quoteIds.map((id) => id + offset);
      const existing = themes.get(key);
      if (existing) {
        existing.quoteIds.push(...ids);
      } else {
        themes.set(key, { ...theme, quoteIds: ids });
      }
    });
    excluded.push(
      ...batch.excluded.map((item) => ({ ...item, id: item.id + offset }))
    );
  });

  const mergedThemes = [...themes.values()].sort((a, b) => {
    if (a.evidenceType !== b.evidenceType) {
      return a.evidenceType === 'complaint' ? -1 : 1;
    }
    return b.quoteIds.length - a.quoteIds.length;
  });
  const complaintCount = mergedThemes
    .filter((theme) => theme.evidenceType === 'complaint')
    .reduce((sum, theme) => sum + theme.quoteIds.length, 0);
  const relatedCount = mergedThemes
    .filter((theme) => theme.evidenceType === 'related')
    .reduce((sum, theme) => sum + theme.quoteIds.length, 0);

  return {
    summary: `Found ${complaintCount} direct complaint excerpts and ${relatedCount} related discussions across the collected evidence.`,
    themes: mergedThemes,
    excluded,
  };
}

async function generatePainQueries(
  params: PainEvidenceParams
): Promise<PainQueryResponse> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: buildPainQueryMessages(
      params.description,
      params.productType,
      params.audience,
      params.problem
    ),
    temperature: 0.3,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  });

  let json: unknown = {};
  try {
    json = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
  } catch {
    /* fall through to schema failure */
  }

  const parsed = PainQueryResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw AppError.invalidAiResponse('Validation failed. Please try again.');
  }
  return parsed.data;
}

export async function runPainEvidenceValidation(
  params: PainEvidenceParams
): Promise<{ result: PainEvidenceResult; sources: EvidenceSource[] }> {
  const queries = await generatePainQueries(params);
  const web = await searchPainQuotes(
    queries.webQueries,
    queries.commentQuery
  );

  const pool = buildQuotePool(web.quotes, []);
  const sources = web.sources;
  params.onSources(sources);

  if (pool.length === 0) {
    return { result: emptyResult(queries.problemStatement), sources };
  }

  const batches: ReturnType<typeof buildQuotePool>[] = [];
  const offsets: number[] = [];
  for (let offset = 0; offset < pool.length; offset += CLUSTER_BATCH_SIZE) {
    offsets.push(offset);
    batches.push(
      pool
        .slice(offset, offset + CLUSTER_BATCH_SIZE)
        .map((quote, id) => ({ ...quote, id }))
    );
  }
  const clusteredBatches: ThemeClusterLLM[] = [];
  for (const batch of batches) {
    clusteredBatches.push(
      await clusterPainQuoteBatch(queries.problemStatement, batch)
    );
  }
  const clusters = mergeClusterBatches(clusteredBatches, offsets);

  return {
    result: assembleResult(pool, clusters, queries.problemStatement),
    sources,
  };
}
