// 공공 여름 프로그램·시설 데이터셋 (구조 + 검증 예시 3건)
//
// ⚠️ 이 파일은 "라이브 소스"가 아니다. 현재 사용처 0 (파이프라인 미연결, 휴면).
//    화면에 보이는 라이브 프로토타입 = apps/web/src/app/radar/data.ts 의 SUMMER.
//    여기엔 화면에 없는 "사실(facts)"이 더 풍부함 — 검증된 날짜·출처URL·지역·수요검증 메모·워크리스트.
//    ⛔ 양쪽을 손으로 동시에 고치지 말 것(조용히 어긋남). 여름 화면 스펙이 확정되면
//       이 seed를 그 화면에서 재생성(단방향)해 파이프라인 입력으로 승격한다 = 그때가 "콘크리트" 시점.
//
// 목적(승격 후): 수요 발굴 결과를 *기존 Article 스키마에 그대로 녹이는* 데이터 레이어.
//   별도 메뉴·특집 X — category + contentType(Event/Guide) 태깅으로 오늘의 이슈·카테고리
//   필터·미리 준비 배너에 자연 편입. 여기 항목이 큐레이션/집필 파이프라인의 입력이 됨.
//
// 출처 = CLAUDE.md 화이트리스트(국공립·지자체·도서관·박물관·과학관)만.
// dateConfirmed=false 면 일정 미확인(집필 전 WebFetch 재검증 필수, 추정 발행 금지).

import type { Category } from '@parenting-newsletter/shared';

export type PublicProgramSeed = {
  title: string;
  category: Category;                       // 기존 8 카테고리에 매핑(별도 메뉴 X)
  contentType: 'Event' | 'Guide' | 'Insight';
  source: string;                           // 운영 기관(화이트리스트)
  sourceUrl: string;                        // 공식 URL (검증됨)
  region: string;                           // 수도권 우선 — 지역 필터/지도용
  eventStartDate?: string;                  // YYYY-MM-DD (검증된 경우만)
  eventEndDate?: string;
  dateConfirmed: boolean;                   // false = 집필 전 일정 재검증 필요
  free?: boolean;
  summary: string;
  note?: string;
};

// ── 검증 예시 3건 (2026-06-08 WebFetch/공식 확인) ──────────────────────────
export const PUBLIC_SUMMER_SEED: PublicProgramSeed[] = [
  {
    title: '한강 물놀이장 개장 (잠실·광나루·양화·난지)',
    category: 'play',
    contentType: 'Event',
    source: '서울시 미래한강본부',
    sourceUrl: 'https://hangang.seoul.go.kr/www/contents/774.do?mid=505',
    region: '서울',
    eventStartDate: '2026-06-19',
    eventEndDate: '2026-08-30',
    dateConfirmed: true,
    free: true, // 6세 이하 무료(그 외 어린이 1,000원)
    summary: '서울 4개 한강공원 물놀이장 여름 개장. 6세 이하 무료, 얕은 수심으로 영유아 적합.',
    note: '수요검증: 물놀이터 skew 1.32·여름집중 91%. 상업 워터파크와 달리 공공·저렴 = Sailing 적합.',
  },
  {
    title: '국립과천과학관 여름방학 특별교육',
    category: 'play',
    contentType: 'Event',
    source: '국립과천과학관',
    sourceUrl: 'https://www.sciencecenter.go.kr/scipia/',
    region: '경기',
    dateConfirmed: false, // 여름방학 중 운영 확인, 정확 회차·일정은 집필 전 재검증
    summary: '유아·초등 대상 여름방학 4차시 집중 과학 특별교육과정. 공동기획 순회 체험전 별도(9월).',
    note: '수요검증: 국립과천과학관 월 3.8만·경쟁 낮음(SEO 기회)·8월 피크.',
  },
  {
    title: '국립어린이청소년도서관 여름 독서·체험 프로그램',
    category: 'books',
    contentType: 'Guide',
    source: '국립어린이청소년도서관',
    sourceUrl: 'https://nlcy.go.kr/NLCY/contents/C20100000000.do',
    region: '서울',
    dateConfirmed: false, // 여름 회차 일정은 시즌 임박 공지 — 신청 선행 안내용
    summary: '어린이 대상 도서관 독서·체험 프로그램 신청 안내. 여름방학 회차 공지 시 D-day 알림 대상.',
    note: '수요검증: 도서관 여름방학 skew 1.58(여름집중 100%)·어린이도서관 7월 피크.',
  },
  {
    title: '서울물재생체험관 야외 어린이 물놀이터 (강서)',
    category: 'play',
    contentType: 'Event',
    source: '서울시(서울물재생체험관)',
    sourceUrl: 'https://mediahub.seoul.go.kr/archives/2014993',
    region: '서울',
    dateConfirmed: false, // 2025년 7/1~8/31·3회차 기준, 2026 일정 공지 시 갱신
    free: true,
    summary: '3~10세 대상 무료 야외 물놀이터(예약 필수). 정수처리수 수질관리로 영유아 안심.',
    note: '공식 서울시 mediahub 출처. 2026 일정 미발표(전년 유사) → 집필 전 재확인.',
  },
];

// ── 워크리스트: 수도권 공공 항목 (개별 공식 URL·일정 집필 시 검증) ─────────
// 추정 URL을 데이터에 넣지 않기 위해 분리. research/큐레이션이 각 시·구 공식 페이지 확인 후 승격.
export const PUBLIC_SUMMER_WORKLIST: { item: string; category: Category; org: string; region: string }[] = [
  { item: '서서울호수공원 어린이 물놀이장', category: 'play', org: '양천구', region: '서울' },
  { item: '안양천 오금교 하부 물놀이장', category: 'play', org: '구로구', region: '서울' },
  { item: '서대문구 물놀이터(5곳)', category: 'play', org: '서대문구', region: '서울' },
  { item: '서울숲 바닥분수 / 난지한강공원 거울분수', category: 'play', org: '서울시', region: '서울' },
  { item: '성남시 공원 물놀이장(약 24곳)', category: 'play', org: '성남시', region: '경기' },
  { item: '용인시 바닥분수(미르·물방울어린이공원 등)', category: 'play', org: '용인시', region: '경기' },
  { item: '국립중앙박물관 어린이박물관 여름 프로그램', category: 'play', org: '국립중앙박물관', region: '서울' },
  { item: '시·구 문화재단 여름 어린이 공연·인형극', category: 'shows', org: '시·구 문화재단', region: '수도권' },
];

// 지역(수도권) 필터 — "수도권 무료 물놀이장 지도" 등 지역 큐레이션 조회용
export function byRegion(region: string): PublicProgramSeed[] {
  return PUBLIC_SUMMER_SEED.filter((s) => s.region === region);
}

// 일정 미확인 — 집필 전 재검증 큐
export function needsDateVerify(): PublicProgramSeed[] {
  return PUBLIC_SUMMER_SEED.filter((s) => !s.dateConfirmed);
}
