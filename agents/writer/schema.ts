import { z } from 'zod';

// 카테고리·콘텐츠 타입은 packages/shared 와 동기화 유지.
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

// writer는 기사 건당 실행. curation이 만든 draft Article 한 건을 입력으로 받음.
export const WriterAgentInputSchema = z.object({
  articleId: z.string().describe('대상 Article id'),
  title: z.string().describe('기사 제목'),
  summary: z.string().describe('research가 만든 짧은 요약'),
  url: z.string().url().describe('원문 링크 — 집필 시점에 WebFetch로 읽을 대상'),
  category: CategoryEnum.describe('카테고리'),
  contentType: ContentTypeEnum.describe('콘텐츠 타입 (타입별 헤딩 가이드 적용)'),
  source: z.string().describe('출처/언론사'),
});

export const WriterAgentOutputSchema = z.object({
  body: z
    .string()
    .min(1)
    .describe('카드뉴스 본문 (## 헤딩 + - 불릿, 명사형 종결). 마크다운.'),
  eventStartDate: z
    .string()
    .optional()
    .describe('Event 한정 — 원문에서 확인한 행사 시작일 (YYYY-MM-DD). 불명확하면 생략'),
  deadline: z
    .string()
    .optional()
    .describe('원문에서 확인한 신청·접수 마감일 (YYYY-MM-DD). 해당 시에만, 불명확하면 생략'),
  processingTimeMs: z.number().describe('처리 시간 (밀리초, 러너가 실측으로 덮음)'),
});

export type WriterAgentInput = z.infer<typeof WriterAgentInputSchema>;
export type WriterAgentOutput = z.infer<typeof WriterAgentOutputSchema>;
