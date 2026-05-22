'use client';

import { ValidationSummaryCard } from './ValidationSummaryCard';
import { ValidationNicheBlock } from './ValidationNicheBlock';
import { ValidationScoreBlock } from './ValidationScoreBlock';
import { ValidationWedgesBlock } from './ValidationWedgesBlock';
import { ValidationReviewThemesBlock } from './ValidationReviewThemesBlock';
import { ValidationPivotBlock } from './ValidationPivotBlock';
import { ValidationCompetitorsBlock } from './ValidationCompetitorsBlock';
import { ValidationDistributionBlock } from './ValidationDistributionBlock';
import { ValidationPlanBlock } from './ValidationPlanBlock';
import { ValidationNextMoveBlock } from './ValidationNextMoveBlock';
import { ValidationCustomerReachBlock } from './ValidationCustomerReachBlock';
import { ValidationRefinementsBlock } from './ValidationRefinementsBlock';
import { ValidationAdvancedBlock } from './ValidationAdvancedBlock';
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

export function ValidationReport({ result, competitors, ideaContext, onRefine }: ValidationReportProps) {
  const { nicheAnalysis, bestEntryStrategy, decision } = result;

  const showNiche = !!(nicheAnalysis && bestEntryStrategy);
  const showRefinements = decision === 'test-first' || decision === 'drop' || decision === 'pivot-angle';
  const showPivots = !!(
    result.pivotAngles &&
    result.pivotAngles.length > 0 &&
    (decision === 'pivot-angle' || decision === 'test-first' || decision === 'drop')
  );

  return (
    <div className="flex flex-col gap-0 w-full">
      <ValidationSummaryCard result={result} ideaContext={ideaContext} />

      {showNiche && (
        <ValidationNicheBlock
          nicheAnalysis={nicheAnalysis!}
          bestEntryStrategy={bestEntryStrategy!}
        />
      )}

      <ValidationScoreBlock result={result} ideaContext={ideaContext} />

      {result.wedges && result.wedges.length > 0 && (
        <ValidationWedgesBlock wedges={result.wedges} />
      )}

      {result.reviewThemes && result.reviewThemes.length > 0 && (
        <ValidationReviewThemesBlock reviewThemes={result.reviewThemes} />
      )}

      {showPivots && (
        <ValidationPivotBlock pivotAngles={result.pivotAngles!} />
      )}

      <ValidationCompetitorsBlock result={result} competitors={competitors} />

      {result.distributionAnalysis && (
        <ValidationDistributionBlock distributionAnalysis={result.distributionAnalysis} />
      )}

      {result.validationPlan && result.validationPlan.length > 0 && (
        <ValidationPlanBlock validationPlan={result.validationPlan} />
      )}

      <ValidationNextMoveBlock result={result} ideaContext={ideaContext} />

      {result.customerReach && (
        <ValidationCustomerReachBlock customerReach={result.customerReach} />
      )}

      {showRefinements && (
        <ValidationRefinementsBlock
          result={result}
          ideaContext={ideaContext}
          onApply={onRefine}
        />
      )}

      <ValidationAdvancedBlock result={result} competitors={competitors} />
    </div>
  );
}
