import type { Category } from '@parenting-newsletter/shared';

// 카드 이미지가 없을 때 쓰는 카테고리 비주얼 폴백 (색 + 이모지).
// Toss Feed 모노크롬 결 — 배경은 중성 grey로 통일, 카테고리 구분은 블루 라벨+이모지가 담당.
// (멀티컬러 카테고리 코딩이 필요하면 여기서 카테고리별 tint로 되돌릴 수 있음.)
export const CATEGORY_VISUAL: Record<Category, { emoji: string; bg: string }> = {
  policy: { emoji: '🏛️', bg: 'bg-grey-100' },
  parenting: { emoji: '🌱', bg: 'bg-grey-100' },
  academy: { emoji: '✏️', bg: 'bg-grey-100' },
  play: { emoji: '🧸', bg: 'bg-grey-100' },
  shows: { emoji: '🎭', bg: 'bg-grey-100' },
  books: { emoji: '📖', bg: 'bg-grey-100' },
  market: { emoji: '📈', bg: 'bg-grey-100' },
  others: { emoji: '📌', bg: 'bg-grey-100' },
};
