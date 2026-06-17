import type { MetadataRoute } from 'next';
import { getAllArticles } from '@/src/data/articles';
import { getAllIssues } from '@/src/data/issues';
import { TOPICS } from '@/src/app/radar/data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// 동적 sitemap. 정적 라우트 + 공개 radar 주제 + 발행 이슈 + 발행 기사.
// 데이터 fetch 실패해도(빌드 시 API 미가동 등) 정적 라우트는 항상 포함되도록 폴백.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/issues`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/radar`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/collections`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/reservations`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/letter`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const radarEntries: MetadataRoute.Sitemap = TOPICS.filter((t) => t.status === 'live').map((t) => ({
    url: `${SITE_URL}${t.href}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const [articles, issues] = await Promise.all([
    getAllArticles().catch(() => []),
    getAllIssues().catch(() => []),
  ]);

  const issueEntries: MetadataRoute.Sitemap = issues.map((i) => ({
    url: `${SITE_URL}/issues/${i.date}`,
    lastModified: new Date(`${i.date}T00:00:00Z`),
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/articles/${encodeURIComponent(a.id)}`,
    lastModified: new Date(`${a.issueDate}T00:00:00Z`),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticEntries, ...radarEntries, ...issueEntries, ...articleEntries];
}
