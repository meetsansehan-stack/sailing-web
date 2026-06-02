import { z } from 'zod';

export const QAAgentInputSchema = z.object({
  issueId: z.string(),
  newsletter: z.object({
    subjectLine: z.string(),
    previewText: z.string(),
    hookingCopy: z.string(),
    articles: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        url: z.string().url(),
        category: z.string(),
      })
    ),
  }),
});

export const QAAgentOutputSchema = z.object({
  status: z.enum(['APPROVED', 'NEEDS_REVISION', 'REJECTED']),
  issues: z.array(
    z.object({
      type: z.string(), // url-invalid, fact-error, tone-issue, etc
      severity: z.enum(['low', 'medium', 'high']),
      description: z.string(),
      articleId: z.string().optional(),
    })
  ),
  comments: z.string().max(500),
  processingTimeMs: z.number(),
});

export type QAAgentInput = z.infer<typeof QAAgentInputSchema>;
export type QAAgentOutput = z.infer<typeof QAAgentOutputSchema>;
