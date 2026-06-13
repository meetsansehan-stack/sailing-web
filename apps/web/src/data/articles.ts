import { cache } from 'react';
import { CATEGORIES, isEventExpired } from '@parenting-newsletter/shared';
import type { Article, Category, KeyDateEntry } from '@parenting-newsletter/shared';

// 정적 상수에서 API fetch로 전환. 같은 렌더 내 중복 호출 방지를 위해 cache() 사용.
// 페이지·컴포넌트는 server component 기준. client component에서 호출하면 fetch는 client-side로 발생.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001';

// 최대치를 한 번에 받아 메모리에서 필터링. MVP 규모(수십~수백 건)에 충분.
const ARTICLES_LIMIT = 500;

// preview 토큰이 있으면 API에 그대로 전달 → 미공개(draft) 이슈의 기사까지 노출(운영자 검수용).
// 토큰 없음(공개 경로) = published만. cache()는 인자별로 분리되므로 공개/프리뷰 캐시가 섞이지 않음.
export const getAllArticles = cache(async (preview?: string): Promise<Article[]> => {
  const qs = `limit=${ARTICLES_LIMIT}${preview ? `&preview=${encodeURIComponent(preview)}` : ''}`;
  const res = await fetch(`${API_BASE}/api/articles?${qs}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch articles: ${res.status}`);
  }
  const data = (await res.json()) as { articles: Article[] };
  // Event 노출 만료(종료일+버퍼 지남)는 모든 표시 surface에서 제외 — 단일 지점 필터(SPEC §9).
  // 끝난 행사가 홈·아카이브에 남지 않게. 진행중·미래 행사와 비-Event는 그대로 유지.
  const now = new Date();
  return data.articles.filter((a) => !isEventExpired(a, now));
});

// 상세는 전용 라우트로 직접 조회 — 벌크 리스트(getAllArticles)는 body를 비워 보내므로
// 본문이 필요한 상세 페이지는 반드시 이 경로를 써야 함. 404면 undefined.
export const getArticleById = cache(
  async (id: string, preview?: string): Promise<Article | undefined> => {
    const qs = preview ? `?preview=${encodeURIComponent(preview)}` : '';
    const res = await fetch(`${API_BASE}/api/articles/${encodeURIComponent(id)}${qs}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return undefined;
    if (!res.ok) {
      throw new Error(`Failed to fetch article ${id}: ${res.status}`);
    }
    const data = (await res.json()) as { article: Article };
    return data.article;
  },
);

export async function getArticlesByIssueDate(date: string, preview?: string): Promise<Article[]> {
  const all = await getAllArticles(preview);
  // 같은 이슈 안에서도 발행일(publishedAt) 최신순 — 최신 기사가 앞.
  return all
    .filter((a) => a.issueDate === date)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getRecentArticles(): Promise<Article[]> {
  const all = await getAllArticles();
  // 1차 = 노출일(issueDate) 최신 섹션 우선, 2차 = 발행일(publishedAt) 최신순.
  // → "새로 올라온 소식" 안에서도 최신 기사가 앞으로 온다.
  return [...all].sort((a, b) => {
    if (a.issueDate !== b.issueDate) return a.issueDate < b.issueDate ? 1 : -1;
    return a.publishedAt < b.publishedAt ? 1 : -1;
  });
}

export async function getEventsInRange(startDate: string, endDate: string): Promise<Article[]> {
  const all = await getAllArticles();
  return all
    .filter(
      (a) =>
        a.contentType === 'Event' &&
        a.eventStartDate &&
        a.eventStartDate >= startDate &&
        a.eventStartDate <= endDate,
    )
    .sort((a, b) => (a.eventStartDate! < b.eventStartDate! ? -1 : 1));
}

export async function getKeyDatesInRange(
  startDate: string,
  endDate: string,
): Promise<KeyDateEntry[]> {
  const all = await getAllArticles();
  const entries: KeyDateEntry[] = [];
  for (const a of all) {
    if (a.eventStartDate && a.eventStartDate >= startDate && a.eventStartDate <= endDate) {
      entries.push({ date: a.eventStartDate, kind: 'event', article: a });
    }
    if (a.deadline && a.deadline >= startDate && a.deadline <= endDate) {
      entries.push({ date: a.deadline, kind: 'deadline', article: a });
    }
  }
  return entries.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    // 같은 날짜면 마감을 먼저 (시급성)
    if (a.kind !== b.kind) return a.kind === 'deadline' ? -1 : 1;
    return 0;
  });
}

export async function getArticlesByCategory(): Promise<Record<Category, Article[]>> {
  const all = await getAllArticles();
  // 카테고리 목록은 shared CATEGORIES 단일 소스에서 파생 (추가·삭제 시 자동 동기).
  const empty = Object.fromEntries(CATEGORIES.map((c) => [c, [] as Article[]])) as unknown as Record<
    Category,
    Article[]
  >;
  return all.reduce((acc, a) => {
    acc[a.category].push(a);
    return acc;
  }, empty);
}
