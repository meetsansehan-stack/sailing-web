import { query, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';
import { ZodType } from 'zod';

const DEFAULT_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

/**
 * 두 가지 인증 경로 지원:
 *  (1) API 키 — console.anthropic.com 선불 크레딧. .env의 CLAUDE_API_KEY → ANTHROPIC_API_KEY로 동기화.
 *  (2) 구독(Claude Code OAuth) — `claude setup-token`으로 발급한 CLAUDE_CODE_OAUTH_TOKEN.
 *      Pro/Max 구독이면 카드 없이 SDK 호출 가능. 2026-06-15부터 Pro엔 월 $20 Agent SDK 크레딧 별도.
 * 주의: ANTHROPIC_API_KEY가 있으면 OAuth 토큰을 덮어쓰므로, OAuth로 갈 땐 CLAUDE_API_KEY를 placeholder로 비워둘 것.
 */
function ensureApiKey(): void {
  const claudeKey = process.env.CLAUDE_API_KEY;
  const hasRealApiKey = !!claudeKey && !claudeKey.startsWith('sk-ant-...');
  if (!process.env.ANTHROPIC_API_KEY && hasRealApiKey) {
    process.env.ANTHROPIC_API_KEY = claudeKey;
  }
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const hasOAuth = !!process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (!hasApiKey && !hasOAuth) {
    throw new Error(
      'No Claude auth found. Set CLAUDE_API_KEY (or ANTHROPIC_API_KEY) for API billing, ' +
        'or CLAUDE_CODE_OAUTH_TOKEN (run `claude setup-token`) to use a Pro/Max subscription.',
    );
  }
}

/**
 * 모델이 텍스트 채널로 흘려보낸 JSON을 복구한다 (structured_output 폴백용).
 * 1) ```json … ``` 코드펜스 우선 → 2) 펜스 없으면 첫 '{' ~ 마지막 '}' 구간을 객체로 시도.
 * 어느 후보도 파싱 안 되면 undefined.
 */
function extractJsonObject(text: string): unknown | undefined {
  const candidates: string[] = [];
  const fence = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/i);
  if (fence) candidates.push(fence[1]);
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates) {
    try {
      return JSON.parse(c.trim());
    } catch {
      // 다음 후보 시도
    }
  }
  return undefined;
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
  /** transient 실패(타임아웃·빈 출력 등) 시 전체 query 재시도 횟수. 기본 3. */
  maxAttempts?: number;
  /**
   * 텍스트 폴백 — structured_output도 비어 오고 결과 텍스트에서 JSON 객체도 복구 못 했을 때,
   * 결과 텍스트 원문(raw)을 받아 출력 객체로 변환한다. 출력이 사실상 "본문 한 덩어리"인
   * 에이전트(writer 등)는 모델이 JSON 래핑 없이 마크다운만 내보내는 경우가 잦은데, 이때 재시도·degrade
   * 대신 그 텍스트를 그대로 본문으로 채택한다. 반환값은 outputSchema로 동일하게 Zod 재검증됨.
   * 미지정 시(데이터형 출력 — research·curation 등) 기존처럼 복구 실패 → 상위 재시도.
   */
  textFallback?: (rawText: string) => unknown;
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
    maxAttempts = 3,
    textFallback,
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

  // transient 실패(API 타임아웃·"Request timed out"·빈 출력+복구불가 등)는 비결정적이라
  // 전체 query를 재시도하면 대개 다음 시도에서 통과한다. Zod 재검증 실패도 모델이
  // 비결정적이므로 재생성으로 회복될 여지가 있어 동일 루프로 재시도(best-effort 파이프라인).
  let lastErr: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await runStructuredOnce<T>(sdkOptions, userPrompt, outputSchema, textFallback);
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        console.warn(
          `[claude] 시도 ${attempt}/${maxAttempts} 실패 → 재시도(${attempt}s 백오프): ${lastErr.message.slice(0, 140)}`,
        );
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw new Error(`generateStructured: ${maxAttempts}회 시도 모두 실패. 마지막: ${lastErr?.message}`);
}

/** query() 1회 실행 + structured_output 추출(폴백 포함) + Zod 재검증. 실패 시 throw. */
async function runStructuredOnce<T>(
  sdkOptions: Options,
  userPrompt: string,
  outputSchema: ZodType<T>,
  textFallback?: (rawText: string) => unknown,
): Promise<StructuredOutputResult<T>> {
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

  let rawOutput = resultMsg.structured_output;

  // 폴백: Agent SDK가 subtype=success인데 structured_output을 비워 보내는 알려진 이슈
  // (anthropics/claude-agent-sdk-typescript#277) 대응. 멀티턴 도구 사용(WebSearch 다회)이나
  // 복잡한 스키마에서 모델이 최종 JSON을 구조화 채널 대신 텍스트(```json … ```)로 내보내는 경우가
  // 있어, 결과 텍스트에서 JSON 블록을 추출해 복구한 뒤 동일하게 Zod 재검증한다.
  if (rawOutput === undefined) {
    const text = String((resultMsg as { result?: string }).result ?? '');
    const recovered = extractJsonObject(text);
    if (recovered !== undefined) {
      console.warn(
        '[claude] structured_output 비어 옴 → 결과 텍스트에서 JSON 복구 (SDK issue #277 폴백).',
      );
      rawOutput = recovered;
    } else if (textFallback && text.trim()) {
      // 본문형 출력(writer 등): 모델이 JSON 래핑 없이 마크다운만 내보낸 경우.
      // 결과 텍스트를 그대로 출력 객체로 채택 → 재시도·degrade 회피. Zod로 동일 검증.
      console.warn('[claude] structured_output·JSON 모두 없음 → 결과 텍스트를 본문으로 채택 (textFallback).');
      rawOutput = textFallback(text);
    } else {
      // 텍스트도 비거나 에러 문자열("Request timed out" 등)이면 transient로 보고 상위에서 재시도.
      throw new Error(
        `no structured_output & no recoverable JSON (result text=${JSON.stringify(text.slice(0, 80))}).`,
      );
    }
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
