import { z } from 'zod';

// 카테고리는 packages/shared/src/article.ts 의 Category 타입과 동기화 유지.
// 향후 shared를 agent에서 import할 수 있도록 셋업되면 z.enum 대신 그 값 재사용.
const CategoryEnum = z.enum([
  'policy',
  'parenting',
  'academy',
  'play',
  'shows',
  'books',
  'market',
  'others',
]);

const ContentTypeEnum = z.enum(['Policy', 'Event', 'Market', 'Insight', 'Guide']);

export const ResearchAgentInputSchema = z.object({
  date: z.string().describe('수행 날짜 (ISO 8601)'),
  categories: z.array(CategoryEnum).describe('검색할 카테고리들'),
});

export const ArticleSchema = z.object({
  title: z.string().describe('기사 제목'),
  url: z.string().url().describe('원문 링크'),
  summary: z.string().max(150).describe('150자 이내 요약'),
  category: CategoryEnum.describe('기사 카테고리'),
  contentType: ContentTypeEnum.optional().describe('콘텐츠 타입 (큐레이션 단계에서 확정 가능)'),
  eventStartDate: z
    .string()
    .optional()
    .describe('Event 한정 — 행사 시작일 (YYYY-MM-DD). 미래 4주 윈도우. 모르면 생략'),
  eventEndDate: z
    .string()
    .optional()
    .describe('Event 한정 — 행사 종료일 (YYYY-MM-DD). 다일 행사일 때만, 시작일=종료일이거나 모르면 생략'),
  deadline: z
    .string()
    .optional()
    .describe('신청·접수 마감일 (YYYY-MM-DD). 해당 시에만, 모르면 생략'),
  source: z.string().describe('출처/언론사'),
  publishedAt: z.string().datetime().describe('발행일시 (ISO 8601)'),
  credibilityScore: z.number().min(0).max(1).describe('신뢰도 점수 (0.0~1.0)'),
});

export const ResearchAgentOutputSchema = z.object({
  articles: z.array(ArticleSchema).describe('검색된 기사 목록'),
  totalCount: z.number().describe('총 기사 수'),
  processingTimeMs: z.number().describe('처리 시간 (밀리초)'),
});

export type ResearchAgentInput = z.infer<typeof ResearchAgentInputSchema>;
export type ResearchAgentOutput = z.infer<typeof ResearchAgentOutputSchema>;
