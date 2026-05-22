import { z } from 'zod';

import { IdeaSchema } from './idea';

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
