import { prisma } from '../src/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// 백업(backup.ts 산출 JSON)에서 복구. 기본 = dry-run(읽기·검증·리포트만). 실제 쓰기는 --commit 필수.
// FK 안전 순서로 createMany(skipDuplicates) — 기존 행은 건드리지 않음(추가 복구). 전체 교체가 필요하면
// 별도로 비우고 실행. ★ 프로덕션 쓰기 = 위험. docs/BACKUP.md 런북 참고.
//
// 실행: node --env-file=.env --import tsx scripts/restore.ts <backup-file> [--commit]

function parseDates<T extends Record<string, unknown>>(rows: T[], fields: string[]): T[] {
  return rows.map((r) => {
    const o: Record<string, unknown> = { ...r };
    for (const f of fields) if (typeof o[f] === 'string') o[f] = new Date(o[f] as string);
    return o as T;
  });
}

async function main() {
  const arg = process.argv[2];
  const commit = process.argv.includes('--commit');
  if (!arg) {
    console.error('usage: restore.ts <backup-file> [--commit]');
    process.exit(1);
  }
  const file = resolve(process.cwd(), arg);
  const parsed = JSON.parse(readFileSync(file, 'utf-8')) as { meta?: unknown; data: Record<string, Record<string, unknown>[]> };
  const d = parsed.data;

  // 날짜 필드(모델별) — JSON의 ISO 문자열을 Date로 환원.
  const DATE_FIELDS: Record<string, string[]> = {
    article: ['publishedAt', 'issueDate', 'eventStartDate', 'eventEndDate', 'deadline', 'createdAt', 'updatedAt'],
    dailyIssue: ['issueDate', 'createdAt', 'updatedAt'],
    reservableVenue: ['createdAt', 'updatedAt'],
    book: ['createdAt', 'updatedAt'],
    agentLog: ['createdAt'],
    agentConfig: ['createdAt', 'updatedAt'],
    subscriber: ['consentAt', 'createdAt', 'updatedAt'],
    analyticsEvent: ['createdAt'],
    issueArticle: [],
  };

  // FK 안전 순서: 부모(독립) 먼저, IssueArticle(자식) 마지막.
  const ORDER = ['dailyIssue', 'article', 'reservableVenue', 'book', 'agentConfig', 'agentLog', 'subscriber', 'analyticsEvent', 'issueArticle'] as const;

  console.log(`[restore] file=${file} mode=${commit ? 'COMMIT' : 'DRY-RUN'}`);
  for (const model of ORDER) {
    const rows = parseDates(d[model] ?? [], DATE_FIELDS[model] ?? []);
    if (!commit) {
      console.log(`[restore] would insert ${model}: ${rows.length}`);
      continue;
    }
    // @ts-expect-error — 동적 델리게이트 접근(모델명=camelCase 키와 일치)
    const res = await prisma[model].createMany({ data: rows, skipDuplicates: true });
    console.log(`[restore] ${model}: +${res.count} (skipDuplicates)`);
  }

  if (!commit) console.log('[restore] DRY-RUN — 아무것도 쓰지 않음. 실제 복구는 --commit 추가.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('[restore] failed', e);
  process.exit(1);
});
