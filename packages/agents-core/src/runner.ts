import { prisma } from '@parenting-newsletter/db';

export type AgentName = 'research' | 'curation' | 'writer' | 'editor' | 'qa' | 'hooking';

export type AgentRunOptions<TInput, TOutput> = {
  agentName: AgentName;
  /** 이 실행이 속한 이슈 일자 (KST 자정 기준). DailyIssue가 없으면 생성. */
  issueDate: Date;
  /** 기사 건당 실행하는 에이전트(writer)의 대상 Article id. AgentLog.articleId에 기록. */
  articleId?: string;
  input: TInput;
  /** Claude 호출 + 후처리. throw 시 AgentLog는 failed로 기록되고 에러 재throw. */
  run: () => Promise<TOutput>;
};

export type AgentRunResult<TOutput> = {
  output: TOutput;
  processingTimeMs: number;
  logId: string;
};

/**
 * 에이전트 실행을 AgentLog 라이프사이클로 감싸는 헬퍼.
 * - 시작 시: DailyIssue 보장 + AgentLog (status: 'processing') 생성
 * - 종료 시: success/failed로 업데이트 + processingTimeMs 기록
 * - 실패해도 throw 전에 errorMessage 기록
 */
export async function runAgent<TInput, TOutput>(
  options: AgentRunOptions<TInput, TOutput>,
): Promise<AgentRunResult<TOutput>> {
  const { agentName, issueDate, articleId, input, run } = options;
  const startedAt = Date.now();

  const issue = await prisma.dailyIssue.upsert({
    where: { issueDate },
    update: {},
    create: { issueDate },
    select: { id: true },
  });

  const log = await prisma.agentLog.create({
    data: {
      issueId: issue.id,
      agentName,
      articleId,
      status: 'processing',
      input: input as object,
    },
    select: { id: true },
  });

  try {
    const output = await run();
    const processingTimeMs = Date.now() - startedAt;

    await prisma.agentLog.update({
      where: { id: log.id },
      data: {
        status: 'success',
        output: output as object,
        processingTimeMs,
      },
    });

    return { output, processingTimeMs, logId: log.id };
  } catch (err) {
    const processingTimeMs = Date.now() - startedAt;
    const errorMessage = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err);

    await prisma.agentLog.update({
      where: { id: log.id },
      data: {
        status: 'failed',
        errorMessage,
        processingTimeMs,
      },
    });

    throw err;
  }
}
