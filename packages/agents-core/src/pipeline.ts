import type { AgentName } from './runner';

/**
 * 파이프라인 오케스트레이터 — SPEC §7-E.
 *
 * agents-core는 개별 에이전트 패키지를 import할 수 없다(순환 의존). 그래서 runPipeline은
 * **의존성 주입(DI)** 방식: 단계 순서와 실패 정책만 소유하고, 실제 에이전트 실행 함수는
 * 호출 측(scripts/오케스트레이터)이 주입한다. 단계 간 데이터 전달도 호출 측이 클로저로 묶는다.
 *
 * 표준 순서: research → curation → writer(건당 fan-out) → editor → hooking.
 */

/**
 * 실패 등급 (decision E):
 * - 'hard': 뒷단계가 반드시 필요로 하는 산출(후보·선별) → 실패 시 파이프라인 **중단**.
 * - 'soft': 없어도 degrade로 발행 가능(본문·교열·후킹) → 실패 시 로그 남기고 **계속**.
 */
export type StageFailureClass = 'hard' | 'soft';

export type PipelineStage = {
  name: AgentName;
  failure: StageFailureClass;
  /** 실제 실행. 내부에서 runAgent로 감싸 AgentLog를 남기는 것을 권장. */
  run: () => Promise<unknown>;
};

export type StageOutcome = {
  name: AgentName;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
};

export type PipelineResult = {
  issueDate: Date;
  stages: StageOutcome[];
  /** hard 단계 실패로 중단됐는지. */
  stopped: boolean;
};

export type RunPipelineOptions = {
  /** true면 단계 실행 로그를 console에 출력. 기본 true. */
  verbose?: boolean;
};

/**
 * 주입된 단계들을 순차 실행한다.
 * - hard 단계 실패 → 기록 후 중단, 이후 단계는 'skipped'.
 * - soft 단계 실패 → 기록 후 계속(degrade).
 * 멱등성·AgentLog 기록은 각 단계의 run()(보통 runAgent) 책임.
 */
export async function runPipeline(
  issueDate: Date,
  stages: PipelineStage[],
  options: RunPipelineOptions = {},
): Promise<PipelineResult> {
  const { verbose = true } = options;
  const outcomes: StageOutcome[] = [];
  let stopped = false;

  for (const stage of stages) {
    if (stopped) {
      outcomes.push({ name: stage.name, status: 'skipped' });
      continue;
    }

    if (verbose) console.log(`\n📋 [pipeline] ${stage.name} 실행…`);

    try {
      await stage.run();
      outcomes.push({ name: stage.name, status: 'success' });
      if (verbose) console.log(`✅ [pipeline] ${stage.name} 성공`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      outcomes.push({ name: stage.name, status: 'failed', error });

      if (stage.failure === 'hard') {
        stopped = true;
        if (verbose) console.error(`❌ [pipeline] ${stage.name} 실패 (hard) → 파이프라인 중단: ${error}`);
      } else {
        if (verbose) console.warn(`⚠️ [pipeline] ${stage.name} 실패 (soft) → degrade, 계속: ${error}`);
      }
    }
  }

  return { issueDate, stages: outcomes, stopped };
}
