import type { Article } from '@parenting-newsletter/shared';

// 관련 기사 선별 — 내부 회유(recirculation) 레버 (STRATEGY §11.1).
// 같은 카테고리를 1차 신호로, 같은 콘텐츠 타입을 2차로 가점 → 최신순.
// 아웃바운드 차단이 아니라 "다음 읽을거리" 제안으로 체류·재방문을 늘림.
export function relatedArticles(current: Article, all: Article[], limit = 4): Article[] {
  const scored = all
    .filter((a) => a.id !== current.id)
    .map((a) => {
      let score = 0;
      if (a.category === current.category) score += 2;
      if (a.contentType === current.contentType) score += 1;
      return { a, score };
    })
    // 카테고리·타입 둘 다 무관한 기사(score 0)는 "관련"이라 부르기 약함 → 제외.
    // 단 후보가 limit 미만이면 아래 폴백이 최신순으로 채움.
    .sort((x, y) => {
      if (y.score !== x.score) return y.score - x.score;
      return new Date(y.a.publishedAt).getTime() - new Date(x.a.publishedAt).getTime();
    });

  const related = scored.filter((s) => s.score > 0).map((s) => s.a);
  if (related.length >= limit) return related.slice(0, limit);

  // 폴백 — 관련 신호가 부족하면 최신 기사로 채움(현재·이미 뽑힌 것 제외).
  const chosen = new Set(related.map((a) => a.id));
  const fillers = all
    .filter((a) => a.id !== current.id && !chosen.has(a.id))
    .sort((x, y) => new Date(y.publishedAt).getTime() - new Date(x.publishedAt).getTime());

  return [...related, ...fillers].slice(0, limit);
}
