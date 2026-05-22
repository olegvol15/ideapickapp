import type { EnhancedValidationResult } from '@/lib/schemas';

export function getDecisionStatement(
  result: EnhancedValidationResult
): string | null {
  const { decision, bestEntryStrategy, metrics } = result;
  const locked = metrics?.marketLocked ?? false;
  const dominance = metrics?.marketDominance;

  if (bestEntryStrategy === 'NO_VIABLE_ENTRY')
    return 'Do not enter this market. No viable angle was identified.';
  if (bestEntryStrategy === 'ENTER_VIA_NICHE') {
    if (locked)
      return 'Do not enter this market directly. Only a focused niche strategy has any chance.';
    if (dominance === 'HIGH')
      return 'Do not compete broadly. Only niche entry has a viable path.';
    return 'Direct entry is risky. Only niche entry has a viable path.';
  }
  if (decision === 'niche-only') {
    const nicheKeyword = result.nicheAnalysis?.bestKeyword;
    if (nicheKeyword)
      return `Don't compete broadly. Enter through "${nicheKeyword}" — the niche has lower incumbent concentration.`;
    return 'Do not compete in the broad market. Enter only through a tightly focused niche.';
  }
  if (decision === 'pivot-angle')
    return 'The pain is real — but this execution angle lacks a clear wedge. Try a narrower audience or a simpler core loop.';
  if (decision === 'drop') {
    if (locked)
      return 'Do not enter this market. Incumbents are too entrenched to displace.';
    return 'Do not build for this broad market without a clear structural differentiator.';
  }
  if (decision === 'test-first')
    return 'Validate before building. The market has competition — you need evidence of real demand first.';
  if (decision === 'build' || decision === 'proceed')
    return 'This market has room. Move fast and validate with real users before writing code.';
  return null;
}
