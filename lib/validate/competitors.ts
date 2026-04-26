import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

export function dedupeCompetitors<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = item.url.split('?')[0];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

type CompetitorInsight = NonNullable<EnhancedValidationResult['competitorInsights']>[number];

export function findInsight(competitor: Competitor, insights: CompetitorInsight[]): CompetitorInsight | undefined {
  const map = new Map(insights.map((ci) => [ci.name.toLowerCase(), ci]));
  const name = competitor.name.toLowerCase();
  return (
    map.get(name) ??
    [...map.entries()].find(([k]) => name.includes(k) || k.includes(name.split(' ')[0]))?.[1]
  );
}
