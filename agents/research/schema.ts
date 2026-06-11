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
  // 뉴스 출처는 날짜만 주는 경우가 많아 date-only도 허용 (curation은 new Date()로 파싱).
  // optional — 모델이 원문 날짜를 못 찾으면 생략 가능. 누락 시 curation이 issueDate(오늘)로 기본값 처리.
  // (required로 두면 모델이 날짜를 못 채울 때 카테고리 전체가 Zod 실패 → 값비싼 WebSearch 재시도 낭비.)
  publishedAt: z
    .string()
    .refine((s) => /^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(s), {
      message: 'YYYY-MM-DD 또는 ISO 8601 datetime 형식이어야 함',
    })
    .optional()
    .describe('발행일 (YYYY-MM-DD 또는 ISO 8601 datetime). 모르면 생략 — curation이 오늘로 기본 처리'),
  credibilityScore: z.number().min(0).max(1).describe('신뢰도 점수 (0.0~1.0)'),
});

export const ResearchAgentOutputSchema = z.object({
  articles: z.array(ArticleSchema).describe('검색된 기사 목록'),
  // totalCount·processingTimeMs는 잉여 메타데이터 — 러너(runAgent)가 실측 processingTimeMs를 별도 기록하고,
  // 개수는 articles.length로 파생된다. 모델이 누락해도 실패시키지 않도록 optional.
  totalCount: z.number().optional().describe('총 기사 수 (생략 시 articles.length)'),
  processingTimeMs: z.number().optional().describe('처리 시간 (밀리초, 러너가 실측으로 기록)'),
});

export type ResearchAgentInput = z.infer<typeof ResearchAgentInputSchema>;
export type ResearchAgentOutput = z.infer<typeof ResearchAgentOutputSchema>;
