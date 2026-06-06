// 도서 컬렉션 도메인 타입 — 기사에서 추출한 추천 도서를 기사 만료와 무관하게 보존하는 에버그린 엔티티.
// ReservableVenue 선례를 따름: Article과 하드 FK 없이 독립 존재 + 느슨 연결(sourceArticleIds).
// Phase 1 = 공개 카탈로그. "내 책장"(개인 찜)은 후속. 일반화(공연·놀이 컬렉션)는 컬렉션 구조 재사용.

// 제휴/도서관 외부 링크 — 편집(추천 이유)과 분리된 레이어. label로 출처 명시(중립·신뢰).
export type BookLink = {
  label: string; // "교보문고" / "예스24" / "동네 도서관" 등 — 명확 표기
  url: string;
  kind: BookLinkKind;
};

export type BookLinkKind = 'library' | 'buy';

export type Book = {
  id: string; // "book-*" slug (ISBN 기반 권장)
  isbn?: string; // ISBN13 — 알라딘·정보나루 enrichment 조회 키
  title: string;
  author: string;
  publisher?: string;
  pubYear?: number;
  ageRange: string; // venue와 동일 포맷 "3-7"
  coverImageUrl?: string; // 알라딘 표지 (enrichment). 없으면 카테고리 비주얼 폴백
  whyRecommended: string; // ★ 우리 큐레이션 — 왜 추천하는지 (세일링 보이스, 친근한 존대)
  themes: string[]; // 테마 태그 (가족 다양성·감정·잠자리·자연 등)
  collection: string; // 컬렉션 묶음명 "2026년 5월 그림책 10선"
  collectionDate: string; // YYYY-MM (정렬·그룹 키)
  links?: BookLink[]; // 도서관(정보나루)·구매(제휴) 링크. 도서관 우선
  sourceArticleIds: string[]; // 출처 기사 역링크 ("이 책을 소개한 기사")
  credibilityScore: number;
};

export const BOOK_LINK_KIND_LABEL: Record<BookLinkKind, string> = {
  library: '도서관에서 빌리기',
  buy: '구매',
};
