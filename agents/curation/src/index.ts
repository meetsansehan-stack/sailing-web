import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateStructured, runAgent, AGENT_MODELS } from '@parenting-newsletter/agents-core';
import { prisma } from '@parenting-newsletter/db';
import {
  PUBLISH_MIN,
  PUBLISH_MAX,
  kstIssueDate,
  issueDateString,
  isNearDuplicateTitle,
} from '@parenting-newsletter/shared';
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
  const rawCandidates = (researchLog.output as { articles?: ResearchCandidate[] }).articles ?? [];
  if (rawCandidates.length === 0) {
    throw new Error(`Research output has no candidates for ${issueDateString(issueDate)}`);
  }

  // cross-day 중복 제거: 최근 N일(시기성 윈도우=1주) 내 '다른 날' 이슈에 이미 적재된 URL은 후보에서 제외.
  // @@unique([issueDate,url])은 같은 날 중복만 막아서, 하루 차이로 RSS·검색 풀이 겹치면 같은 뉴스가
  // 이틀 연속 올라오던 문제를 해소. 같은 날 재실행은 lt:issueDate로 자기 제외 안 함(같은 날은 upsert 멱등).
  const DEDUP_WINDOW_DAYS = 7;
  const dedupSince = new Date(issueDate);
  dedupSince.setDate(dedupSince.getDate() - DEDUP_WINDOW_DAYS);
  const recentlyPublished = await prisma.article.findMany({
    where: {
      issueDate: { gte: dedupSince, lt: issueDate },
      url: { in: rawCandidates.map((c) => c.url) },
    },
    select: { url: true },
  });
  const seenUrls = new Set(recentlyPublished.map((r) => r.url));
  const afterUrlDedup = rawCandidates.filter((c) => !seenUrls.has(c.url));
  const droppedUrlDupes = rawCandidates.length - afterUrlDedup.length;

  // title-level 근접중복 제거: 같은 사건을 다른 매체·URL이 올리면 URL dedup이 못 잡는다.
  // 결정적 휴리스틱(문자 bigram Jaccard)으로 보강 — LLM 선별 전에 토큰·중복 노출을 줄인다.
  //   (1) cross-day: 최근 N일 기적재 '제목'과 근접중복 → 제외 (LLM은 과거 발행분을 못 봄).
  //   (2) within-batch: 후보들끼리 근접중복이면 credibilityScore 높은 쪽만 보존.
  const recentTitles = await prisma.article.findMany({
    where: { issueDate: { gte: dedupSince, lt: issueDate } },
    select: { title: true },
  });
  const afterCrossDayTitle = afterUrlDedup.filter(
    (c) => !recentTitles.some((r) => isNearDuplicateTitle(c.title, r.title)),
  );
  const droppedCrossDayTitle = afterUrlDedup.length - afterCrossDayTitle.length;

  // within-batch: 신뢰도 내림차순으로 보며 이미 채택한 것과 근접중복이면 버림(높은 신뢰도 보존).
  const byCredibility = [...afterCrossDayTitle].sort(
    (a, b) => b.credibilityScore - a.credibilityScore,
  );
  const candidates: ResearchCandidate[] = [];
  for (const c of byCredibility) {
    if (candidates.some((k) => isNearDuplicateTitle(c.title, k.title))) continue;
    candidates.push(c);
  }
  const droppedWithinTitle = afterCrossDayTitle.length - candidates.length;

  const droppedDupes = rawCandidates.length - candidates.length;
  if (droppedDupes > 0) {
    console.log(
      `[curation] 중복 ${droppedDupes}건 제외 (URL ${droppedUrlDupes} + cross-day 제목 ${droppedCrossDayTitle} + 배치내 제목 ${droppedWithinTitle}, 최근 ${DEDUP_WINDOW_DAYS}일 윈도우). 후보 ${rawCandidates.length}→${candidates.length}`,
    );
  }
  if (candidates.length === 0) {
    throw new Error(
      `All ${rawCandidates.length} candidates were dropped as duplicates (URL/title) for ${issueDateString(issueDate)}`,
    );
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
