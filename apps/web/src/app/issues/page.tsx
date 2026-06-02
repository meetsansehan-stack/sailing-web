import Link from 'next/link';
import { CATEGORIES, CATEGORY_LABEL, type Category } from '@parenting-newsletter/shared';
import { getAllIssuesWithArticles } from '@/src/data/issues';
import { selectHotArticle } from '@/src/lib/hot-issue';

function countByCategory(articles: { category: Category }[]): Partial<Record<Category, number>> {
  const counts: Partial<Record<Category, number>> = {};
  for (const a of articles) {
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  }
  return counts;
}

export default async function IssuesArchivePage() {
  const issues = await getAllIssuesWithArticles();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="mb-2 text-h1 font-bold text-ink">아카이브</h1>
        <p className="text-body text-ink-2">지난 이슈 모음 (최신순)</p>
      </header>

      <ul className="space-y-4">
        {issues.map((issue) => {
          const counts = countByCategory(issue.articles);
          const hot = selectHotArticle(issue.articles);
          const dateLabel = new Date(issue.date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          });

          return (
            <li
              key={issue.date}
              className="rounded-card border border-grey-200 bg-white p-6 shadow-card transition hover:shadow-card-hover"
            >
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <p className="text-h3 font-bold text-ink">{dateLabel}</p>
                <span className="flex-shrink-0 text-body font-medium text-ink-3">
                  기사 {issue.articles.length}개
                </span>
              </div>

              <div className="mb-5 flex flex-wrap gap-1.5">
                {CATEGORIES.filter((cat) => (counts[cat] ?? 0) > 0).map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 rounded-full bg-grey-100 px-2.5 py-0.5 text-small text-ink-2"
                  >
                    <span className="font-medium text-ink">{CATEGORY_LABEL[cat]}</span>
                    <span className="text-ink-3">{counts[cat]}</span>
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/issues/${issue.date}`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-blue-600 px-4 py-2.5 text-body font-semibold text-white transition hover:bg-blue"
                >
                  기사 {issue.articles.length}개 모두보기
                </Link>
                {hot && (
                  <Link
                    href={`/articles/${encodeURIComponent(hot.id)}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-4 py-2.5 text-body font-semibold text-blue transition hover:bg-blue-50"
                  >
                    🔥 핵심 이슈
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-body font-semibold text-white transition hover:bg-blue"
        >
          ← 오늘의 이슈로
        </Link>
      </div>
    </div>
  );
}
