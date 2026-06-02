import { z } from 'zod';

const ContentTypeEnum = z.enum(['Policy', 'Event', 'Market', 'Insight', 'Guide']);

// 카피 에디터/교열: 이슈 단위 마무리 — 순서·테마 결정 + writer가 쓴 body 교열.
// 본문을 처음부터 쓰지 않음 (집필은 writer). SPEC §3.4
export const EditorAgentInputSchema = z.object({
  articles: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        body: z.string().describe('writer 산출 본문 (교열 대상)'),
        category: z.string(),
        contentType: ContentTypeEnum,
        url: z.string().url(),
      }),
    )
    .describe('writer 집필 완료된 기사 목록 (body 포함)'),
});

export const EditedArticleSchema = z.object({
  articleId: z.string(),
  customTitle: z.string(),
  customDescription: z.string().max(180),
  order: z.number().int().positive(),
  bodyPatch: z
    .string()
    .optional()
    .describe('교열 수정분 (선택). 있으면 Article.body를 이 값으로 갱신.'),
});

export const EditorAgentOutputSchema = z.object({
  theme: z.string().optional().describe('오늘의 테마'),
  articles: z.array(EditedArticleSchema),
  processingTimeMs: z.number(),
});

export type EditorAgentInput = z.infer<typeof EditorAgentInputSchema>;
export type EditorAgentOutput = z.infer<typeof EditorAgentOutputSchema>;
