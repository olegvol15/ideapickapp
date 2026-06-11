import { z } from 'zod';

export const PainQuoteSchema = z.object({
  text: z.string(),
  source: z.enum(['reddit', 'web', 'appstore']),
  sourceLabel: z.string(),
  author: z.string().optional(),
  url: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  appName: z.string().optional(),
});
export type PainQuote = z.infer<typeof PainQuoteSchema>;

export const PainThemeSchema = z.object({
  label: z.string(),
  evidenceType: z.enum(['complaint', 'related']).optional(),
  mentionCount: z.number().int().min(1),
  quotes: z.array(PainQuoteSchema).min(1),
});
export type PainTheme = z.infer<typeof PainThemeSchema>;

export const PainEvidenceResultSchema = z.object({
  problem: z.string(),
  summary: z.string(),
  totalQuotes: z.number().int().min(0),
  themes: z.array(PainThemeSchema),
});
export type PainEvidenceResult = z.infer<typeof PainEvidenceResultSchema>;

export const PainQueryResponseSchema = z.object({
  problemStatement: z.string().min(3),
  webQueries: z.array(z.string().min(3)).min(1).max(6),
  commentQuery: z.string().min(3),
});
export type PainQueryResponse = z.infer<typeof PainQueryResponseSchema>;

export const ThemeClusterLLMSchema = z.object({
  summary: z.string().min(3),
  themes: z
    .array(
      z.object({
        label: z.string().min(3).max(90),
        evidenceType: z.enum(['complaint', 'related']).default('complaint'),
        quoteIds: z.array(z.number().int().min(0)).min(1),
      })
    )
    .max(16),
  excluded: z.array(
    z.object({
      id: z.number().int().min(0),
      category: z.enum(['promo', 'off_topic', 'not_complaint', 'junk']),
    })
  ),
});
export type ThemeClusterLLM = z.infer<typeof ThemeClusterLLMSchema>;
