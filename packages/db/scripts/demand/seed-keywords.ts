// 수요 발굴(Demand Mining) — seed 키워드 세트 (Step 0 산출물)
//
// 용도: Step 2 진단 스크립트가 이 배열을 그대로 먹어 네이버 API를 호출함.
//   - 검색광고 키워드도구(/keywordstool): hintKeywords = keyword → 연관키워드 + 절대 월검색량
//   - 데이터랩 검색어 트렌드: keyword → 연령·성별·시계열(시즌성) 검증
// 설계: 부모가 *실제 입력하는* 검색어로 작성(우리 내부 라벨 아님). 카테고리는 packages/shared 단일 소스.
// hypothesisMonths/painkiller = 데이터 검증 전 *가설*(docs/DEMAND_MINING.md 시즌 캘린더와 1:1).
//   진단(Step 2)에서 데이터랩 시계열로 맞/틀 판정 → 캘린더 확정판으로 갱신.

import type { Category } from '@parenting-newsletter/shared';

export type DemandSeed = {
  category: Category;
  keyword: string; // 키워드도구 hintKeywords / 데이터랩 keyword 로 그대로 사용
  hypothesisMonths?: readonly string[]; // 스파이크 예상 월 ('01'~'12'). 상시면 생략.
  painkiller?: boolean; // 신청·마감·예매 등 *시점성*이 강한 진통제 윈도우
  note?: string;
};

// 가설 시즌 윈도우 (월 코드는 docs/DEMAND_MINING.md 캘린더와 동일)
export const SEASON = {
  입학준비: ['12', '01', '02'],
  늘봄돌봄신청: ['01', '02'], // 2026-06 검증: 신청 정보 검색은 마감(2월)보다 1월 선행 피크
  새학기적응: ['03'],
  어린이날: ['04', '05'],
  여름방학캠프: ['06', '07', '08'],
  겨울공연예매: ['11', '12'],
  크리스마스: ['12'],
} as const;

