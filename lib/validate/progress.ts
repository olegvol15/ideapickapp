export type Phase = 'thinking' | 'researching' | 'analyzing';
export type StepStatus = 'done' | 'active' | 'pending';

export const STEP_INDEX = ['queries', 'research', 'scoring'] as const;
export type StepId = (typeof STEP_INDEX)[number];

const PHASE_INDEX: Record<Phase, number> = {
  thinking: 0,
  researching: 1,
  analyzing: 2,
};

export function stepStatus(id: StepId, phase: Phase): StepStatus {
  const pi = PHASE_INDEX[phase];
  const si = STEP_INDEX.indexOf(id);
  if (si < pi) return 'done';
  if (si === pi) return 'active';
  return 'pending';
}

export function getSearchKeywords(description: string): string[] {
  const base = description.trim().slice(0, 40);
  return [
    `${base} problems reddit`,
    `${base} complaints`,
    `${base} forum discussions`,
  ];
}
