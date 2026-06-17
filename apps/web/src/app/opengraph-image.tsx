import { ImageResponse } from 'next/og';

// 기본 OG 공유 카드 (1200x630) — 카카오·트위터 등에서 공유 시 노출. 기사·이슈 페이지가
// 자체 og:image를 주면 그쪽 우선, 없으면 이 브랜드 카드로 폴백(홈·라다·정적 페이지 전부).
// 한글 태그라인은 Pretendard를 런타임 fetch해 렌더 — CDN 실패 시 라틴 카피로 graceful degrade.

export const alt = '세일링 — 매일 아침, 우리 아이에게 필요한 육아 정보를 한눈에';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 돛단배 마크 (파비콘과 동일 모티프) — satori는 emoji 미지원이라 SVG를 data-uri img로 인라인.
const SAIL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#3182F6"/><path d="M15 4.5 L15 22.5 L5.5 22.5 Z" fill="#fff"/><path d="M17 9 L25.5 22.5 L17 22.5 Z" fill="#C9E2FF"/><path d="M4.5 24 h23 l-2.6 3.8 h-17.8 Z" fill="#fff"/></svg>`;
const SAIL_DATA = `data:image/svg+xml;base64,${Buffer.from(SAIL_SVG).toString('base64')}`;

const PRETENDARD_URL =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf';

async function loadKoreanFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(PRETENDARD_URL);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const font = await loadKoreanFont();
  const hasKo = font !== null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F9FAFB',
          fontFamily: hasKo ? 'Pretendard' : 'sans-serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SAIL_DATA} width={132} height={132} alt="" />
        <div
          style={{
            marginTop: 32,
            fontSize: 104,
            fontWeight: 700,
            color: '#17171C',
            letterSpacing: -3,
          }}
        >
          Sailing
        </div>
        <div style={{ marginTop: 10, width: 84, height: 6, background: '#3182F6', borderRadius: 3 }} />
        <div
          style={{
            marginTop: 30,
            fontSize: 38,
            fontWeight: 700,
            color: '#4E5968',
            textAlign: 'center',
            maxWidth: 860,
          }}
        >
          {hasKo ? '매일 아침, 우리 아이에게 필요한 육아 정보를 한눈에' : 'Daily parenting briefing, curated'}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: 'Pretendard', data: font, weight: 700, style: 'normal' }] : undefined,
    },
  );
}
