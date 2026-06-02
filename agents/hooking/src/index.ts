import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateStructured, runAgent, AGENT_MODELS } from '@parenting-newsletter/agents-core';
import { prisma } from '@parenting-newsletter/db';
import { kstIssueDate, issueDateString } from '@parenting-newsletter/shared';
import {
  HookingAgentInputSchema,
  HookingAgentOutputSchema,
  type HookingAgentInput,
  type HookingAgentOutput,
} from '../schema';

const HOOKING_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  required: ['cardHook', 'homeCopy', 'processingTimeMs'],
  properties: {
    cardHook: { type: 'string', maxLength: 50, description: '그날의 한 줄 후킹 → DailyIssue.title' },
    homeCopy: { type: 'string', maxLength: 100, description: '그날의 짧은 요약 → DailyIssue.summary' },
    processingTimeMs: { type: 'number' },
  },
} as const;

function loadPrompt(): string {
  return readFileSync(resolve(__dirname, '..', 'prompt.md'), 'utf-8');
}

export type HookingRunOptions = {
  date?: Date;
};

/**
 * 프로듀서: 이슈 기사들 → 한 줄 후킹·짧은 요약 생성.
 * DailyIssue.title ← cardHook, DailyIssue.summary ← homeCopy.
 */
export async function runHooking(opts: HookingRunOptions = {}) {
  const issueDate = kstIssueDate(opts.date);

  const issue = await prisma.dailyIssue.findUnique({
    where: { issueDate },
    select: { id: true, theme: true },
  });
  if (!issue) {
    throw new Error(`No DailyIssue for ${issueDateString(issueDate)} (curation 먼저 실행 필요)`);
  }

  const articles = await prisma.article.findMany({
    where: { issueDate },
    select: { id: true, title: true, category: true },
  });
  if (articles.length === 0) {
    throw new Error(`No articles for ${issueDateString(issueDate)}`);
  }

  const input: HookingAgentInput = {
    theme: issue.theme ?? undefined,
    articles: articles.map((a) => ({ id: a.id, title: a.title, category: a.category })),
  };
  HookingAgentInputSchema.parse(input);

  const systemPrompt = loadPrompt();
  const userPrompt = [
    `오늘 일자(KST): ${issueDateString(issueDate)}`,
    input.theme ? `오늘의 테마: ${input.theme}` : '',
    `아래 ${articles.length}개 기사를 보고 오늘의 cardHook(≤50)과 homeCopy(≤100)를 만드세요.`,
    '',
    JSON.stringify(input.articles, null, 2),
  ]
    .filter(Boolean)
    .join('\n');

  return runAgent({
    agentName: 'hooking',
    issueDate,
    input,
    run: async (): Promise<HookingAgentOutput> => {
      const { data } = await generateStructured<HookingAgentOutput>({
        systemPrompt,
        userPrompt,
        outputSchema: HookingAgentOutputSchema,
        outputJsonSchema: HOOKING_OUTPUT_JSON_SCHEMA,
        allowedTools: [],
        model: AGENT_MODELS.hooking,
      });

      await prisma.dailyIssue.update({
        where: { id: issue.id },
        data: { title: data.cardHook, summary: data.homeCopy },
      });

      return data;
    },
  });
}

// CLI 진입은 src/cli.ts에서 처리.
