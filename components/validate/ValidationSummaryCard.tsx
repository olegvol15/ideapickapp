import type { EnhancedValidationResult } from '@/lib/schemas';

interface ValidationSummaryCardProps {
  result: EnhancedValidationResult;
}

export function ValidationSummaryCard({ result }: ValidationSummaryCardProps) {
  const body = result.summary ?? result.verdict;
  if (!body) return null;
  return (
    <div className="pb-8">
      <p className="text-sm text-foreground/75 leading-relaxed">{body}</p>
    </div>
  );
}
