import { z } from 'zod';

const ContentTypeEnum = z.enum(['Policy', 'Event', 'Market', 'Insight', 'Guide']);

// 데스크 에디터: research 후보 → targetMin~targetMax개 선별(품질 컷) + 콘텐츠 타입 확정.
// targetMin/Max는 호출 측(curation src)이 packages/shared config(PUBLISH_MIN/MAX)에서 주입. SPEC §1.1·§3.2
export const CurationAgentInputSchema = z.object({
  articles: z
    .array(
      z.object({
        id: z.string().describe('후보 인덱스/임시 id (아직 Article 행 아님)'),
        title: z.string(),
        url: z.string().url(),
        summary: z.string(),
        category: z.string(),
        source: z.string(),
        // research가 date-only(YYYY-MM-DD) 또는 ISO datetime을 줄 수 있음. curation src가
        // 누락 후보는 issueDate(오늘)로 채워 항상 값이 있게 함 — 형식만 검증.
        publishedAt: z.string().refine((s) => /^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(s), {
          message: 'YYYY-MM-DD 또는 ISO 8601 datetime 형식이어야 함',
        }),
        credibilityScore: z.number(),
        eventStartDate: z.string().optional().describe('Event 시작일 (YYYY-MM-DD). Event 4주 윈도우 판단용'),
        eventEndDate: z.string().optional().describe('Event 종료일 (YYYY-MM-DD). 다일 행사 — 키데이트 진행중 span'),
        deadline: z.string().optional().describe('신청·접수 마감일 (YYYY-MM-DD)'),
      }),
    )
    .describe('리서치 에이전트 출력 후보 목록'),
  targetMin: z.number().int().describe('선별 하한 (목표, 하드 쿼터 아님 — shared PUBLISH_MIN)'),
  targetMax: z.number().int().describe('선별 상한 (shared PUBLISH_MAX)'),
});

export const CurationArticleSchema = z.object({
  articleId: z.string().describe('입력 후보의 id'),
  contentType: ContentTypeEnum.describe('확정한 콘텐츠 타입'),
  relevanceScore: z.number().min(0).max(1),
  rationale: z.string().max(150).describe('선별 이유 (150자 이내)'),
});

export const CurationAgentOutputSchema = z.object({
  selectedArticles: z.array(CurationArticleSchema),
  totalSelected: z.number(),
  processingTimeMs: z.number(),
});

export type CurationAgentInput = z.infer<typeof CurationAgentInputSchema>;
export type CurationAgentOutput = z.infer<typeof CurationAgentOutputSchema>;
