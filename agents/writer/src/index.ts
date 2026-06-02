import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateStructured, runAgent, AGENT_MODELS } from '@parenting-newsletter/agents-core';
import { prisma } from '@parenting-newsletter/db';
import { kstIssueDate, issueDateString } from '@parenting-newsletter/shared';
import {
  WriterAgentInputSchema,
  WriterAgentOutputSchema,
  type WriterAgentInput,
  type WriterAgentOutput,
} from '../schema';

// Claude가 반환할 JSON schema. Zod(WriterAgentOutputSchema)와 동기 유지.
const WRITER_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  required: ['body', 'processingTimeMs'],
  properties: {
    body: {
      type: 'string',
      description: '카드뉴스 본문 (## 헤딩 + - 불릿, 명사형 종결). 마크다운.',
    },
    eventStartDate: {
      type: 'string',
      format: 'date',
      description: 'Event 한정 — 원문에서 확인한 행사 시작일 YYYY-MM-DD. 불명확하면 생략',
    },
    deadline: {
      type: 'string',
      format: 'date',
      description: '원문에서 확인한 신청·접수 마감일 YYYY-MM-DD. 해당 시에만, 불명확하면 생략',
    },
    processingTimeMs: {
      type: 'number',
      description: '추정 처리 시간 (실측은 러너가 덮음). 0 가능.',
    },
  },
} as const;

function loadPrompt(): string {
  // src/ 한 단계 위가 agents/writer/ 루트.
  const promptPath = resolve(__dirname, '..', 'prompt.md');
  return readFileSync(promptPath, 'utf-8');
}

export type WriterRunOptions = {
  /** 본문을 집필할 대상 Article id (curation이 만든 draft). */
  articleId: string;
};

/**
 * 기사 건당 카드뉴스 본문 집필.
 * - curation이 만든 draft Article을 DB에서 로드 (단일 출처).
 * - WebFetch로 원문을 읽고 body 집필 → Article.body 갱신.
 * - 소스 전문은 저장하지 않음 (transient read, 저작권). SPEC §1 각주.
 */
export async function runWriter(opts: WriterRunOptions) {
  const article = await prisma.article.findUniqueOrThrow({
    where: { id: opts.articleId },
    select: {
      id: true,
      title: true,
      summary: true,
      url: true,
      category: true,
      contentType: true,
      source: true,
      issueDate: true,
    },
  });

  const input: WriterAgentInput = {
    articleId: article.id,
    title: article.title,
    summary: article.summary,
    url: article.url,
    category: article.category as WriterAgentInput['category'],
    contentType: article.contentType as WriterAgentInput['contentType'],
    source: article.source,
  };

  // 입력 검증 — DB 값이 enum 범위를 벗어나면 조기 차단.
  WriterAgentInputSchema.parse(input);

  const systemPrompt = loadPrompt();
  const userPrompt = [
    `다음 기사의 카드뉴스 본문을 집필하세요.`,
    '',
    `제목: ${input.title}`,
    `카테고리: ${input.category}`,
    `콘텐츠 타입: ${input.contentType}`,
    `출처: ${input.source}`,
    `요약: ${input.summary}`,
    `원문 URL: ${input.url}`,
    '',
    '먼저 위 URL을 WebFetch로 읽고, 타입별 헤딩 가이드에 맞춰 작성하세요.',
  ].join('\n');

  return runAgent({
    agentName: 'writer',
    issueDate: article.issueDate,
    articleId: article.id,
    input,
    run: async (): Promise<WriterAgentOutput> => {
      const { data } = await generateStructured<WriterAgentOutput>({
        systemPrompt,
        userPrompt,
        outputSchema: WriterAgentOutputSchema,
        outputJsonSchema: WRITER_OUTPUT_JSON_SCHEMA,
        allowedTools: ['WebFetch'],
        model: AGENT_MODELS.writer,
      });

      // 집필 성공 → Article.body 갱신. 실패하면 runAgent가 failed로 기록.
      // writer가 원문에서 확인한 날짜는 권위값으로 보정(research best-effort 덮음). 없으면 기존 보존.
      await prisma.article.update({
        where: { id: article.id },
        data: {
          body: data.body,
          ...(data.eventStartDate ? { eventStartDate: new Date(data.eventStartDate) } : {}),
          ...(data.deadline ? { deadline: new Date(data.deadline) } : {}),
        },
      });

      return data;
    },
  });
}

export type WriterFanoutOptions = {
  /** KST 일자 기준. 기본은 오늘 (KST). */
  date?: Date;
  /** true면 body가 비어있는 기사만 (재실행 시 이미 쓴 것 건너뜀). 기본 true. */
  onlyEmpty?: boolean;
};

export type WriterFanoutResult = {
  issueDate: Date;
  total: number;
  succeeded: number;
  failed: { articleId: string; error: string }[];
};

/**
 * 이슈 단위 fan-out: curation이 만든 draft 기사들을 건당 집필.
 * 일부 기사 실패는 degrade(건너뜀), 전체 중단 아님 (SPEC §6.4-3).
 */
export async function runWriterForIssue(opts: WriterFanoutOptions = {}): Promise<WriterFanoutResult> {
  const issueDate = kstIssueDate(opts.date);
  const onlyEmpty = opts.onlyEmpty ?? true;

  const articles = await prisma.article.findMany({
    where: { issueDate, ...(onlyEmpty ? { body: '' } : {}) },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  const failed: { articleId: string; error: string }[] = [];
  let succeeded = 0;

  for (const { id } of articles) {
    try {
      await runWriter({ articleId: id });
      succeeded += 1;
    } catch (err) {
      failed.push({ articleId: id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  console.log(
    `[writer] ${issueDateString(issueDate)}: ${succeeded}/${articles.length} 집필 성공` +
      (failed.length ? `, ${failed.length}건 실패(degrade)` : ''),
  );

  return { issueDate, total: articles.length, succeeded, failed };
}

// CLI 진입은 src/cli.ts에서 처리.
