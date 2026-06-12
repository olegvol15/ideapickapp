import type { CompetitorBullet, PainEvidenceResult } from '@/lib/schemas';

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

// Competitor bullets were plain strings before sources were attached.
// Saved rows from that window normalize to bullets without sources.
export const normalizeCompetitorBullets = (
  bullets: unknown
): CompetitorBullet[] => {
  if (!Array.isArray(bullets)) return [];
  return bullets.flatMap((bullet) => {
    if (typeof bullet === 'string') return [{ text: bullet, sources: [] }];
    if (
      typeof bullet === 'object' &&
      bullet !== null &&
      typeof (bullet as CompetitorBullet).text === 'string'
    ) {
      const candidate = bullet as CompetitorBullet;
      return [
        {
          text: candidate.text,
          sources: Array.isArray(candidate.sources) ? candidate.sources : [],
        },
      ];
    }
    return [];
  });
};
