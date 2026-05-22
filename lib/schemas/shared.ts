import { z } from 'zod';

export const SignalLevelSchema = z.enum(['Low', 'Medium', 'High']);

export const StackItemSchema = z.object({
  layer: z.string(),
  tech: z.string(),
});
