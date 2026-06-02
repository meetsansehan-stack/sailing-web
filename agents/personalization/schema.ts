import { z } from 'zod';

export const PersonalizationAgentInputSchema = z.object({
  subscriberId: z.string(),
  preferredCategories: z.array(z.string()),
  articles: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
    })
  ),
});

export const PersonalizationAgentOutputSchema = z.object({
  personalizedArticles: z.array(
    z.object({
      articleId: z.string(),
      order: z.number(),
    })
  ),
  openingLine: z.string(),
  closingLine: z.string(),
  processingTimeMs: z.number(),
});

export type PersonalizationAgentInput = z.infer<typeof PersonalizationAgentInputSchema>;
export type PersonalizationAgentOutput = z.infer<typeof PersonalizationAgentOutputSchema>;
