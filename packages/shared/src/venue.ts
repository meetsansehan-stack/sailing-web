// 예약 가능 venue 도메인 타입 정의

export type VenueType = 'museum' | 'show' | 'library' | 'indoor-play' | 'program';
export type Pricing = 'free' | 'paid' | 'mixed';
export type VenueOperator = 'national' | 'metro' | 'district';

// 연령 그룹: 페런트웹 타겟(0~8세)에 맞춰 3구간
export type AgeGroup = '0-2' | '3-5' | '6-8';

export const VENUE_TYPES: readonly VenueType[] = [
  'museum',
  'show',
  'library',
  'indoor-play',
  'program',
] as const;

export const VENUE_TYPE_LABEL: Record<VenueType, string> = {
  museum: '박물관·미술관',
  show: '공연·전시',
  library: '도서관',
  'indoor-play': '실내놀이',
  program: '체험 프로그램',
};

export const PRICING_LABEL: Record<Pricing, string> = {
  free: '무료',
  paid: '유료',
  mixed: '일부 유료',
};

export const OPERATOR_LABEL: Record<VenueOperator, string> = {
  national: '국가·공공기관',
  metro: '광역시·도',
  district: '자치구',
};

export const AGE_GROUPS: readonly AgeGroup[] = ['0-2', '3-5', '6-8'] as const;

export const AGE_GROUP_LABEL: Record<AgeGroup, string> = {
  '0-2': '영아 (0~2세)',
  '3-5': '유아 (3~5세)',
  '6-8': '저학년 (6~8세)',
};

/**
 * 표시용 지역 칩 — 서울특별시 + 6대 광역시 + 세종특별자치시 + 9개 도/특별자치도 (17개 시·도).
 * venue 데이터 유무와 무관하게 고정 노출. venue.region은 이 값들 중 하나로 시작해야 매칭.
 */
export const REGIONS = [
  // 서울
  '서울',
  // 6대 광역시
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  // 특별자치시
  '세종',
  // 도·특별자치도
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;

export type Region = (typeof REGIONS)[number];

export const REGION_GROUPS = [
  { label: '수도권', regions: ['서울', '경기', '인천'] },
  { label: '부울경', regions: ['부산', '울산', '경남'] },
  { label: '대구경북', regions: ['대구', '경북'] },
  { label: '충청·세종', regions: ['충북', '충남', '대전', '세종'] },
  { label: '전라·광주', regions: ['전북', '전남', '광주'] },
  { label: '강원·제주', regions: ['강원', '제주'] },
] as const;

export type RegionGroupLabel = (typeof REGION_GROUPS)[number]['label'];

export type ReservableVenue = {
  id: string;
  name: string;
  type: VenueType;
  ageRange: string;          // 권장 연령. "0-8" / "3-12" 형식 — 전시·프로그램이 기획된 타겟 연령
  entryMinAge?: number;      // 실 입장 가능 최소 연령. 없으면 ageRange의 하한을 그대로 사용 (= strict)
  region: string;            // "서울 용산구" / "광주 동구" — 첫 토큰이 REGIONS 중 하나여야 매칭
  reservationUrl: string;    // 공식 예약 진입점
  reservationChannel: string;// 운영주체명
  operator: VenueOperator;
  pricing: Pricing;
  schedule?: string;         // "화~일 10:00-17:00 / 월 휴관"
  description: string;       // 80~120자, 카드뉴스 톤
  credibilityScore: number;
  tags?: string[];
};

const AGE_GROUP_RANGE: Record<AgeGroup, [number, number]> = {
  '0-2': [0, 2],
  '3-5': [3, 5],
  '6-8': [6, 8],
};

function parseAgeRange(str: string): [number, number] {
  const [min, max] = str.split('-').map(Number);
  return [min, max];
}

/**
 * 시설이 사용자가 고른 연령 그룹에 매칭되는지 판단.
 * - entryMinAge === 0 → 자유입장 시설, 모든 연령 필터 통과
 * - 그 외 → 권장 연령 범위와 사용자 그룹 범위가 겹치는지 검사
 */
export function ageGroupMatchesVenue(venue: ReservableVenue, group: AgeGroup): boolean {
  if (venue.entryMinAge === 0) return true;
  const [recommendedMin, recommendedMax] = parseAgeRange(venue.ageRange);
  const [gMin, gMax] = AGE_GROUP_RANGE[group];
  return !(recommendedMax < gMin || recommendedMin > gMax);
}
