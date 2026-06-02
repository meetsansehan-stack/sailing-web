import Link from 'next/link';
import { CATEGORIES, CATEGORY_LABEL, type Category } from '@parenting-newsletter/shared';
import { getRecentArticles } from '@/src/data/articles';
import { ArticleCard } from '@/src/components/ArticleCard';

type SearchParams = { category?: string };

export default async function ArticlesIndexPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const allRecent = await getRecentArticles();
  const filterCategory = searchParams?.category as Category | undefined;

  const filtered = filterCategory
    ? allRecent.filter((a) => a.category === filterCategory)
    : allRecent;

  const headerTitle = filterCategory
    ? `${CATEGORY_LABEL[filterCategory]} 기사`
    : '모든 기사';

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-6xl pt-6 pb-10">
        <p className="text-small font-medium text-blue-600 mb-2 tracking-wider">ARTICLES</p>
        <h1 className="text-h1 font-bold text-ink mb-3">{headerTitle}</h1>
        <p className="text-body text-ink-2 leading-7">
          기사 단위 시간순 · 총 {filtered.length}개
        </p>
      </header>

      <div className="mx-auto max-w-6xl mb-8 flex flex-wrap items-center gap-2 border-b border-grey-200 pb-4">
        <Link
          href="/articles"
          className={`px-3 py-1.5 rounded-full text-body font-medium transition ${
            !filterCategory ? 'bg-ink text-white' : 'bg-grey-100 text-ink-2 hover:bg-grey-200'
          }`}
        >
          전체
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/articles?category=${cat}`}
            className={`px-3 py-1.5 rounded-full text-body font-medium transition ${
              filterCategory === cat
                ? 'bg-ink text-white'
                : 'bg-grey-100 text-ink-2 hover:bg-grey-200'
            }`}
          >
            {CATEGORY_LABEL[cat]}
          </Link>
        ))}
      </div>

      <section className="mx-auto max-w-6xl">
        {filtered.length === 0 ? (
          <div className="rounded-card border border-dashed border-grey-300 bg-white p-8 text-center text-ink-3">
            해당 카테고리 기사가 없습니다.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>

      <div className="mx-auto max-w-6xl mt-12 flex flex-col gap-3 sm:flex-row justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-grey-300 bg-white px-5 py-2.5 text-body font-semibold text-ink-2 hover:bg-grey-50 transition"
        >
          ← 홈으로
        </Link>
        <Link
          href="/issues"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-grey-300 bg-white px-5 py-2.5 text-body font-semibold text-ink-2 hover:bg-grey-50 transition"
        >
          이슈 아카이브 →
        </Link>
      </div>
    </div>
  );
}
