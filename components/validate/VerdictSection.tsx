import { IdyAssessment } from './IdyAssessment';
import { PainScoreBlock } from './PainScoreBlock';
import type { PainEvidenceResult } from '@/lib/schemas';

interface VerdictSectionProps {
  result: PainEvidenceResult;
  revealId?: string;
}

export function VerdictSection({ result, revealId }: VerdictSectionProps) {
  return (
    <div className="space-y-6">
      {result.assessment && (
        <IdyAssessment
          assessment={result.assessment}
          score={result.score}
          revealId={revealId}
        />
      )}
      {result.score != null && (
        <PainScoreBlock score={result.score} breakdown={result.scoreBreakdown} />
      )}
    </div>
  );
}
