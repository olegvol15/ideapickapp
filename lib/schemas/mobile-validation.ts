import { z } from 'zod';

import {
  CompetitorInsightSchema,
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

export const MobileMetricsSchema = z.object({
  totalApps: z.number(),
  totalReviews: z.number(),
  top10AvgRating: z.number().optional(),
  bottom40AvgRating: z.number().optional(),
  medianRating: z.number().optional(),
  ratingVariance: z.number().optional(),
  top1ReviewShare: z.number().optional(),
  top5ReviewShare: z.number().optional(),
  top10ReviewShare: z.number().optional(),
  reviewDistributionSkew: z.number().optional(),
  ratingDistributionAbove45: z.number().optional(),
  marketDominance: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  marketLocked: z.boolean().optional(),
  keywordInTopTitles: z.boolean().optional(),
  hasWeakIncumbents: z.boolean().optional(),
  topAppRevEstimate: z
    .object({ low: z.number(), high: z.number() })
    .nullable()
    .optional(),
  avgRating: z.number().optional(),
  avgReviews: z.number().optional(),
});

export const MobileScoresSchema = z.object({
  competitionScore: z.number(),
  saturationScore: z.number(),
  qualityBarrierScore: z.number(),
  marketPowerScore: z.number(),
  opportunityScore: z.number(),
});

export const PainClusterSchema = z.object({
  cluster: z.enum(['bugs', 'performance', 'pricing', 'missing_features', 'ux']),
  share: z.number(),
});

export const NicheResultSchema = z.object({
  query: z.string(),
  totalApps: z.number(),
  top5ReviewShare: z.number(),
  reviewDistributionSkew: z.number(),
  marketDominance: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  keywordInTopTitles: z.boolean().optional(),
  hasWeakIncumbents: z.boolean().optional(),
  topAppRevEstimate: z
    .object({ low: z.number(), high: z.number() })
    .nullable()
    .optional(),
});

export const KeywordMarketSnapshotSchema = z.object({
  keyword: z.string(),
  relevanceScore: z.number(),
  rawAppCount: z.number(),
  relevantAppCount: z.number(),
  metrics: MobileMetricsSchema,
  scores: MobileScoresSchema,
  entryScore: z.number(),
});

export const EvidenceQualitySchema = z.object({
  relevantApps: z.number(),
  rawApps: z.number(),
  reviewsAnalyzed: z.number(),
  keywordRelevance: z.number(),
  discardedKeywords: z.array(z.string()),
  limitations: z.array(z.string()),
});

export const MobileExplanationSchema = z.object({
  signals: z.array(z.string()),
  risks: z.array(z.string()),
  verdict: z.string(),
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  confidenceReason: z.string().optional(),
  keyInsights: z.array(z.string()).optional(),
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
  customerReach: z
    .object({
      communities: z.array(z.string()),
      openingMessage: z.string(),
      earlyAdopterProfile: z.string(),
    })
    .optional(),
  llmDimensionScores: z
    .object({
      mvpSimplicity: z.number().min(0).max(10),
      distributionAccess: z.number().min(0).max(10),
      monetizationPotential: z.number().min(0).max(10),
      coldStartRisk: z.number().min(0).max(10),
    })
    .optional(),
  wedges: z.array(WedgeSchema).optional(),
  pivotAngles: z.array(PivotAngleSchema).optional(),
  reviewThemes: z.array(ReviewThemeSchema).optional(),
  distributionAnalysis: DistributionAnalysisSchema.optional(),
  validationPlan: z.array(ValidationPlanTaskSchema).optional(),
});
export type MobileExplanation = z.infer<typeof MobileExplanationSchema>;
