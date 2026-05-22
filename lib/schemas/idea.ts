import { z } from 'zod';

import { SignalLevelSchema, StackItemSchema } from './shared';

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
  marketDemand: SignalLevelSchema,
  competitionLevel: SignalLevelSchema,
  monetizationPotential: SignalLevelSchema,
  confidence: z.number().min(0).max(100),
});