export const DEMAND_SEEDS: DemandSeed[] = [
  // ── policy (교육 정책) — 진통제 밀집 구역. 2026-06-08 데이터 검증 반영 ──────
  { category: 'policy', keyword: '늘봄', hypothesisMonths: SEASON.늘봄돌봄신청, painkiller: true, note: '실수요 앵커(월 ~1.3만). 부모는 공식명 "늘봄학교"보다 "늘봄"을 더 씀' },
  { category: 'policy', keyword: '아이돌봄서비스', painkiller: true, note: '돌봄 절대 최대(월 ~7.6만, 2026-06 검증). 학기초 상승' },
  { category: 'policy', keyword: '늘봄학교', hypothesisMonths: SEASON.늘봄돌봄신청, painkiller: true, note: '공식 정책명이라 글자그대로 검색은 미미(월 ~10) — 추적용 유지' },
  { category: 'policy', keyword: '늘봄학교 신청', hypothesisMonths: SEASON.늘봄돌봄신청, painkiller: true, note: '신청 정보 검색 = 1월 선행 피크(마감 2월보다 앞섬)' },
  { category: 'policy', keyword: '초등 돌봄교실', hypothesisMonths: SEASON.늘봄돌봄신청, painkiller: true },
  { category: 'policy', keyword: '처음학교로', hypothesisMonths: ['09', '10', '11'], painkiller: true, note: '유치원 입학 신청 시스템 = 입학 최대 진입 키워드(9월↑·11월 피크, 2026-06 검증). 일반어 "입학"은 대학에 납치돼 무의미' },
  { category: 'policy', keyword: '초등학교 입학준비', hypothesisMonths: SEASON.입학준비, painkiller: true },
  { category: 'policy', keyword: '취학통지서', hypothesisMonths: ['12', '01'], painkiller: true, note: '12월 강한 시즌 피크 검증(강도 7.9)' },
  { category: 'policy', keyword: '예비소집', hypothesisMonths: ['11', '01'], painkiller: true, note: '검색은 11월 선행 피크(실제 소집 1월) — 노이즈 가능성 재확인' },
  { category: 'policy', keyword: '누리과정' },
  { category: 'policy', keyword: '유아학비 지원', hypothesisMonths: ['02'], painkiller: true, note: '2월 신청 피크 검증' },
  { category: 'policy', keyword: '어린이집 입소대기', hypothesisMonths: ['11', '12', '01'], painkiller: true },

  // ── parenting (양육·발달) — 상시 수요 + 새학기 정서 스파이크 ──────────────
  { category: 'parenting', keyword: '분리불안', hypothesisMonths: SEASON.새학기적응, note: '3월 등원 시작 스파이크 가설' },
  { category: 'parenting', keyword: '떼쓰기' },
  { category: 'parenting', keyword: '훈육법' },
  { category: 'parenting', keyword: '언어발달' },
  { category: 'parenting', keyword: '대소변 가리기' },
  { category: 'parenting', keyword: '수면교육' },
  { category: 'parenting', keyword: '영유아검진', note: '월령 도래 상시 — 절대량 큰 백본 키워드 가설' },
  { category: 'parenting', keyword: '발달검사' },
  { category: 'parenting', keyword: '형제 다툼' },
  { category: 'parenting', keyword: '아이 미디어 노출' },

  // ── academy (학원·EdTech) — 학기초·방학 등록 시점성 ──────────────────────
  { category: 'academy', keyword: '영어유치원', hypothesisMonths: ['11', '12', '01'], painkiller: true, note: '입학 전형/등록 시즌 가설' },
  { category: 'academy', keyword: '한글 떼기', hypothesisMonths: SEASON.입학준비 },
  { category: 'academy', keyword: '사고력 수학' },
  { category: 'academy', keyword: '초등 영어' },
  { category: 'academy', keyword: '학습지 추천' },
  { category: 'academy', keyword: '사교육비', note: '편집은 통계·분포로만(톤 가드레일)' },
  { category: 'academy', keyword: '코딩 교육' },

  // ── play (놀이·체험) — 주말·방학·날씨 시점성 ────────────────────────────
  { category: 'play', keyword: '키즈카페' },
  { category: 'play', keyword: '아이와 가볼만한곳' },
  { category: 'play', keyword: '실내놀이터', hypothesisMonths: ['12', '01', '02', '07', '08'], note: '혹한·혹서 실내 수요 가설' },
  { category: 'play', keyword: '유아 체험', hypothesisMonths: SEASON.어린이날 },
  { category: 'play', keyword: '키즈 풀빌라', hypothesisMonths: SEASON.여름방학캠프 },
  { category: 'play', keyword: '아이와 캠핑' },

  // ── shows (공연·전시) — 예매 선행 시점성(진통제) ───────────────────────
  { category: 'shows', keyword: '어린이 뮤지컬', hypothesisMonths: SEASON.어린이날, painkiller: true, note: '예매는 행사 4주 전 선행' },
  { category: 'shows', keyword: '어린이 공연', hypothesisMonths: SEASON.어린이날, painkiller: true },
  { category: 'shows', keyword: '호두까기인형', hypothesisMonths: SEASON.겨울공연예매, painkiller: true },
  { category: 'shows', keyword: '키즈 전시' },
  { category: 'shows', keyword: '어린이 연극' },

  // ── books (도서그림책) — 월령·전집 구매·연말 시점성 ─────────────────────
  { category: 'books', keyword: '그림책 추천' },
  { category: 'books', keyword: '3세 그림책', note: '월령별 시리즈로 확장 가설(0~7세)' },
  { category: 'books', keyword: '책육아' },
  { category: 'books', keyword: '전집 추천', hypothesisMonths: ['12', '01'], note: '연말·신학기 구매 가설' },
  { category: 'books', keyword: '베스트셀러 그림책' },
  { category: 'books', keyword: '도서관 프로그램 신청', painkiller: true, note: '10월 강한 시즌 피크 검증(강도 9.4)' },
  { category: 'books', keyword: '어린이도서관', note: 'books 트래픽 앵커. 일반 "도서관"(월 ~10만)은 성인 포함이라 육아 한정 변형으로 잡음' },

  // ── market (시장·트렌드) — 출산·성장 단계 구매 시점성 ──────────────────
  { category: 'market', keyword: '유모차 추천' },
  { category: 'market', keyword: '카시트 추천' },
  { category: 'market', keyword: '육아템' },
  { category: 'market', keyword: '아기 장난감' },
  { category: 'market', keyword: '돌잔치 준비', painkiller: true },

  // others(안전망)는 seed 미지정 — 진단에서 미분류 수요로 역추출
];

// 시즌별 역인덱스 — 캘린더 배너/발행 우선순위 배선(Step 3)에서 "이 달의 진통제 키워드" 조회용.
export function seedsByMonth(month: string): DemandSeed[] {
  return DEMAND_SEEDS.filter((s) => s.hypothesisMonths?.includes(month));
}

export function painkillerSeeds(): DemandSeed[] {
  return DEMAND_SEEDS.filter((s) => s.painkiller);
}
