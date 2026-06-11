import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateStructured, runAgent, AGENT_MODELS } from '@parenting-newsletter/agents-core';
import { prisma } from '@parenting-newsletter/db';
import { PUBLISH_MIN, PUBLISH_MAX, kstIssueDate, issueDateString } from '@parenting-newsletter/shared';
import {
  CurationAgentInputSchema,
  CurationAgentOutputSchema,
  type CurationAgentInput,
  type CurationAgentOutput,
} from '../schema';

// research AgentLog.output.articles의 후보 형태 (research/schema ArticleSchema).
type ResearchCandidate = {
  title: string;
  url: string;
  summary: string;
  category: string;
  contentType?: string;
  source: string;
  publishedAt?: string; // research best-effort — 누락 시 issueDate(오늘)로 기본 처리
  credibilityScore: number;
  eventStartDate?: string; // Event 시작일 (YYYY-MM-DD), research best-effort
  eventEndDate?: string; // Event 종료일 (YYYY-MM-DD), 다일 행사
  deadline?: string; // 신청·접수 마감일 (YYYY-MM-DD)
};

const CURATION_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  required: ['selectedArticles', 'totalSelected', 'processingTimeMs'],
  properties: {
    selectedArticles: {
      type: 'array',
      items: {
        type: 'object',
        required: ['articleId', 'contentType', 'relevanceScore', 'rationale'],
        properties: {
          articleId: { type: 'string', description: '입력 후보의 id (인덱스 문자열)' },
          contentType: {
            type: 'string',
            enum: ['Policy', 'Event', 'Market', 'Insight', 'Guide'],
          },
          relevanceScore: { type: 'number', minimum: 0, maximum: 1 },
          rationale: { type: 'string', maxLength: 150 },
        },
      },
    },
    totalSelected: { type: 'number' },
    processingTimeMs: { type: 'number' },
  },
} as const;

function loadPrompt(): string {
  return readFileSync(resolve(__dirname, '..', 'prompt.md'), 'utf-8');
}

export type CurationRunOptions = {
  /** KST 일자 기준. 기본은 오늘 (KST). */
  date?: Date;
};

/**
 * 데스크 에디터: 직전 research 후보 → 선별 → **Article draft 행 생성 + IssueArticle 연결** (B1).
 * - 후보는 직전 research AgentLog(success).output에서 로드.
 * - 선별 결과로 Article 행 생성 (body는 빈 칸 → writer가 채움). (issueDate,url) 멱등.
 */
export async function runCuration(opts: CurationRunOptions = {}) {
  const issueDate = kstIssueDate(opts.date);

  // 1) 직전 research 성공 로그에서 후보 로드.
  const researchLog = await prisma.agentLog.findFirst({
    where: { agentName: 'research', status: 'success', issue: { issueDate } },
    orderBy: { createdAt: 'desc' },
    select: { output: true },
  });
  if (!researchLog?.output) {
    throw new Error(`No successful research output for issueDate ${issueDateString(issueDate)}`);
  }
  const candidates = (researchLog.output as { articles?: ResearchCandidate[] }).articles ?? [];
  if (candidates.length === 0) {
    throw new Error(`Research output has no candidates for ${issueDateString(issueDate)}`);
  }

  // 후보에 임시 id(인덱스) 부여 → Claude는 이 id로 선별 결과를 가리킴.
  const indexed = candidates.map((c, i) => ({ id: String(i), ...c }));

  const input: CurationAgentInput = {
    articles: indexed.map((c) => ({
      id: c.id,
      title: c.title,
      url: c.url,
      summary: c.summary,
      category: c.category,
      source: c.source,
      // research가 원문 날짜를 못 찾으면 오늘(issueDate)로 기본 처리 — 후보를 버리지 않기 위함.
      publishedAt: c.publishedAt ?? issueDateString(issueDate),
      credibilityScore: c.credibilityScore,
      ...(c.eventStartDate ? { eventStartDate: c.eventStartDate } : {}),
      ...(c.eventEndDate ? { eventEndDate: c.eventEndDate } : {}),
      ...(c.deadline ? { deadline: c.deadline } : {}),
    })),
    targetMin: PUBLISH_MIN,
    targetMax: PUBLISH_MAX,
  };
  CurationAgentInputSchema.parse(input);

  const systemPrompt = loadPrompt();
  const userPrompt = [
    `오늘 일자(KST): ${issueDateString(issueDate)}`,
    `후보 ${input.articles.length}개 중 ${PUBLISH_MIN}~${PUBLISH_MAX}개를 품질 기준으로 선별하세요.`,
    '',
    JSON.stringify(input.articles, null, 2),
  ].join('\n');

  return runAgent({
    agentName: 'curation',
    issueDate,
    input,
    run: async (): Promise<CurationAgentOutput> => {
      const { data } = await generateStructured<CurationAgentOutput>({
        systemPrompt,
        userPrompt,
        outputSchema: CurationAgentOutputSchema,
        outputJsonSchema: CURATION_OUTPUT_JSON_SCHEMA,
        allowedTools: [], // 선별 판단만 — 외부 도구 불필요
        model: AGENT_MODELS.curation,
      });

      // DailyIssue id 확보 (runAgent가 이미 upsert함).
      const issue = await prisma.dailyIssue.upsert({
        where: { issueDate },
        update: {},
        create: { issueDate },
        select: { id: true },
      });

      // 선별 결과 → Article draft 행 생성 + IssueArticle 연결. relevanceScore 내림차순 = 초기 순서.
      const selected = [...data.selectedArticles].sort(
        (a, b) => b.relevanceScore - a.relevanceScore,
      );
      let order = 0;
      for (const sel of selected) {
        const cand = indexed.find((c) => c.id === sel.articleId);
        if (!cand) continue; // 모델이 없는 id를 가리키면 스킵

        const article = await prisma.article.upsert({
          where: { issueDate_url: { issueDate, url: cand.url } },
          create: {
            title: cand.title,
            summary: cand.summary,
            body: '', // writer가 채움
            url: cand.url,
            category: cand.category,
            contentType: sel.contentType,
            source: cand.source,
            publishedAt: new Date(cand.publishedAt ?? issueDateString(issueDate)),
            credibilityScore: cand.credibilityScore,
            issueDate,
            eventStartDate: cand.eventStartDate ? new Date(cand.eventStartDate) : null,
            eventEndDate: cand.eventEndDate ? new Date(cand.eventEndDate) : null,
            deadline: cand.deadline ? new Date(cand.deadline) : null,
          },
          // 메타 갱신, body는 보존. 날짜는 research가 새로 주면 갱신(writer가 추후 보정).
          update: {
            contentType: sel.contentType,
            ...(cand.eventStartDate ? { eventStartDate: new Date(cand.eventStartDate) } : {}),
            ...(cand.eventEndDate ? { eventEndDate: new Date(cand.eventEndDate) } : {}),
            ...(cand.deadline ? { deadline: new Date(cand.deadline) } : {}),
          },
          select: { id: true },
        });

        await prisma.issueArticle.upsert({
          where: { issueId_articleId: { issueId: issue.id, articleId: article.id } },
          create: { issueId: issue.id, articleId: article.id, order },
          update: { order },
        });
        order += 1;
      }

      return data;
    },
  });
}

// CLI 진입은 src/cli.ts에서 처리.
