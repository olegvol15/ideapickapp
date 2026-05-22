import { z } from 'zod';

const ExploreIdeaSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1),
  score: z.number().int().min(0).max(100),
  verdict: z.string().min(1).max(30),
  bullets: z.array(z.string()).min(2).max(3),
  nextStep: z.string().min(1),
});
export type ExploreIdea = z.infer<typeof ExploreIdeaSchema>;

export const ExploreResultSchema = z.object({
  ideas: z.array(ExploreIdeaSchema).length(3),
});
