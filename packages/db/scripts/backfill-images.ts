// 기사 원문에서 og:image(없으면 twitter:image)를 추출해 Article.imageUrl 백필.
// 못 찾으면 그대로 둠(null) → 웹 카드가 카테고리 비주얼로 폴백.
// 추출 로직은 src/og-image.ts 공용(파이프라인 발행 시 캡처와 동일 소스).
// 실행: cd packages/db && node --env-file=.env --import tsx scripts/backfill-images.ts [--all]
import { prisma } from '../src/client';
import { fetchOgImage } from '../src/og-image';

async function main() {
  const all = process.argv.includes('--all');
  const articles = await prisma.article.findMany({
    where: all ? {} : { imageUrl: null },
    select: { id: true, url: true },
  });
  console.log(`대상 ${articles.length}건 (${all ? '전체' : 'imageUrl 없는 것만'})`);

  let ok = 0;
  for (const a of articles) {
    const img = await fetchOgImage(a.url);
    if (img) {
      await prisma.article.update({ where: { id: a.id }, data: { imageUrl: img } });
      ok += 1;
      console.log(`  ✓ ${a.id}`);
    }
  }
  console.log(`\n완료: ${ok}/${articles.length}건 이미지 발견·저장. 나머지(${articles.length - ok}건)는 카테고리 비주얼 폴백.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
