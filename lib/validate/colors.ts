export type Tone = 'emerald' | 'amber' | 'rose' | 'purple' | 'sky';

export function scoreColor(n: number): Tone {
  return n >= 70 ? 'emerald' : n >= 40 ? 'amber' : 'rose';
}

export function getLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  return score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
}

export function metricTone(
  level: 'LOW' | 'MEDIUM' | 'HIGH',
  invert: boolean
): Tone {
  if (invert)
    return level === 'HIGH' ? 'rose' : level === 'MEDIUM' ? 'amber' : 'emerald';
  return level === 'HIGH' ? 'emerald' : level === 'MEDIUM' ? 'amber' : 'rose';
}

export function colorClass(c: Tone, v: 'text' | 'bg' | 'border'): string {
  return {
    emerald: {
      text: 'text-emerald-500',
      bg: 'bg-emerald-500',
      border: 'border-emerald-500',
    },
    amber: {
      text: 'text-amber-500',
      bg: 'bg-amber-500',
      border: 'border-amber-500',
    },
    rose: {
      text: 'text-rose-500',
      bg: 'bg-rose-500',
      border: 'border-rose-500',
    },
    purple: {
      text: 'text-purple-400',
      bg: 'bg-purple-500',
      border: 'border-purple-500',
    },
    sky: {
      text: 'text-sky-400',
      bg: 'bg-sky-500',
      border: 'border-sky-500',
    },
  }[c][v];
}

// Suggestion type badge styles (used in RefinePanel and ValidationRefinementsBlock)
export const SUGGESTION_TYPE_STYLE: Record<string, string> = {
  Positioning: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Audience: 'bg-blue-500/10   text-blue-400   border-blue-500/20',
  Feature: 'bg-amber-500/10  text-amber-400  border-amber-500/20',
};

// Badge variants (used in history cards and sidebar items — 400 shade with opacity bg)
export function scoreColorBadge(score: number): string {
  if (score >= 70) return 'text-emerald-400 bg-emerald-400/10';
  if (score >= 40) return 'text-amber-400 bg-amber-400/10';
  return 'text-rose-400 bg-rose-400/10';
}

export function decisionColorBadge(decision: string): string {
  if (decision === 'proceed' || decision === 'build')
    return 'text-emerald-400 bg-emerald-400/10';
  if (decision === 'test-first') return 'text-amber-400 bg-amber-400/10';
  if (decision === 'niche-only') return 'text-amber-400 bg-amber-400/10';
  if (decision === 'pivot-angle') return 'text-purple-400 bg-purple-400/10';
  return 'text-rose-400 bg-rose-400/10';
}
