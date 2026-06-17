import { prisma } from '../src/client';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// 전체 DB 논리 백업 (Prisma → JSON). pg_dump 불필요(로컬 postgres client 미설치)·서버최소 철학 정합.
// 9개 모델 전부 덤프 → packages/db/backups/full_<timestamp>.json. Date는 JSON.stringify가 ISO로 직렬화.
// 복구는 restore.ts. Supabase 플랫폼 백업(플랜 의존)과 병행 권장 — docs/BACKUP.md.
//
// 실행: pnpm --filter @parenting-newsletter/db db:backup
//   (node --env-file=.env --import tsx scripts/backup.ts)

async function main() {
  const [
    article,
    reservableVenue,
    book,
    dailyIssue,
    issueArticle,
    agentLog,
    agentConfig,
    subscriber,
    analyticsEvent,
  ] = await Promise.all([
    prisma.article.findMany({ orderBy: { id: 'asc' } }),
    prisma.reservableVenue.findMany({ orderBy: { id: 'asc' } }),
    prisma.book.findMany({ orderBy: { id: 'asc' } }),
    prisma.dailyIssue.findMany({ orderBy: { issueDate: 'asc' } }),
    prisma.issueArticle.findMany(),
    prisma.agentLog.findMany({ orderBy: { id: 'asc' } }),
    prisma.agentConfig.findMany({ orderBy: { id: 'asc' } }),
    prisma.subscriber.findMany({ orderBy: { id: 'asc' } }),
    prisma.analyticsEvent.findMany({ orderBy: { id: 'asc' } }),
  ]);

  const data = {
    article,
    reservableVenue,
    book,
    dailyIssue,
    issueArticle,
    agentLog,
    agentConfig,
    subscriber,
    analyticsEvent,
  };

  const counts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dir = resolve(__dirname, '..', 'backups');
  mkdirSync(dir, { recursive: true });
  const file = resolve(dir, `full_${stamp}.json`);

  writeFileSync(
    file,
    JSON.stringify({ meta: { generatedAt: new Date().toISOString(), counts }, data }, null, 2),
  );

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`[backup] ${file}`);
  console.log(`[backup] rows: ${JSON.stringify(counts)} (total ${total})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('[backup] failed', e);
  process.exit(1);
});
