import { z } from 'zod';

export const PainQuoteSchema = z.object({
  text: z.string(),
  source: z.enum(['reddit', 'web', 'appstore']),
  sourceLabel: z.string(),
  author: z.string().optional(),
  url: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  appName: z.string().optional(),
  intensity: z.number().int().min(1).max(3).optional(),
});
export type PainQuote = z.infer<typeof PainQuoteSchema>;

export const PainThemeSchema = z.object({
  label: z.string(),
  evidenceType: z.enum(['complaint', 'related']).optional(),
  mentionCount: z.number().int().min(1),
  quotes: z.array(PainQuoteSchema).min(1),
});
export type PainTheme = z.infer<typeof PainThemeSchema>;

export const ScoreBreakdownSchema = z.object({
  problemStrength: z.number().min(0).max(100),
  complaintFrequency: z.number().min(0).max(100),
  audienceReachability: z.number().min(0).max(100),
  marketSaturation: z.number().min(0).max(100).optional(),
});
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const CompetitorBulletSourceSchema = z.object({
  text: z.string(),
  label: z.string(),
  url: z.string().optional(),
});
export type CompetitorBulletSource = z.infer<
  typeof CompetitorBulletSourceSchema
>;

export const CompetitorBulletSchema = z.object({
  text: z.string(),
  sources: z.array(CompetitorBulletSourceSchema),
});
export type CompetitorBullet = z.infer<typeof CompetitorBulletSchema>;

export const CompetitorInsightSchema = z.object({
  name: z.string(),
  url: z.string().optional(),
  iconUrl: z.string().optional(),
  reviewCount: z.number().int().min(0).optional(),
  description: z.string(),
  likes: z.array(CompetitorBulletSchema),
  dislikes: z.array(CompetitorBulletSchema),
  edge: z.string().optional(),
  origin: z.enum(['market', 'mentioned']).optional(),
  mentionCount: z.number().int().min(1).optional(),
});
export type CompetitorInsight = z.infer<typeof CompetitorInsightSchema>;

export const PainEvidenceResultSchema = z.object({
  problem: z.string(),
  summary: z.string(),
  assessment: z.string().optional(),
  totalQuotes: z.number().int().min(0),
  themes: z.array(PainThemeSchema),
  score: z.number().min(0).max(100).optional(),
  scoreBreakdown: ScoreBreakdownSchema.optional(),
  competitors: z.array(CompetitorInsightSchema).optional(),
});
export type PainEvidenceResult = z.infer<typeof PainEvidenceResultSchema>;

export const IdeaAssessmentLLMSchema = z.object({
  assessment: z.string().min(3),
});
export type IdeaAssessmentLLM = z.infer<typeof IdeaAssessmentLLMSchema>;

export const PainQueryResponseSchema = z.object({
  problemStatement: z.string().min(3),
  webQueries: z.array(z.string().min(3)).min(1).max(6),
  commentQuery: z.string().min(3),
  competitorQuery: z.string().min(3),
});
export type PainQueryResponse = z.infer<typeof PainQueryResponseSchema>;

export const ThemeClusterLLMSchema = z.object({
  summary: z.string().min(3),
  themes: z
    .array(
      z.object({
        label: z.string().min(3).max(90),
        evidenceType: z.enum(['complaint', 'related']).default('complaint'),
        quotes: z
          .array(
            z.object({
              id: z.number().int().min(0),
              severity: z.number().int().min(1).max(3).default(2),
            })
          )
          .min(1),
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

export const CompetitorListLLMSchema = z.object({
  competitors: z
    .array(
      z.object({
        name: z.string().min(1),
        url: z.string().optional(),
        description: z.string().min(3),
      })
    )
    .max(4),
});
export type CompetitorListLLM = z.infer<typeof CompetitorListLLMSchema>;

const OpinionBulletLLMSchema = z.object({
  text: z.string().min(3),
  materialIds: z.array(z.string().min(1)).min(1).max(3),
});

export const CompetitorOpinionLLMSchema = z.object({
  likes: z.array(OpinionBulletLLMSchema).max(4),
  dislikes: z.array(OpinionBulletLLMSchema).max(4),
  edge: z.string().min(3),
  description: z.string().optional(),
});
export type CompetitorOpinionLLM = z.infer<typeof CompetitorOpinionLLMSchema>;

export const MentionedProductsLLMSchema = z.object({
  products: z
    .array(
      z.object({
        name: z.string().min(2),
        relevant: z.boolean(),
        quoteIds: z.array(z.number().int().min(0)).min(1).max(5),
      })
    )
    .max(6),
});
export type MentionedProductsLLM = z.infer<typeof MentionedProductsLLMSchema>;

export const CompetitorRelevanceLLMSchema = z.object({
  products: z
    .array(
      z.object({
        name: z.string(),
        relevant: z.boolean(),
      })
    )
    .max(8),
});
export type CompetitorRelevanceLLM = z.infer<typeof CompetitorRelevanceLLMSchema>;
