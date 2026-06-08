// 공공 여름 프로그램·시설 데이터셋 (구조 + 검증 예시 3건)
//
// 목적: 수요 발굴(공공 포커스) 결과를 *기존 Article 스키마에 그대로 녹이는* 데이터 레이어.
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
];

// 지역(수도권) 필터 — "수도권 무료 물놀이장 지도" 등 지역 큐레이션 조회용
export function byRegion(region: string): PublicProgramSeed[] {
  return PUBLIC_SUMMER_SEED.filter((s) => s.region === region);
}

// 일정 미확인 — 집필 전 재검증 큐
export function needsDateVerify(): PublicProgramSeed[] {
  return PUBLIC_SUMMER_SEED.filter((s) => !s.dateConfirmed);
}
