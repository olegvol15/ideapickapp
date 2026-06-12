import type {
  PainEvidenceResult,
  PainQuote,
  PainTheme,
  ThemeClusterLLM,
} from '@/lib/schemas';

const MAX_POOL_SIZE = 80;
const MIN_QUOTES_PER_THEME = 1;

export interface PooledQuote extends PainQuote {
  id: number;
}

export interface QuoteAccountingIssues {
  missingIds: number[];
  duplicateIds: number[];
  invalidIds: number[];
}

export function validateQuoteAccounting(
  poolSize: number,
  clusters: ThemeClusterLLM
): QuoteAccountingIssues {
  const counts = new Map<number, number>();
  const invalidIds = new Set<number>();
  const record = (id: number) => {
    if (id < 0 || id >= poolSize) {
      invalidIds.add(id);
      return;
    }
    counts.set(id, (counts.get(id) ?? 0) + 1);
  };

  clusters.themes.forEach((theme) =>
    theme.quotes.forEach(({ id }) => record(id))
  );
  clusters.excluded.forEach(({ id }) => record(id));

  const missingIds: number[] = [];
  const duplicateIds: number[] = [];
  for (let id = 0; id < poolSize; id += 1) {
    const count = counts.get(id) ?? 0;
    if (count === 0) missingIds.push(id);
    if (count > 1) duplicateIds.push(id);
  }

  return {
    missingIds,
    duplicateIds,
    invalidIds: [...invalidIds].sort((a, b) => a - b),
  };
}

export function hasQuoteAccountingIssues(
  issues: QuoteAccountingIssues
): boolean {
  return (
    issues.missingIds.length > 0 ||
    issues.duplicateIds.length > 0 ||
    issues.invalidIds.length > 0
  );
}

export function formatQuoteAccountingIssues(
  issues: QuoteAccountingIssues
): string {
  const parts: string[] = [];
  if (issues.missingIds.length > 0) {
    parts.push(`Missing IDs: ${issues.missingIds.join(', ')}`);
  }
  if (issues.duplicateIds.length > 0) {
    parts.push(`Duplicated IDs: ${issues.duplicateIds.join(', ')}`);
  }
  if (issues.invalidIds.length > 0) {
    parts.push(`Out-of-range IDs: ${issues.invalidIds.join(', ')}`);
  }
  return parts.join('\n');
}

export function matchedQuoteCount(result: PainEvidenceResult): number {
  return result.themes.reduce((sum, theme) => sum + theme.quotes.length, 0);
}

export function evidenceTypeCounts(result: PainEvidenceResult): {
  complaint: number;
  related: number;
} {
  return result.themes.reduce(
    (counts, theme) => {
      const type = theme.evidenceType ?? 'complaint';
      counts[type] += theme.quotes.length;
      return counts;
    },
    { complaint: 0, related: 0 }
  );
}

export function matchedSourceCounts(
  result: PainEvidenceResult
): Record<PainQuote['source'], number> {
  const counts: Record<PainQuote['source'], number> = {
    reddit: 0,
    web: 0,
    appstore: 0,
  };
  result.themes.forEach((theme) => {
    theme.quotes.forEach((quote) => {
      counts[quote.source] += 1;
    });
  });
  return counts;
}

export function truncateAtWord(text: string, maxLength: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`;
}

export function buildQuotePool(
  webQuotes: PainQuote[],
  reviewQuotes: PainQuote[]
): PooledQuote[] {
  const seen = new Set<string>();
  const pool: PooledQuote[] = [];
  const lanes = [
    webQuotes.filter((quote) => quote.source === 'reddit'),
    webQuotes.filter((quote) => quote.source === 'web'),
    reviewQuotes,
  ].filter((lane) => lane.length > 0);
  const laneIndexes = lanes.map(() => 0);

  const add = (quote: PainQuote) => {
    const key = `${quote.url ?? ''}|${quote.text.slice(0, 80)}`;
    if (seen.has(key)) return;
    seen.add(key);
    pool.push({ ...quote, id: pool.length });
  };

  // Round-robin prevents one source from consuming the entire LLM context.
  // Once a lane is exhausted, the remaining sources can use the spare capacity.
  while (pool.length < MAX_POOL_SIZE) {
    let advanced = false;
    for (let lane = 0; lane < lanes.length; lane += 1) {
      const quote = lanes[lane][laneIndexes[lane]];
      if (!quote) continue;
      laneIndexes[lane] += 1;
      add(quote);
      advanced = true;
      if (pool.length >= MAX_POOL_SIZE) break;
    }
    if (!advanced) break;
  }

  return pool;
}

export function assembleResult(
  pool: PooledQuote[],
  clusters: ThemeClusterLLM,
  problemStatement: string
): PainEvidenceResult {
  const usedIds = new Set<number>();
  const themes: PainTheme[] = [];

  for (const cluster of clusters.themes) {
    const quotes: PainQuote[] = [];
    for (const { id, severity } of cluster.quotes) {
      if (usedIds.has(id)) continue;
      const pooled = pool[id];
      if (!pooled || pooled.id !== id) continue;
      usedIds.add(id);
      quotes.push({
        text: pooled.text,
        source: pooled.source,
        sourceLabel: pooled.sourceLabel,
        author: pooled.author,
        url: pooled.url,
        rating: pooled.rating,
        appName: pooled.appName,
        intensity: severity,
      });
    }
    if (quotes.length < MIN_QUOTES_PER_THEME) continue;
    themes.push({
      label: cluster.label,
      evidenceType: cluster.evidenceType,
      mentionCount: quotes.length,
      quotes,
    });
  }

  themes.sort((a, b) => {
    if (a.evidenceType !== b.evidenceType) {
      return a.evidenceType === 'complaint' ? -1 : 1;
    }
    return b.mentionCount - a.mentionCount;
  });

  return {
    problem: problemStatement,
    summary: clusters.summary,
    totalQuotes: pool.length,
    themes,
  };
}

export function emptyResult(problemStatement: string): PainEvidenceResult {
  return {
    problem: problemStatement,
    summary:
      'No public complaints found for this problem — either the pain is rare or people describe it differently.',
    totalQuotes: 0,
    themes: [],
    score: 0,
    scoreBreakdown: {
      problemStrength: 0,
      complaintFrequency: 0,
      audienceReachability: 0,
    },
  };
}
