import type { Category } from '@parenting-newsletter/shared';

// 이미지가 없을 때 쓰는 카테고리 브랜드 비주얼 폴백 (3순위).
// Sailing 결 — 채도 낮은 파스텔 그라데이션 + 카테고리 심볼. 무지개가 아니라 브랜드 블루를
// 기준으로 인접 색조만 부드럽게 변주(절제). 실제 이미지(imageUrl)가 있으면 이건 안 보임.
export const CATEGORY_VISUAL: Record<
  Category,
  { emoji: string; from: string; to: string; ink: string }
> = {
  policy: { emoji: '🏛️', from: '#EEF3FB', to: '#D7E4F7', ink: '#3A5C92' },
  parenting: { emoji: '🌱', from: '#EDF6F0', to: '#D5EBDD', ink: '#3E7256' },
  academy: { emoji: '✏️', from: '#FBF5EA', to: '#F2E4C9', ink: '#8A6D3B' },
  play: { emoji: '🧸', from: '#FDF1EC', to: '#F8D9CD', ink: '#9A5A45' },
  shows: { emoji: '🎭', from: '#F3EFFA', to: '#E2D8F4', ink: '#6A529A' },
  books: { emoji: '📖', from: '#EAF6F5', to: '#CDE9E6', ink: '#3C7A74' },
  market: { emoji: '📈', from: '#FCEFF2', to: '#F5D6DE', ink: '#9A4A5C' },
  others: { emoji: '📌', from: '#F1F3F5', to: '#DDE2E7', ink: '#5A636C' },
};
