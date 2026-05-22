import { z } from 'zod';

export const ExploreIdeasRequestSchema = z.object({
  interest: z.string().min(1).max(100),
  constraints: z.array(z.string().max(200)).max(10),
  previousIdeas: z.array(z.string().max(200)).max(20).optional(),
});

export const QuickValidateRequestSchema = z.object({
  description: z.string().min(1).max(600),
  audience: z.string().min(1).max(200),
  problem: z.string().min(1).max(400),
});
