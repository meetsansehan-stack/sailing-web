import { runBookExtraction } from './index';

// 사용법: books:build <articleId> [--commit]
//   --commit 없으면 dry-run(추출만 출력, 저장 X). 검수 후 --commit으로 저장.
async function main() {
  const articleId = process.argv[2];
  const commit = process.argv.includes('--commit');
  if (!articleId || articleId.startsWith('--')) {
    console.error('사용법: pnpm books:build <articleId> [--commit]');
    console.error('  --commit 없으면 dry-run(추출만, 저장 안 함). 검수 후 --commit으로 저장.');
    process.exit(1);
  }

  console.log(`\n📚 books:build — 기사 ${articleId} ${commit ? '(저장 모드)' : '(dry-run)'}\n`);
  const r = await runBookExtraction(articleId, { commit });

  console.log(`컬렉션: ${r.collection} (${r.collectionDate})`);
  console.log(`추출된 책: ${r.extracted.length}권\n`);
  r.extracted.forEach((b, i) => {
    const meta = [b.publisher, `만 ${b.ageRange}세`, b.themes.join('·')].filter(Boolean).join(' · ');
    console.log(`${i + 1}. ${b.title} — ${b.author}  [${meta}]`);
    console.log(`   ${b.whyRecommended}\n`);
  });

  if (commit) {
    console.log(`✅ 저장: 신규 ${r.created.length}권${r.skipped.length ? ` · 스킵(중복) ${r.skipped.length}권` : ''}`);
    if (r.created.length) {
      console.log('   다음(표지·링크): cd packages/db && node --env-file=.env --import tsx scripts/enrich-books.ts');
    }
  } else {
    console.log(`ℹ️ dry-run — 저장 안 함. 검수 후 저장:\n   pnpm books:build ${articleId} --commit`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ books:build 실패:', e);
  process.exit(1);
});
