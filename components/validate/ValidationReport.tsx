'use client';

import { ValidationDeltaCard } from './ValidationDeltaCard';
import { ValidationScoreBlock } from './ValidationScoreBlock';
import { ValidationCompetitorsBlock } from './ValidationCompetitorsBlock';
import { ValidationNextMoveBlock } from './ValidationNextMoveBlock';
import { ValidationRefinementsBlock } from './ValidationRefinementsBlock';
import { ValidationAdvancedBlock } from './ValidationAdvancedBlock';
import { ValidationSummaryCard } from './ValidationSummaryCard';
import type { EnhancedValidationResult } from '@/lib/schemas';
import type { Competitor } from '@/types';
import type { IdeaContext } from '@/types/validate.types';

interface ValidationReportProps {
  result: EnhancedValidationResult;
  competitors: Competitor[];
  previousResult?: EnhancedValidationResult;
  ideaContext?: IdeaContext;
}

export function ValidationReport({
  result,
  competitors,
  previousResult,
  ideaContext,
}: ValidationReportProps) {
  return (
    <div className="flex flex-col gap-4">
      <ValidationSummaryCard result={result} ideaContext={ideaContext} />
      {previousResult && (
        <ValidationDeltaCard result={result} previousResult={previousResult} />
      )}
      <ValidationScoreBlock result={result} ideaContext={ideaContext} />
      <ValidationCompetitorsBlock result={result} competitors={competitors} />
      <ValidationNextMoveBlock result={result} ideaContext={ideaContext} />
      <ValidationRefinementsBlock result={result} ideaContext={ideaContext} />
      <ValidationAdvancedBlock result={result} competitors={competitors} />
    </div>
  );
}
