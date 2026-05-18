export function getConfidenceDisclaimer(
  confidence: 'low' | 'medium' | 'high' | undefined
): string | null {
  if (!confidence) return null;
  const map: Record<'low' | 'medium' | 'high', string> = {
    low: 'Limited data — speak to 10+ real users before building anything.',
    medium: 'Moderate signals — validate with real conversations before committing.',
    high: "Strong signals — but AI research isn't real user behavior. Real sign-ups and conversations are the next test.",
  };
  return map[confidence];
}
