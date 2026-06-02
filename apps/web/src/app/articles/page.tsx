import Link from 'next/link';
import { CATEGORIES, CATEGORY_LABEL, type Category } from '@parenting-newsletter/shared';
import { getRecentArticles } from '@/src/data/articles';
import { ArticleCard } from '@/src/components/ArticleCard';
import { Pagination } from '@/src/components/Pagination';

type SearchParams = { category?: string; page?: string };

const PAGE_SIZE = 24; // 2·3열 그리드에 모두 나눠떨어짐

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // 범위 밖 page는 클램프(잘못된 URL·필터 전환 시 안전).
  const currentPage = Math.min(Math.max(1, Number(searchParams?.page) || 1), totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 페이지 링크에 카테고리 보존.
  const hrefForPage = (page: number) => {
    const params = new URLSearchParams();
    if (filterCategory) params.set('category', filterCategory);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `/articles?${qs}` : '/articles';
  };

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

      <div className="mx-auto max-w-6xl mb-8 flex gap-6 overflow-x-auto border-b border-line [&::-webkit-scrollbar]:hidden">
        <Link
          href="/articles"
          className={`-mb-px shrink-0 border-b-2 pb-3 text-body transition ${
            !filterCategory ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          전체
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/articles?category=${cat}`}
            className={`-mb-px shrink-0 border-b-2 pb-3 text-body transition ${
              filterCategory === cat
                ? 'border-ink font-semibold text-ink'
                : 'border-transparent text-ink-3 hover:text-ink'
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
          <div className="grid gap-x-9 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-11">
            {pageItems.map((article) => (
              <ArticleCard key={article.id} article={article} showSummary={false} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hrefForPage={hrefForPage}
            />
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
