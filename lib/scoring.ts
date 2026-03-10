import type { Idea, SignalLevel } from '@/types';

const SIGNAL_VALUE: Record<SignalLevel, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

/** Returns a 1–10 opportunity score based on demand, competition, and build ease. */
export function computeOpportunityScore(idea: Idea): number {
  const demand = SIGNAL_VALUE[idea.marketDemand] ?? 2;
  const compInv = 4 - (SIGNAL_VALUE[idea.competitionLevel] ?? 2); // inverted: Low competition = 3
  const ease =
    4 -
    (SIGNAL_VALUE[
      idea.difficulty === 'Easy'
        ? 'High'
        : idea.difficulty === 'Medium'
          ? 'Medium'
          : 'Low'
    ] ?? 2);

  const raw = demand * 0.4 + compInv * 0.3 + ease * 0.3;
  // raw range: [1.0, 3.0] → map to [1, 10]
  return Math.round(((raw - 1) / 2) * 9 + 1);
}
