import type { PainEvidenceResult } from '@/lib/schemas';

export const isPainEvidenceResult = (
  result: unknown
): result is PainEvidenceResult => {
  if (typeof result !== 'object' || result === null) return false;
  const candidate = result as Record<string, unknown>;
  return (
    Array.isArray(candidate.themes) &&
    typeof candidate.summary === 'string' &&
    typeof candidate.totalQuotes === 'number'
  );
};
