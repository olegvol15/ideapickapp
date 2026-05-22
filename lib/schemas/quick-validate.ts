import { z } from 'zod';

export const QuickValidateResultSchema = z.object({
  verdict: z.string().min(1).max(30),
  score: z.number().int().min(0).max(100),
  bullets: z.array(z.string()).length(3),
  nextStep: z.string().min(1),
});
export type QuickValidateResult = z.infer<typeof QuickValidateResultSchema>;
