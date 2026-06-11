'use client';

import { ValidationSummaryCard } from './ValidationSummaryCard';
import { ValidationScoreBlock } from './ValidationScoreBlock';
import { ValidationCompetitorsBlock } from './ValidationCompetitorsBlock';
import { ValidationNicheBlock } from './ValidationNicheBlock';
import { ValidationWedgesBlock } from './ValidationWedgesBlock';
import { ValidationNextMoveBlock } from './ValidationNextMoveBlock';
import { ValidationPlanBlock } from './ValidationPlanBlock';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';
import type { IdeaContext } from '@/types/validate.types';

interface ValidationReportProps {
  result: EnhancedValidationResult;
  competitors: Competitor[];
  previousResult?: EnhancedValidationResult;
  ideaContext?: IdeaContext;
  onRefine?: (description: string) => void;
}

export function ValidationReport({ result, competitors, ideaContext }: ValidationReportProps) {
  const { nicheAnalysis, bestEntryStrategy } = result;
  const showNiche = !!(nicheAnalysis && bestEntryStrategy);
  const showWedges = !!(result.wedges && result.wedges.length > 0);
  const showPlan = !!(result.validationPlan && result.validationPlan.length > 0);

  return (
    <div className="flex flex-col gap-0 w-full">
      {/* 1. Summary */}
      <ValidationSummaryCard result={result} />

      {/* 2. Verdict + Score */}
      <ValidationScoreBlock result={result} ideaContext={ideaContext} />

      {/* 3. Competitors */}
      <ValidationCompetitorsBlock result={result} competitors={competitors} />

      {/* 4. Best keywords to target */}
      {(showNiche || showWedges) && (
        <>
          {showNiche && (
            <ValidationNicheBlock
              nicheAnalysis={nicheAnalysis!}
              bestEntryStrategy={bestEntryStrategy!}
            />
          )}
          {showWedges && (
            <ValidationWedgesBlock wedges={result.wedges!} />
          )}
        </>
      )}

      {/* 5. Further Steps */}
      <ValidationNextMoveBlock result={result} ideaContext={ideaContext} />
      {showPlan && (
        <ValidationPlanBlock validationPlan={result.validationPlan!} />
      )}
    </div>
  );
}
