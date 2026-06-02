import { query, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { ZodType } from 'zod';

const DEFAULT_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

/**
 * SDK는 ANTHROPIC_API_KEY 환경변수를 자동으로 읽음.
 * 이 프로젝트는 .env에 CLAUDE_API_KEY로 저장하므로 호출 전에 한 번 동기화.
 * Max 자동 흡수(2026-06-15부터)도 API 키 기반이라 동일.
 */
function ensureApiKey(): void {
  const claudeKey = process.env.CLAUDE_API_KEY;
  if (!process.env.ANTHROPIC_API_KEY && claudeKey && !claudeKey.startsWith('sk-ant-...')) {
    process.env.ANTHROPIC_API_KEY = claudeKey;
  }
  const effective = process.env.ANTHROPIC_API_KEY ?? process.env.CLAUDE_API_KEY;
  if (!effective || effective.startsWith('sk-ant-...')) {
    throw new Error(
      'CLAUDE_API_KEY (or ANTHROPIC_API_KEY) is not set or still placeholder. Update .env.',
    );
  }
}

export type StructuredOutputOptions<T> = {
  systemPrompt: string;
  userPrompt: string;
  outputSchema: ZodType<T>;
  /** JSON Schema 객체 (z.toJSONSchema 또는 수기 정의). outputSchema와 동기 유지. */
  outputJsonSchema: Record<string, unknown>;
  /** 추가로 허용할 도구. 기본은 WebSearch만. 빈 배열 주면 도구 없음. */
  allowedTools?: string[];
  model?: string;
  /** 최대 턴 수 (도구 호출 왕복 횟수). 기본 30. */
  maxTurns?: number;
};

export type StructuredOutputResult<T> = {
  data: T;
  durationMs: number;
  totalCostUsd: number;
  numTurns: number;
};

/**
 * Claude Agent SDK의 query()를 outputFormat=json_schema로 감싼 헬퍼.
 * 최종 result 메시지에서 structured_output 추출 + Zod 재검증.
 *
 * 구조화 출력 실패 시 SDK가 자동 재시도 (max_structured_output_retries 도달 시 error 메시지).
 */
export async function generateStructured<T>(
  options: StructuredOutputOptions<T>,
): Promise<StructuredOutputResult<T>> {
  ensureApiKey();

  const {
    systemPrompt,
    userPrompt,
    outputSchema,
    outputJsonSchema,
    allowedTools = ['WebSearch'],
    model = DEFAULT_MODEL,
    maxTurns = 30,
  } = options;

  const sdkOptions: Options = {
    model,
    systemPrompt,
    allowedTools,
    maxTurns,
    outputFormat: { type: 'json_schema', schema: outputJsonSchema },
    // 별도 파일 시스템·셸 등 빌트인 도구는 명시한 것만 허용.
    tools: allowedTools,
    persistSession: false,
  };

  let resultMsg: SDKMessage | null = null;
  for await (const msg of query({ prompt: userPrompt, options: sdkOptions })) {
    if (msg.type === 'result') {
      resultMsg = msg;
      break;
    }
  }

  if (!resultMsg) {
    throw new Error('Claude Agent SDK: query closed without result message.');
  }

  if (resultMsg.subtype !== 'success') {
    throw new Error(
      `Claude Agent SDK failed: subtype=${resultMsg.subtype}, errors=${(resultMsg as { errors?: string[] }).errors?.join('; ') ?? 'unknown'}`,
    );
  }

  const rawOutput = resultMsg.structured_output;
  if (rawOutput === undefined) {
    throw new Error(
      'Claude Agent SDK returned success but no structured_output. Did you set outputFormat?',
    );
  }

  const parsed = outputSchema.safeParse(rawOutput);
  if (!parsed.success) {
    throw new Error(
      `structured_output failed Zod re-validation: ${parsed.error.message}\nRaw: ${JSON.stringify(rawOutput).slice(0, 500)}`,
    );
  }

  return {
    data: parsed.data,
    durationMs: resultMsg.duration_ms,
    totalCostUsd: resultMsg.total_cost_usd,
    numTurns: resultMsg.num_turns,
  };
}
