import { CATEGORY_LABEL, type Category } from '@parenting-newsletter/shared';
import { CATEGORY_VISUAL } from '@/src/lib/category-visual';

// 이미지가 없을 때 쓰는 Sailing 브랜드 비주얼 (3순위 폴백).
// 카테고리별 파스텔 그라데이션 + 항해 모티프(물결·좌표 동심원) + 심볼/라벨.
// 순수 SVG/CSS — 외부 에셋·런타임 생성 0, 저작권 0.
export function CategoryVisual({
  category,
  size = 'card',
}: {
  category: Category;
  size?: 'card' | 'hero';
}) {
  const v = CATEGORY_VISUAL[category];
  const big = size === 'hero';

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${v.from} 0%, ${v.to} 100%)` }}
      aria-hidden
    >
      {/* 항해 모티프 — 우상단 좌표 동심원 + 하단 물결. 색조는 카테고리 ink, 은은하게. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 320 200"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <g stroke={v.ink} strokeOpacity="0.16" fill="none" strokeWidth="1.5">
          <circle cx="270" cy="44" r="20" />
          <circle cx="270" cy="44" r="34" />
          <circle cx="270" cy="44" r="48" />
        </g>
        {/* 북극성/좌표점 */}
        <circle cx="270" cy="44" r="3" fill={v.ink} fillOpacity="0.32" />
        {/* 물결 — 항해 */}
        <path
          d="M-10 150 Q 50 132 110 150 T 230 150 T 350 150"
          stroke={v.ink}
          strokeOpacity="0.18"
          strokeWidth="2"
        />
        <path
          d="M-10 170 Q 50 152 110 170 T 230 170 T 350 170"
          stroke={v.ink}
          strokeOpacity="0.12"
          strokeWidth="2"
        />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <span className={big ? 'text-6xl' : 'text-5xl'} style={{ filter: 'saturate(0.9)' }}>
          {v.emoji}
        </span>
        <span
          className={`font-semibold tracking-wide ${big ? 'text-meta' : 'text-small'}`}
          style={{ color: v.ink, opacity: 0.78 }}
        >
          {CATEGORY_LABEL[category]}
        </span>
      </div>
    </div>
  );
}
