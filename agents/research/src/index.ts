import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateStructured, runAgent, AGENT_MODELS } from '@parenting-newsletter/agents-core';
import { CATEGORIES, RESEARCH_TARGET, kstIssueDate, type Category } from '@parenting-newsletter/shared';
import {
  ResearchAgentInputSchema,
  ResearchAgentOutputSchema,
  type ResearchAgentInput,
  type ResearchAgentOutput,
} from '../schema';

// Claude가 호출할 tool의 JSON schema. Zod 스키마와 동기 유지.
// 변경 시 ../schema.ts ResearchAgentOutputSchema 와 같이 수정.
const RESEARCH_TOOL_INPUT_SCHEMA = {
  type: 'object',
  required: ['articles', 'totalCount', 'processingTimeMs'],
  properties: {
    articles: {
      type: 'array',
      minItems: 1,
      maxItems: RESEARCH_TARGET,
      items: {
        type: 'object',
        required: ['title', 'url', 'summary', 'category', 'source', 'publishedAt', 'credibilityScore'],
        properties: {
          title: { type: 'string', description: '기사 제목' },
          url: { type: 'string', format: 'uri', description: '원문 링크 (https://…)' },
          summary: { type: 'string', maxLength: 150, description: '150자 이내 한 줄 요약' },
          category: { type: 'string', enum: [...CATEGORIES], description: '기사 카테고리 슬러그' },
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
          deadline: {
            type: 'string',
            format: 'date',
            description: '신청·접수 마감일 YYYY-MM-DD. 해당 시에만, 모르면 생략',
          },
          source: { type: 'string', description: '출처 (예: 교육부, EBS, 베이비뉴스)' },
          publishedAt: { type: 'string', format: 'date-time', description: '원문 발행일시 ISO 8601' },
          credibilityScore: { type: 'number', minimum: 0, maximum: 1, description: '신뢰도 0.0~1.0' },
        },
      },
    },
    totalCount: { type: 'number', description: '제출하는 기사 총 개수' },
    processingTimeMs: { type: 'number', description: '에이전트가 추정한 처리 시간 (실측은 러너가 덮음)' },
  },
} as const;

function loadPrompt(): string {
  // tsx가 CJS로 컴파일하므로 __dirname 사용 가능.
  // src/ 한 단계 위가 agents/research/ 루트.
  const promptPath = resolve(__dirname, '..', 'prompt.md');
  return readFileSync(promptPath, 'utf-8');
}

export type ResearchRunOptions = {
  /** KST 일자 기준. 기본은 오늘 (KST). */
  date?: Date;
  /** 검색할 카테고리. 기본은 7개 전체. */
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
  const userPrompt = [
    `오늘 일자 (KST): ${issueDate.toISOString().slice(0, 10)}`,
    `대상 카테고리: ${categories.join(', ')}`,
    '',
    'WebSearch 도구로 한국의 최신 육아·교육 뉴스를 수집한 뒤,',
    `가능한 만큼 (목표 최대 ${RESEARCH_TARGET}개까지) JSON으로 반환하세요. 적게 나오는 날은 적은 대로 OK (품질 우선).`,
    '시기성 1주 윈도우 (Event 타입은 미래 4주 OK).',
  ].join('\n');

  return runAgent({
    agentName: 'research',
    issueDate,
    input,
    run: async (): Promise<ResearchAgentOutput> => {
      const { data } = await generateStructured<ResearchAgentOutput>({
        systemPrompt,
        userPrompt,
        outputSchema: ResearchAgentOutputSchema,
        outputJsonSchema: RESEARCH_TOOL_INPUT_SCHEMA,
        allowedTools: ['WebSearch'],
        model: AGENT_MODELS.research,
      });
      return data;
    },
  });
}

// CLI 진입은 src/cli.ts에서 처리.
