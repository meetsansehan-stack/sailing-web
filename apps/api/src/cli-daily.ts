// 일일 파이프라인 수동 트리거 (매일 사람이 1회 실행 — 무인 CI 아님, 약관 안전).
// runFullPipeline로 오늘자 이슈를 draft 생성 → 단계 결과·qa 경고·비용·검토 링크 출력.
// 발행(published)은 하지 않음 — 사람이 preview로 검토 후 `pipeline:publish`로 별도 flip (§10.1).
import { costTracker } from '@parenting-newsletter/agents-core';
import { kstIssueDate, issueDateString } from '@parenting-newsletter/shared';
import { prisma } from '@parenting-newsletter/db';
import { runFullPipeline } from './pipeline';

function line(s = '') {
  console.log(s);
}

async function main() {
  const start = Date.now();
  costTracker.reset();
  const issueDate = kstIssueDate();
  const ds = issueDateString(issueDate);

  line(`\n🚀 일일 파이프라인 — ${ds} (KST)\n`);

  const result = await runFullPipeline();
  const mins = ((Date.now() - start) / 60000).toFixed(1);

  // ── 단계 결과 ──
  line('─── 단계 결과 ───');
  for (const s of result.stages) {
    const icon = s.status === 'success' ? '✅' : s.status === 'failed' ? '❌' : '⏭️ ';
    line(`  ${icon} ${s.name}${s.error ? ' — ' + s.error.slice(0, 90) : ''}`);
  }
  if (result.stopped) line('  ⚠️ hard 단계 실패로 파이프라인 중단됨.');

  // ── 생성물 요약 + qa 경고 ──
  const issue = await prisma.dailyIssue.findUnique({
    where: { issueDate },
    select: { title: true, summary: true, status: true },
  });
  const articles = await prisma.article.findMany({
    where: { issueDate },
    select: { id: true, dateCheck: true },
  });
  // qa: dateCheck에 'unconfirmed'가 하나라도 있는 기사 = 운영자 확인 대상.
  let needCheck = 0;
  for (const a of articles) {
    const dc = a.dateCheck as Record<string, unknown> | null;
    if (dc && Object.values(dc).some((v) => v === 'unconfirmed')) needCheck += 1;
  }

  line('\n─── 생성물 ───');
  line(`  이슈: ${issue?.title ?? '(제목 없음)'}`);
  line(`  기사: ${articles.length}건  ·  상태: ${issue?.status ?? '?'}`);
  if (needCheck > 0) line(`  ⚠️ qa: ${needCheck}건은 원문 날짜 '미확인' — 발행 전 확인 권장`);
  else line(`  ✅ qa: 날짜 경고 없음`);

  // ── 비용/사용량 ──
  line('\n─── 비용/사용량 (이번 실행) ───');
  line(`  LLM 호출: ${costTracker.calls}회  ·  소요: ${mins}분`);
  const cost = costTracker.totalUsd;
  line(`  비용(SDK 보고): $${cost.toFixed(4)}${cost === 0 ? '  (구독 OAuth 경로는 $0로 보고될 수 있음)' : ''}`);
  line(`  토큰: in ${costTracker.inputTokens.toLocaleString()} / out ${costTracker.outputTokens.toLocaleString()}`);

  // ── 검토 안내 (발행 게이트) ──
  const token = process.env.PREVIEW_TOKEN ?? '';
  line('\n─── 검토 (발행 전 필수) ───');
  line(`  상태 = draft (아직 비공개). 톤·정확성 확인 후 발행하세요.`);
  line(`  미리보기: http://localhost:3000/issues/${ds}?preview=${token}`);
  line(`  발행:     pnpm pipeline:publish ${ds}`);
  line('');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('\n❌ 일일 파이프라인 실패:', e instanceof Error ? e.message : e);
  console.error('   (인증 401이면 OAuth 토큰 만료 가능 — `claude setup-token`으로 갱신 후 .env 교체)');
  process.exit(1);
});
