import type { EnhancedValidationResult } from '@/lib/schemas';

export const VALIDATION_STEP_TYPES = new Set([
  'reddit-post',
  'landing-page',
  'interviews',
  'survey',
]);

export const STEP_LABEL: Record<string, string> = {
  'reddit-post': 'Write Reddit Post',
  'landing-page': 'Build Landing Page',
  interviews: 'Plan Interviews',
  prototype: 'Sketch Prototype',
  survey: 'Create Survey',
  other: 'Take Action',
};

const DECISION_FALLBACK: Record<string, string> = {
  proceed:
    'Talk to 5 potential users this week — validate the problem before writing code',
  'test-first':
    'Post this problem in a relevant community and measure engagement before building',
  drop: 'Pivot to a narrower segment or a problem space with weaker existing competition',
};

export function getDisplayNextStep(
  result: EnhancedValidationResult
): string | undefined {
  const { nicheAnalysis, bestEntryStrategy, nextStep, decision } = result;
  const hasNiche = !!(nicheAnalysis && bestEntryStrategy === 'ENTER_VIA_NICHE');
  if (hasNiche && nicheAnalysis)
    return `Validate the "${nicheAnalysis.bestKeyword}" angle — post a problem description in a relevant community and measure genuine interest before building.`;
  return nextStep ?? (decision ? DECISION_FALLBACK[decision] : undefined);
}

export function shouldShowPrimaryAction(
  result: EnhancedValidationResult
): boolean {
  const { decision, nextStepType, nicheAnalysis, bestEntryStrategy } = result;
  const isDrop = decision === 'drop';
  const isProceed = decision === 'proceed';
  const isTest = decision === 'test-first';
  const hasNiche = !!(nicheAnalysis && bestEntryStrategy === 'ENTER_VIA_NICHE');
  if (isDrop && !hasNiche) return false;
  if (isDrop && hasNiche) return false;
  return (
    !isDrop &&
    !!nextStepType &&
    !!STEP_LABEL[nextStepType] &&
    (isProceed ? true : isTest ? VALIDATION_STEP_TYPES.has(nextStepType) : true)
  );
}

export function shouldShowStartBuilding(
  result: EnhancedValidationResult
): boolean {
  return result.decision === 'proceed' || !result.decision;
}
