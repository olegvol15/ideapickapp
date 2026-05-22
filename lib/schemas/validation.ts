import { z } from 'zod';

import {
  MobileMetricsSchema,
  MobileScoresSchema,
  NicheResultSchema,
  PainClusterSchema,
} from './mobile-validation';
import {
  CompetitorInsightSchema,
  CustomerReachSchema,
  DimensionScoresSchema,
  DistributionAnalysisSchema,
  EvidencedSignalSchema,
  PivotAngleSchema,
  ReviewThemeSchema,
  ValidationEffortSchema,
  ValidationPlanTaskSchema,
  ValidationScoreBreakdownSchema,
  WedgeSchema,
  WillingnessToPaySchema,
  WinInsightSchema,
} from './validation-sections';

export const ValidationResultSchema = z.object({
  score: z.number().min(0).max(100),
  signals: z.array(z.string()),
  risks: z.array(z.string()),
  verdict: z.string(),
});

export const EnhancedValidationResultSchema = z.object({
  score: z.number().min(0).max(100),
  painScore: z.number().min(0).max(100),
  competitionScore: z.number().min(0).max(100),
  opportunityScore: z.number().min(0).max(100),
  signals: z.array(z.string()),
  risks: z.array(z.string()),
  verdict: z.string(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  confidenceReason: z.string().optional(),
  keyInsights: z.array(z.string()).optional(),
  decision: z
    .enum([
      'proceed',
      'build',
      'test-first',
      'drop',
      'niche-only',
      'pivot-angle',
    ])
    .optional(),
  decisionReason: z.string().optional(),
  nextStep: z.string().optional(),
  nextStepType: z
    .enum([
      'reddit-post',
      'landing-page',
      'interviews',
      'prototype',
      'survey',
      'other',
    ])
    .optional(),
  validationEffort: ValidationEffortSchema.optional(),
  willingnessToPay: WillingnessToPaySchema.optional(),
  scoreBreakdown: ValidationScoreBreakdownSchema.optional(),
  evidencedSignals: z.array(EvidencedSignalSchema).optional(),
  failureReasons: z.array(z.string()).optional(),
  marketHardness: z.string().optional(),
  competitorInsights: z.array(CompetitorInsightSchema).optional(),
  whereToWin: z.array(WinInsightSchema).optional(),
  customerReach: CustomerReachSchema.optional(),
  dimensionScores: DimensionScoresSchema.optional(),
  wedges: z.array(WedgeSchema).optional(),
  pivotAngles: z.array(PivotAngleSchema).optional(),
  reviewThemes: z.array(ReviewThemeSchema).optional(),
  distributionAnalysis: DistributionAnalysisSchema.optional(),
  validationPlan: z.array(ValidationPlanTaskSchema).optional(),
  metrics: MobileMetricsSchema.optional(),
  rawScores: MobileScoresSchema.optional(),
  rawDecision: z.string().optional(),
  painAnalysis: z
    .object({
      weightedScore: z.number(),
      topPainClusters: z.array(PainClusterSchema),
    })
    .optional(),
  niches: z.array(NicheResultSchema).optional(),
  marketInsights: z.array(z.string()).optional(),
  opportunityInsights: z.array(z.string()).optional(),
  confidenceScore: z.number().optional(),
  nicheAnalysis: z
    .object({
      evaluatedKeywords: z.array(z.string()),
      bestKeyword: z.string(),
      bestKeywordScores: MobileScoresSchema,
      alternativeKeywords: z.array(z.string()),
      reasoning: z.string(),
      comparisonNote: z.string().optional(),
    })
    .optional(),
  bestEntryStrategy: z
    .enum(['ENTER_VIA_NICHE', 'BROAD_MARKET', 'NO_VIABLE_ENTRY'])
    .optional(),
});
export type EnhancedValidationResult = z.infer<
  typeof EnhancedValidationResultSchema
>;
