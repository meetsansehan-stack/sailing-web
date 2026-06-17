'use client';

import { REGIONS } from '@parenting-newsletter/shared';
import { KOREA_VIEWBOX, KOREA_PROVINCES } from '@/src/data/korea-provinces';

// 실제 한국 시·도 SVG 지도. (출처: svg-maps, MIT)
// 영문 province명 → 한글 시·도(REGIONS) 매핑. 17개 시·도 전부 선택 가능.
const NAME_TO_REGION: Record<string, string> = {
  Busan: '부산',
  Daegu: '대구',
  Daejeon: '대전',
  Gangwon: '강원',
  Gwangju: '광주',
  Gyeonggi: '경기',
  Incheon: '인천',
  Jeju: '제주',
  'North Chungcheong': '충북',
  'North Gyeongsang': '경북',
  'North Jeolla': '전북',
  Sejong: '세종',
  Seoul: '서울',
  'South Chungcheong': '충남',
  'South Gyeongsang': '경남',
  'South Jeolla': '전남',
  Ulsan: '울산',
};
const SELECTABLE = new Set<string>(REGIONS);

export function RegionMap({
  selected,
  onSelect,
  activeRegions,
}: {
  selected: string | null;
  onSelect: (r: string | null) => void;
  activeRegions: Set<string>;
}) {
  return (
    <svg
      viewBox={KOREA_VIEWBOX}
      className="h-auto w-full"
      role="img"
      aria-label="지역 선택 지도"
    >
      {KOREA_PROVINCES.map((p) => {
        const region = NAME_TO_REGION[p.name];
        const selectable = !!region && SELECTABLE.has(region);
        const active = selectable && activeRegions.has(region);
        const isSel = !!region && selected === region;

        // 토큰 색값 정렬 (tailwind.config.ts) — SVG 속성이라 hex 직접 사용
        const fill = isSel ? '#3182F6' /* blue */ : active ? '#C9E2FF' /* blue-100 */ : '#F2F4F6'; /* grey-100 */
        const stroke = isSel ? '#1B64DA' /* blue-600 */ : active ? '#90C2FF' /* blue-300 */ : '#E5E8EB'; /* grey-200 */

        return (
          <path
            key={p.name}
            d={p.path}
            fill={fill}
            stroke={stroke}
            strokeWidth={1}
            className={active ? 'cursor-pointer transition hover:opacity-80' : ''}
            onClick={active ? () => onSelect(isSel ? null : region) : undefined}
          >
            <title>{region ?? p.name}</title>
          </path>
        );
      })}
    </svg>
  );
}
