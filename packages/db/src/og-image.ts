// 원문 페이지에서 og:image(없으면 twitter:image)를 추출. 결정론적·LLM 0.
// 카드 썸네일·상세 히어로의 단일 이미지 소스(원문 og). 못 찾으면 null → 웹이 CategoryVisual 폴백.
// 파이프라인(발행 시 캡처)과 backfill 스크립트가 공유.

const OG_PATTERNS = [
  /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
];

function extractImage(html: string): string | null {
  for (const re of OG_PATTERNS) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** 원문 URL을 받아 og:image 절대 URL을 반환. 실패·부재 시 null(견고 — 절대 throw 안 함). */
export async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ParentWebBot/0.1)' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    let img = extractImage(html);
    if (!img) return null;
    if (img.startsWith('//')) img = `https:${img}`;
    else if (img.startsWith('/')) img = new URL(pageUrl).origin + img;
    return img.startsWith('http') ? img : null;
  } catch {
    return null;
  }
}
