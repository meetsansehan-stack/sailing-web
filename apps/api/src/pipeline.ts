import { runPipeline, type PipelineStage, type PipelineResult } from '@parenting-newsletter/agents-core';
import { kstIssueDate, issueDateString } from '@parenting-newsletter/shared';
import { runResearch } from '@parenting-newsletter/agent-research';
import { runCuration } from '@parenting-newsletter/agent-curation';
import { runWriterForIssue } from '@parenting-newsletter/agent-writer';
import { runEditor } from '@parenting-newsletter/agent-editor';
import { runHooking } from '@parenting-newsletter/agent-hooking';
import { runFactCheckForIssue } from './factcheck';
import { runImageCaptureForIssue } from './images';

/**
 * 전체 파이프라인 실행 (SPEC §7-E).
 * 단계 간 데이터는 각 에이전트가 issueDate로 DB/AgentLog에서 읽어 handoff.
 * 실패 등급: research·curation = hard(중단), writer·editor·hooking = soft(degrade).
 */
export async function runFullPipeline(date?: Date): Promise<PipelineResult> {
  const issueDate = kstIssueDate(date);

  const stages: PipelineStage[] = [
    { name: 'research', failure: 'hard', run: () => runResearch({ date }) },
    { name: 'curation', failure: 'hard', run: () => runCuration({ date }) },
    { name: 'writer', failure: 'soft', run: () => runWriterForIssue({ date }) },
    // images = 원문 og:image 캡처(결정론). 실패해도 발행 차단 아님(soft) — 폴백은 CategoryVisual.
    { name: 'images', failure: 'soft', run: () => runImageCaptureForIssue(date) },
    { name: 'editor', failure: 'soft', run: () => runEditor({ date }) },
    // qa = 날짜 grounded 검증 (원문 대조). 실패해도 발행 차단 아님(soft) — 결과는 dateCheck/프리뷰 배지로.
    { name: 'qa', failure: 'soft', run: () => runFactCheckForIssue(issueDateString(issueDate)) },
    { name: 'hooking', failure: 'soft', run: () => runHooking({ date }) },
  ];

  return runPipeline(issueDate, stages);
}
