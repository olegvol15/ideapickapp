import { z } from 'zod';

export const ValidationEffortSchema = z.object({
  time: z.string(),
  cost: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export const WillingnessToPaySchema = z.object({
  level: z.enum(['low', 'medium', 'high']),
  freeSubstitutes: z.string(),
  paidAlternatives: z.string(),
});

export const EvidencedSignalSchema = z.object({
  text: z.string(),
  strength: z.enum(['strong', 'moderate', 'weak']),
});

export const CompetitorInsightSchema = z.object({
  name: z.string(),
  whyChosen: z.string(),
  weakness: z.string(),
});

export const WinInsightSchema = z.object({
  title: z.string(),
  pattern: z.string(),
  gap: z.string(),
  opportunity: z.string(),
});

export const ValidationSubScoreSchema = z.object({
  label: z.string(),
  score: z.number().min(0).max(100),
});

export const ValidationScoreBreakdownSchema = z.object({
  pain: z.array(ValidationSubScoreSchema).length(3).optional(),
  competition: z.array(ValidationSubScoreSchema).length(3).optional(),
  opportunity: z.array(ValidationSubScoreSchema).length(3).optional(),
});

export const WedgeSchema = z.object({
  keyword: z.string(),
  score: z.number().min(0).max(100),
  angle: z.string(),
  targetUser: z.string(),
  whyNow: z.string(),
});
export type Wedge = z.infer<typeof WedgeSchema>;

export const PivotAngleSchema = z.object({
  title: z.string(),
  description: z.string(),
  whyStronger: z.string(),
});
export type PivotAngle = z.infer<typeof PivotAngleSchema>;

export const ReviewThemeSchema = z.object({
  theme: z.string(),
  frequency: z.enum(['rare', 'common', 'frequent']),
  examples: z.array(z.string()),
});
export type ReviewTheme = z.infer<typeof ReviewThemeSchema>;

export const DistributionAnalysisSchema = z.object({
  reachable: z.boolean(),
  channels: z.array(z.string()),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  reasoning: z.string(),
});
export type DistributionAnalysis = z.infer<typeof DistributionAnalysisSchema>;

export const ValidationPlanTaskSchema = z.object({
  day: z.string(),
  task: z.string(),
  goal: z.string(),
  continueIf: z.string(),
  killIf: z.string(),
});
export type ValidationPlanTask = z.infer<typeof ValidationPlanTaskSchema>;

export const DimensionScoresSchema = z.object({
  painEvidence: z.number().min(0).max(10),
  wedgeClarity: z.number().min(0).max(10),
  differentiationGap: z.number().min(0).max(10),
  competitionPenalty: z.number().min(0).max(20),
  mvpSimplicity: z.number().min(0).max(10),
  distributionAccess: z.number().min(0).max(10),
  monetizationPotential: z.number().min(0).max(10),
  coldStartRisk: z.number().min(0).max(10),
});
export type DimensionScores = z.infer<typeof DimensionScoresSchema>;

export const CustomerReachSchema = z.object({
  communities: z.array(z.string()),
  openingMessage: z.string(),
  earlyAdopterProfile: z.string(),
});
