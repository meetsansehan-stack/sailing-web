// 검토 후 발행 — 지정 일자(또는 오늘)의 draft 이슈를 published로 flip.
// 사람이 preview로 검토한 뒤 의식적으로 실행하는 발행 게이트 (§10.1 책임).
// 빈 이슈(기사 0건)는 거부 — 홈에 빈 카드 방지.
import { prisma } from '@parenting-newsletter/db';
import { kstIssueDate, issueDateString } from '@parenting-newsletter/shared';

async function main() {
  const arg = process.argv[2];
  const ds = arg ?? issueDateString(kstIssueDate());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ds)) {
    console.error('사용법: pipeline:publish [YYYY-MM-DD]  (생략 시 오늘)');
    process.exit(1);
  }

  const all = await prisma.dailyIssue.findMany({ select: { id: true, issueDate: true, status: true } });
  const target = all.find((i) => i.issueDate.toISOString().slice(0, 10) === ds);
  if (!target) {
    console.error(`❌ ${ds} 이슈가 없습니다.`);
    process.exit(1);
  }

  const count = await prisma.article.count({ where: { issueDate: target.issueDate } });
  if (count === 0) {
    console.error(`❌ ${ds}는 기사 0건 — 빈 이슈라 발행하지 않습니다.`);
    process.exit(1);
  }

  if (target.status === 'published') {
    console.log(`ℹ️ ${ds}는 이미 published (기사 ${count}건). 변경 없음.`);
    await prisma.$disconnect();
    return;
  }

  await prisma.dailyIssue.update({ where: { id: target.id }, data: { status: 'published' } });
  console.log(`✅ 발행 완료: ${ds} (기사 ${count}건) → published`);
  console.log(`   홈: http://localhost:3000/`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ 발행 실패:', e instanceof Error ? e.message : e);
  process.exit(1);
});
