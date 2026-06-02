import { z } from 'zod';

// 소셜/뉴스레터 프로듀서: 그날 이슈의 한 줄 후킹 + 짧은 요약 생성.
// MVP는 SEO·SNS 미포함 (seoHeadline·visualTheme 제거 — 기능 착수 시 부활). SPEC §3.5·§7-D
export const HookingAgentInputSchema = z.object({
  theme: z.string().optional(),
  articles: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      category: z.string(),
    }),
  ),
});

export const HookingAgentOutputSchema = z.object({
  cardHook: z.string().max(50).describe('그날의 한 줄 후킹 → DailyIssue.title'),
  homeCopy: z.string().max(100).describe('그날의 짧은 요약 → DailyIssue.summary'),
  processingTimeMs: z.number(),
});

export type HookingAgentInput = z.infer<typeof HookingAgentInputSchema>;
export type HookingAgentOutput = z.infer<typeof HookingAgentOutputSchema>;
