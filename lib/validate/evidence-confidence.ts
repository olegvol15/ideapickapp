import {
  evidenceTypeCounts,
  matchedQuoteCount,
  matchedSourceCounts,
} from '@/lib/evidence/quote-pool';
import type { PainEvidenceResult } from '@/lib/schemas';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface EvidenceConfidence {
  // Total excerpts we read before clustering — the breadth of the scan.
  excerptsReviewed: number;
  // Distinct communities/sites/apps the matched evidence came from. Trust
  // grows when complaints span many sources, not one loud thread.
  distinctSources: number;
  // How many of the three source kinds (Reddit, web, App Store) contributed.
  sourceKinds: number;
  level: ConfidenceLevel;
}

// Deterministic trust signal derived only from the report itself, so it also
// holds for persisted historical reports. No fabricated numbers — every input
// is something we actually counted.
export function computeEvidenceConfidence(
  result: PainEvidenceResult
): EvidenceConfidence {
  const counts = evidenceTypeCounts(result);
  const sourceCounts = matchedSourceCounts(result);
  const sourceKinds = (
    Object.values(sourceCounts) as number[]
  ).filter((n) => n > 0).length;

  const distinctSources = new Set<string>();
  result.themes.forEach((theme) => {
    theme.quotes.forEach((quote) => distinctSources.add(quote.sourceLabel));
  });

  const complaintThemeCount = result.themes.filter(
    (theme) => theme.evidenceType !== 'related'
  ).length;
  const competitorCount = result.competitors?.length ?? 0;

  let points = 0;
  if (counts.complaint >= 8) points += 2;
  else if (counts.complaint >= 3) points += 1;
  if (complaintThemeCount >= 3) points += 1;
  if (sourceKinds >= 2) points += 1;
  if (distinctSources.size >= 5) points += 1;
  if (competitorCount > 0) points += 1;

  const level: ConfidenceLevel =
    points >= 4 ? 'high' : points >= 2 ? 'medium' : 'low';

  return {
    excerptsReviewed: matchedQuoteCount(result),
    distinctSources: distinctSources.size,
    sourceKinds,
    level,
  };
}
