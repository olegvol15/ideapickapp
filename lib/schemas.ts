import { z } from 'zod';

// ─── Shared primitives ────────────────────────────────────────────────────────

const SignalLevel = z.enum(['Low', 'Medium', 'High']);

const StackItemSchema = z.object({
  layer: z.string(),
  tech: z.string(),
});

// ─── Idea ─────────────────────────────────────────────────────────────────────

export const IdeaSchema = z.object({
  title: z.string(),
  pitch: z.string(),
  audience: z.string(),
  problem: z.string(),
  gap: z.string(),
  differentiation: z.string(),
  closestCompetitors: z.array(z.string()),
  mvpFeatures: z.array(z.string()),
  mvpRoadmap: z.array(z.string()),
  techStack: z.array(StackItemSchema),
  firstUsers: z.array(z.string()),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  marketDemand: SignalLevel,
  competitionLevel: SignalLevel,
  monetizationPotential: SignalLevel,
  confidence: z.number().min(0).max(100),
});

// ─── ValidationResult ─────────────────────────────────────────────────────────

export const ValidationResultSchema = z.object({
  score: z.number().min(0).max(100),
  signals: z.array(z.string()),
  risks: z.array(z.string()),
  verdict: z.string(),
});

// ─── Roadmap ──────────────────────────────────────────────────────────────────

export const RoadmapGraphSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(['root', 'branch', 'leaf']),
      parent: z.string().optional(),
      description: z.string().optional(),
    })
  ),
});

// ─── EnhancedValidationResult ────────────────────────────────────────────────

const EvidencedSignalSchema = z.object({
  text: z.string(),
  strength: z.enum(['strong', 'moderate', 'weak']),
});

const CompetitorInsightSchema = z.object({
  name: z.string(),
  whyChosen: z.string(),
  weakness: z.string(),
});

const ValidationEffortSchema = z.object({
  time: z.string(),
  cost: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

const WillingnessToPaySchema = z.object({
  level: z.enum(['low', 'medium', 'high']),
  freeSubstitutes: z.string(),
  paidAlternatives: z.string(),
});

export const EnhancedValidationResultSchema = z.object({
  // Required — always present
  score: z.number().min(0).max(100),
  painScore: z.number().min(0).max(100),
  competitionScore: z.number().min(0).max(100),
  opportunityScore: z.number().min(0).max(100),
  signals: z.array(z.string()),
  risks: z.array(z.string()),
  verdict: z.string(),

  // Optional — new fields (backward compat with saved validations)
  confidence: z.enum(['low', 'medium', 'high']).optional(),
  confidenceReason: z.string().optional(),
  keyInsights: z.array(z.string()).optional(),
  decision: z.enum(['proceed', 'test-first', 'drop']).optional(),
  decisionReason: z.string().optional(),
  nextStep: z.string().optional(),
  nextStepType: z.enum(['reddit-post', 'landing-page', 'interviews', 'prototype', 'survey', 'other']).optional(),
  validationEffort: ValidationEffortSchema.optional(),
  willingnessToPay: WillingnessToPaySchema.optional(),
  evidencedSignals: z.array(EvidencedSignalSchema).optional(),
  failureReasons: z.array(z.string()).optional(),
  marketHardness: z.string().optional(),
  competitorInsights: z.array(CompetitorInsightSchema).optional(),
});
export type EnhancedValidationResult = z.infer<typeof EnhancedValidationResultSchema>;

// ─── Generate (LLM portion only — competitors are appended from Tavily) ───────

const MarketContextLLMSchema = z.object({
  theme: z.string(),
  marketCondition: z.string(),
  mainPatterns: z.array(z.string()),
  opportunityScore: z.number(),
  marketSize: z.string(),
  growthRate: z.string(),
  signals: z.array(z.string()),
});

const CompetitorAnalysisSchema = z.object({
  name: z.string(),
  domain: z.string(),
  url: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

const GapSchema = z.object({
  title: z.string(),
  currentMarket: z.string(),
  missing: z.string(),
  opportunity: z.string(),
});

export const GenerateLLMOutputSchema = z.object({
  marketContext: MarketContextLLMSchema,
  competitorAnalysis: z.array(CompetitorAnalysisSchema),
  gaps: z.array(GapSchema),
  ideas: z.array(IdeaSchema),
});
