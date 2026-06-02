import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateStructured, runAgent, AGENT_MODELS } from '@parenting-newsletter/agents-core';
import { prisma } from '@parenting-newsletter/db';
import { kstIssueDate, issueDateString } from '@parenting-newsletter/shared';
import {
  EditorAgentInputSchema,
  EditorAgentOutputSchema,
  type EditorAgentInput,
  type EditorAgentOutput,
} from '../schema';

const EDITOR_OUTPUT_JSON_SCHEMA = {
  type: 'object',
  required: ['articles', 'processingTimeMs'],
  properties: {
    theme: { type: 'string', description: '그날의 한 줄 테마 (선택)' },
    articles: {
      type: 'array',
      items: {
        type: 'object',
        required: ['articleId', 'customTitle', 'customDescription', 'order'],
        properties: {
          articleId: { type: 'string' },
          customTitle: { type: 'string' },
          customDescription: { type: 'string', maxLength: 180 },
          order: { type: 'number', minimum: 1 },
          bodyPatch: { type: 'string', description: '교열 수정분 (선택)' },
        },
      },
    },
    processingTimeMs: { type: 'number' },
  },
} as const;

function loadPrompt(): string {
  return readFileSync(resolve(__dirname, '..', 'prompt.md'), 'utf-8');
}

export type EditorRunOptions = {
  date?: Date;
};

/**
 * 카피 에디터: 이슈의 기사들(writer body 포함) → 순서·테마·교열.
 * IssueArticle.customTitle·customDescription·order, DailyIssue.theme,
 * (bodyPatch 있으면) Article.body 갱신.
 */
export async function runEditor(opts: EditorRunOptions = {}) {
  const issueDate = kstIssueDate(opts.date);

  const issue = await prisma.dailyIssue.findUnique({
    where: { issueDate },
    select: { id: true },
  });
  if (!issue) {
    throw new Error(`No DailyIssue for ${issueDateString(issueDate)} (curation 먼저 실행 필요)`);
  }

  const articles = await prisma.article.findMany({
    where: { issueDate },
    select: {
      id: true,
      title: true,
      summary: true,
      body: true,
      category: true,
      contentType: true,
      url: true,
    },
  });
  if (articles.length === 0) {
    throw new Error(`No articles for ${issueDateString(issueDate)}`);
  }

  const input: EditorAgentInput = {
    articles: articles.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary,
      body: a.body,
      category: a.category,
      contentType: a.contentType as EditorAgentInput['articles'][number]['contentType'],
      url: a.url,
    })),
  };
  EditorAgentInputSchema.parse(input);

  const systemPrompt = loadPrompt();
  const userPrompt = [
    `오늘 일자(KST): ${issueDateString(issueDate)}`,
    `아래 ${articles.length}개 기사의 순서·테마·카드 텍스트를 정하세요. (교열은 필요 시 bodyPatch)`,
    '',
    JSON.stringify(input.articles, null, 2),
  ].join('\n');

  return runAgent({
    agentName: 'editor',
    issueDate,
    input,
    run: async (): Promise<EditorAgentOutput> => {
      const { data } = await generateStructured<EditorAgentOutput>({
        systemPrompt,
        userPrompt,
        outputSchema: EditorAgentOutputSchema,
        outputJsonSchema: EDITOR_OUTPUT_JSON_SCHEMA,
        allowedTools: [],
        model: AGENT_MODELS.editor,
      });

      if (data.theme) {
        await prisma.dailyIssue.update({
          where: { id: issue.id },
          data: { theme: data.theme },
        });
      }

      for (const e of data.articles) {
        await prisma.issueArticle.updateMany({
          where: { issueId: issue.id, articleId: e.articleId },
          data: { customTitle: e.customTitle, customDescription: e.customDescription, order: e.order },
        });
        if (e.bodyPatch) {
          await prisma.article.update({
            where: { id: e.articleId },
            data: { body: e.bodyPatch },
          });
        }
      }

      return data;
    },
  });
}

// CLI 진입은 src/cli.ts에서 처리.
