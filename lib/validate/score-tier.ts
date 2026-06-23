// Single source of truth for the idea-score bands, shared by the score card
// verdict and the Idy reveal animation. Thresholds match scoreVerdict in
// components/validate/PainScoreBlock.tsx.
export type ScoreTier = 'strong' | 'promising' | 'weak';

export function scoreTier(score: number): ScoreTier {
  if (score >= 70) return 'strong';
  if (score >= 40) return 'promising';
  return 'weak';
}
