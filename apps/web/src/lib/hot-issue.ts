import type { Article, ContentType } from '@parenting-newsletter/shared';

// 핫이슈(그날의 "🔥 핵심 이슈") 선별 — 에디토리얼 신호 기반.
// MVP 핵심 잡이 "캐치업"이라 인기(조회수)가 아니라 중요도로 뽑는다.
// 1순위: contentType 가중(정책·분석 우선) → 2순위: credibilityScore → 3순위: 최신.
// V2: 트래픽이 쌓이면 viewCount를 tie-break/하이브리드로 보강.
const CONTENT_TYPE_WEIGHT: Record<ContentType, number> = {
  Policy: 5,
  Insight: 4,
  Event: 3,
  Market: 2,
  Guide: 1,
};

export function selectHotArticle(articles: Article[]): Article | undefined {
  if (articles.length === 0) return undefined;
  return [...articles].sort((a, b) => {
    const weightDiff = CONTENT_TYPE_WEIGHT[b.contentType] - CONTENT_TYPE_WEIGHT[a.contentType];
    if (weightDiff !== 0) return weightDiff;
    if (b.credibilityScore !== a.credibilityScore) {
      return b.credibilityScore - a.credibilityScore;
    }
    return a.publishedAt < b.publishedAt ? 1 : -1; // 최신 우선
  })[0];
}
