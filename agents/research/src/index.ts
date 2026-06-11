import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { generateStructured, runAgent, AGENT_MODELS } from '@parenting-newsletter/agents-core';
import { CATEGORIES, RESEARCH_TARGET, kstIssueDate, type Category } from '@parenting-newsletter/shared';
import {
  ArticleSchema,
  ResearchAgentInputSchema,
  type ResearchAgentInput,
  type ResearchAgentOutput,
} from '../schema';

// 한 카테고리 호출의 출력 스키마 (articles 배열만). category enum은 호출 시 단일 값으로 고정.
const CategoryOutputSchema = z.object({ articles: z.array(ArticleSchema) });

// 한 카테고리 호출용 JSON schema — maxItems·category를 호출별로 주입.
// (전 카테고리 40개를 한 번에 뽑던 단일 호출은 스트림 idle 타임아웃·마크다운 드리프트로 폐기.
//  카테고리별 소량 fan-out = 짧은 스트림·안정 구조화 출력.)
function categoryToolSchema(category: Category, maxItems: number) {
  return {
    type: 'object',
    required: ['articles'],
    properties: {
      articles: {
        type: 'array',
        maxItems,
        items: {
          type: 'object',
          required: ['title', 'url', 'summary', 'category', 'source', 'credibilityScore'],
          properties: {
            title: { type: 'string', description: '기사 제목' },
            url: { type: 'string', format: 'uri', description: '원문 링크 (https://…)' },
            summary: { type: 'string', maxLength: 150, description: '150자 이내 한 줄 요약' },
            category: { type: 'string', enum: [category], description: `카테고리 슬러그 (이 호출은 ${category} 전담)` },
            contentType: {
              type: 'string',
              enum: ['Policy', 'Event', 'Market', 'Insight', 'Guide'],
              description: '콘텐츠 타입 (가능하면 추정, 어려우면 생략)',
            },
            eventStartDate: {
              type: 'string',
              format: 'date',
              description: 'Event 한정 — 행사 시작일 YYYY-MM-DD (미래 4주 윈도우). 모르면 생략',
            },
            eventEndDate: {
              type: 'string',
              format: 'date',
              description: 'Event 다일 행사 종료일 YYYY-MM-DD. 시작일=종료일이거나 모르면 생략',
            },
            deadline: {
              type: 'string',
              format: 'date',
              description: '신청·접수 마감일 YYYY-MM-DD. 해당 시에만, 모르면 생략',
            },
            source: { type: 'string', description: '출처 (예: 교육부, EBS, 베이비뉴스)' },
            publishedAt: { type: 'string', description: '원문 발행일 (YYYY-MM-DD 또는 ISO 8601). 날짜만 알면 날짜만. 못 찾으면 생략 가능' },
            credibilityScore: { type: 'number', minimum: 0, maximum: 1, description: '신뢰도 0.0~1.0' },
          },
        },
      },
    },
  } as const;
}

function loadPrompt(): string {
  // tsx가 CJS로 컴파일하므로 __dirname 사용 가능.
  // src/ 한 단계 위가 agents/research/ 루트.
  const promptPath = resolve(__dirname, '..', 'prompt.md');
  return readFileSync(promptPath, 'utf-8');
}

/** 동시 실행 상한(concurrency)을 둔 map — 구독 rate limit 보호용. */
async function mapWithConcurrency<TIn, TOut>(
  items: TIn[],
  limit: number,
  fn: (item: TIn, index: number) => Promise<TOut>,
): Promise<TOut[]> {
  const out: TOut[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

type ResearchCandidate = z.infer<typeof ArticleSchema>;

/** 한 카테고리 전담 수집 — 작은 출력이라 구조화 출력·스트림이 안정적. */
async function collectForCategory(
  systemPrompt: string,
  category: Category,
  target: number,
  issueDate: Date,
): Promise<ResearchCandidate[]> {
  const userPrompt = [
    `오늘 일자 (KST): ${issueDate.toISOString().slice(0, 10)}`,
    `이번 호출은 '${category}' 카테고리 전담입니다.`,
    `WebSearch로 '${category}' 관련 한국 최신 육아·교육 뉴스를 찾아, 최대 ${target}개 후보를 모으세요.`,
    '시기성 1주 윈도우 (Event 타입은 미래 4주 OK). 적게 나오면 적은 대로 OK (품질 우선).',
    '',
    '■ 출력 형식 (반드시 준수):',
    '- 검색·정리 과정 설명, 마크다운 표·리포트, 머리말/맺음말 금지.',
    `- 최종 답변은 {"articles":[…]} JSON 객체 하나로만. 모든 항목의 category는 "${category}".`,
    '- 각 summary는 150자 이내로 짧게.',
  ].join('\n');

  const { data } = await generateStructured<{ articles: ResearchCandidate[] }>({
    systemPrompt,
    userPrompt,
    outputSchema: CategoryOutputSchema,
    outputJsonSchema: categoryToolSchema(category, target + 2),
    allowedTools: ['WebSearch'],
    model: AGENT_MODELS.research,
    maxTurns: 14,
  });
  return data.articles;
}

export type ResearchRunOptions = {
  /** KST 일자 기준. 기본은 오늘 (KST). */
  date?: Date;
  /** 검색할 카테고리. 기본은 8개 전체. */
  categories?: Category[];
};

export async function runResearch(opts: ResearchRunOptions = {}) {
  const issueDate = kstIssueDate(opts.date);
  const categories = opts.categories ?? [...CATEGORIES];

  const input: ResearchAgentInput = {
    date: issueDate.toISOString(),
    categories,
  };

  // 입력 검증 — 호출자 실수 조기 차단.
  ResearchAgentInputSchema.parse(input);

  const systemPrompt = loadPrompt();
  // 카테고리별 목표 = 전체 목표를 카테고리 수로 분배 (8개면 ~5개).
  const perCategoryTarget = Math.max(3, Math.ceil(RESEARCH_TARGET / categories.length));

  return runAgent({
    agentName: 'research',
    issueDate,
    input,
    run: async (): Promise<ResearchAgentOutput> => {
      // 카테고리별 fan-out (동시 3). 한 카테고리 실패는 건너뛰고 나머지로 진행(resilient).
      const perCategory = await mapWithConcurrency(categories, 3, async (category) => {
        try {
          const articles = await collectForCategory(systemPrompt, category, perCategoryTarget, issueDate);
          console.log(`[research] '${category}': ${articles.length}건`);
          return articles;
        } catch (err) {
          console.warn(`[research] '${category}' 수집 실패(건너뜀): ${err instanceof Error ? err.message : err}`);
          return [] as ResearchCandidate[];
        }
      });

      const articles = perCategory.flat();
      if (articles.length === 0) {
        // 전 카테고리 실패 = research(hard) 실패 → 파이프라인 중단.
        throw new Error('research: 전 카테고리 수집 실패 — 후보 0건');
      }
      console.log(`[research] 합계 ${articles.length}건 (${categories.length}개 카테고리)`);
      return { articles, totalCount: articles.length };
    },
  });
}

// CLI 진입은 src/cli.ts에서 처리.
