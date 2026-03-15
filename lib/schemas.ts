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
