// 이미지 캡처 스텝 — 발행 이슈의 기사 원문에서 og:image를 끌어와 Article.imageUrl에 저장.
// 결정론적(LLM 0). 카드 썸네일·상세 히어로의 단일 소스. 못 찾으면 null 유지 → 웹이 CategoryVisual 폴백.
// 파이프라인 soft 스테이지(실패해도 발행 차단 아님) + backfill 스크립트와 추출 로직(fetchOgImage) 공유.
import { prisma, fetchOgImage } from '@parenting-newsletter/db';
import { kstIssueDate } from '@parenting-newsletter/shared';

/** 해당 이슈에서 imageUrl 없는 기사들의 og:image를 채운다. 반환 = {attempted, captured}. */
export async function runImageCaptureForIssue(date?: Date): Promise<{ attempted: number; captured: number }> {
  const issueDate = kstIssueDate(date);
  const targets = await prisma.article.findMany({
    where: { issueDate, imageUrl: null },
    select: { id: true, url: true },
  });

  let captured = 0;
  for (const a of targets) {
    const img = await fetchOgImage(a.url);
    if (img) {
      await prisma.article.update({ where: { id: a.id }, data: { imageUrl: img } });
      captured += 1;
    }
  }
  console.log(`[images] og:image ${captured}/${targets.length}건 캡처 (나머지는 CategoryVisual 폴백)`);
  return { attempted: targets.length, captured };
}
