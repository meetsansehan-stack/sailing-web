import { cache } from 'react';
import type { Article, Issue } from '@parenting-newsletter/shared';
import { getArticlesByIssueDate } from './articles';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001';

// API 응답: { date, title?, summary?, theme? } — Issue 타입(title/summary required)과 약간 다름.
// summary가 null일 수 있으나 디스플레이 시 빈 문자열로 폴백.
type IssueApiRow = {
  date: string;
  title: string | null;
  summary: string | null;
  theme?: string | null;
};

const ISSUES_LIMIT = 200;

// preview 토큰 전달 시 draft 이슈까지 노출(운영자 검수). 토큰 없음 = published만.
export const getAllIssues = cache(async (preview?: string): Promise<Issue[]> => {
  const qs = `limit=${ISSUES_LIMIT}${preview ? `&preview=${encodeURIComponent(preview)}` : ''}`;
  const res = await fetch(`${API_BASE}/api/issues?${qs}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch issues: ${res.status}`);
  }
  const data = (await res.json()) as { issues: IssueApiRow[] };
  return data.issues.map((i) => ({
    date: i.date,
    title: i.title ?? '',
    summary: i.summary ?? '',
  }));
});

export async function getIssueByDate(date: string, preview?: string): Promise<Issue | undefined> {
  const all = await getAllIssues(preview);
  return all.find((i) => i.date === date);
}

export async function getLatestIssue(): Promise<Issue | undefined> {
  const all = await getAllIssues();
  return all[0];
}

export async function getIssueArticles(date: string, preview?: string): Promise<Article[]> {
  return getArticlesByIssueDate(date, preview);
}

export async function getAllIssuesWithArticles(): Promise<Array<Issue & { articles: Article[] }>> {
  const all = await getAllIssues();
  // 각 이슈에 대해 기사 매칭 — getArticlesByIssueDate는 cache()된 전체 articles를 공유
  return Promise.all(
    all.map(async (issue) => ({
      ...issue,
      articles: await getArticlesByIssueDate(issue.date),
    })),
  );
}
