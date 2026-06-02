// 기사·이슈 도메인 타입 정의 — 웹·모바일·API·에이전트 공용

// 'others' = 7개 분류에 안 맞지만 중요한 이슈를 버리지 않는 안전망 (캐치올).
// 남용 방지: research/curation 프롬프트에서 "정말 분류 불가일 때만" 가드.
export type Category =
  | 'policy'
  | 'parenting'
  | 'academy'
  | 'play'
  | 'shows'
  | 'books'
  | 'market'
  | 'others';
export type ContentType = 'Policy' | 'Event' | 'Market' | 'Insight' | 'Guide';
export type MediaType = 'text' | 'video' | 'podcast' | 'book';

export const CATEGORIES: readonly Category[] = [
  'policy',
  'parenting',
  'academy',
  'play',
  'shows',
  'books',
  'market',
  'others',
] as const;

export const CATEGORY_LABEL: Record<Category, string> = {
  policy: '교육 정책',
  parenting: '양육·발달',
  academy: '학원·EdTech',
  play: '놀이·체험',
  shows: '공연·전시',
  books: '도서그림책',
  market: '시장·트렌드',
  others: '기타',
};

export const CONTENT_TYPES: readonly ContentType[] = [
  'Policy',
  'Event',
  'Market',
  'Insight',
  'Guide',
] as const;

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  Policy: '정책',
  Event: '이벤트',
  Market: '시장',
  Insight: '분석',
  Guide: '가이드',
};

export const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  text: '글',
  video: '영상',
  podcast: '팟캐스트',
  book: '도서',
};

export type Article = {
  id: string;
  title: string;
  summary: string;
  body: string;
  url: string;
  category: Category;
  contentType: ContentType;
  mediaType?: MediaType;    // 기본값 'text', 다른 형식일 때만 명시
  durationMin?: number;     // video/podcast 한정 — 분 단위 길이
  issueDate: string;        // YYYY-MM-DD, 페런트웹 발행일 (Issue 식별자)
  eventStartDate?: string;  // Event 타입 한정 — 이벤트 시작일 (YYYY-MM-DD)
  eventEndDate?: string;    // Event 타입 한정 — 이벤트 종료일 (시작일과 별개, 다일 행사)
  deadline?: string;        // 신청·접수 마감일 (YYYY-MM-DD)
  source: string;
  publishedAt: string;      // 원문 발행일
  credibilityScore: number;
  tags?: string[];
  imageUrl?: string;        // 카드 썸네일 (원문 og:image 등). 없으면 카테고리 비주얼 폴백
  dateCheck?: DateCheck;    // qa v0 날짜 검증 결과 (원문 재호출 대조). 운영자 프리뷰에서 ✅/⚠️ 배지로 표시
};

// 날짜 검증(qa v0) 결과 — 원문에 deadline/event 날짜가 실재하는지 코드 대조.
export type DateVerdict = 'verified' | 'unconfirmed';
export type DateCheck = {
  checkedAt: string;        // ISO
  fetchOk: boolean;         // 원문 fetch 성공 여부
  deadline?: DateVerdict;
  eventStartDate?: DateVerdict;
  eventEndDate?: DateVerdict;
};

export type KeyDateKind = 'event' | 'deadline';

export type KeyDateEntry = {
  date: string;             // YYYY-MM-DD
  kind: KeyDateKind;
  article: Article;
};
