import { z } from 'zod';

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
