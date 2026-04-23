import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';

type CompetitorInsight = NonNullable<EnhancedValidationResult['competitorInsights']>[number];

export function findInsight(competitor: Competitor, insights: CompetitorInsight[]): CompetitorInsight | undefined {
  const map = new Map(insights.map((ci) => [ci.name.toLowerCase(), ci]));
  const name = competitor.name.toLowerCase();
  return (
    map.get(name) ??
    [...map.entries()].find(([k]) => name.includes(k) || k.includes(name.split(' ')[0]))?.[1]
  );
}
