import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Book, BookLink } from '@parenting-newsletter/shared';
import { getBookById, getAllBooks } from '@/src/data/books';
import { getArticleById } from '@/src/data/articles';

export const dynamic = 'force-dynamic';

function fmtAge(range: string): string {
  return `만 ${range.replace('-', '~')}세`;
}

function BookCoverLarge({ book }: { book: Book }) {
  if (book.coverImageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={book.coverImageUrl}
        alt=""
        className="w-full rounded-card object-cover shadow-card"
      />
    );
  }
  return (
    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-card border border-line bg-grey-50 p-6 text-center">
      <span className="text-5xl opacity-60" aria-hidden>
        📖
      </span>
      <span className="line-clamp-4 text-body font-medium text-ink-3">{book.title}</span>
    </div>
  );
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const book = await getBookById(id);
  if (!book) notFound();

  // 출처 기사는 발행 이슈가 만료/삭제돼도 보존되는 에버그린 참조다(SPEC §12). 발행 게이트가 적용된
  // 목록(getAllArticles) 대신 id로 직접 조회 — API 상세 라우트가 책 출처 기사를 게이트에서 예외 처리한다.
  const [allBooks, sourceArticlesRaw] = await Promise.all([
    getAllBooks(),
    Promise.all(book.sourceArticleIds.map((aid) => getArticleById(aid).catch(() => undefined))),
  ]);

  const links = (book.links ?? []) as BookLink[];
  const library = links.find((l) => l.kind === 'library');
  const buys = links.filter((l) => l.kind === 'buy');

  const sourceArticles = sourceArticlesRaw.filter(
    (a): a is NonNullable<typeof a> => Boolean(a),
  );

  const related = allBooks
    .filter((b) => b.collection === book.collection && b.id !== book.id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-article">
      <Link href="/collections" className="text-meta text-ink-3 transition hover:text-ink">
        ← 세일링 책장
      </Link>

      {/* 헤더 — 표지(좌) + 메타·CTA(우) */}
      <div className="mt-6 grid gap-8 sm:grid-cols-[200px_1fr]">
        <div className="w-full max-w-[200px]">
          <BookCoverLarge book={book} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {book.themes.map((t) => (
              <span key={t} className="rounded-btn bg-blue-50 px-2.5 py-1 text-meta font-medium text-blue">
                {t}
              </span>
            ))}
          </div>
          <h1 className="mt-3 text-h1 text-ink">{book.title}</h1>
          <p className="mt-2 text-body text-ink-2">
            {[book.author, book.publisher, book.pubYear ? `${book.pubYear}년` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="mt-1 text-meta text-ink-3">
            {fmtAge(book.ageRange)}
            {book.isbn ? ` · ISBN ${book.isbn}` : ''}
          </p>

          {/* CTA — 도서관 우선(공익·무료) → 구매(제휴) */}
          <div className="mt-5 flex flex-col gap-2.5">
            {library ? (
              <a
                href={library.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-btn bg-green px-5 py-3 text-card-title font-semibold text-white transition hover:opacity-90"
              >
                📚 {library.label}
              </a>
            ) : (
              <span className="inline-flex items-center justify-center rounded-btn bg-grey-100 px-5 py-3 text-card-title font-medium text-ink-3">
                📚 도서관 정보 준비 중
              </span>
            )}
            {buys.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {buys.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-btn border border-line px-4 py-2.5 text-small font-medium text-ink-2 transition hover:bg-grey-50"
                  >
                    {l.label} <span className="text-ink-3">(제휴)</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 왜 추천하는지 — 세일링 큐레이션(핵심 가치) */}
      <section className="mt-10 rounded-card bg-green/[0.06] border border-green/20 p-6">
        <h2 className="mb-3 flex items-center gap-2 text-h3 text-green">
          <span aria-hidden>🧭</span> 세일링이 추천하는 이유
        </h2>
        <p className="text-body leading-relaxed text-ink-2">{book.whyRecommended}</p>
      </section>

      {/* 출처 기사 역링크 */}
      {sourceArticles.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-meta text-ink-3">이 책을 소개한 기사</p>
          <div className="space-y-2">
            {sourceArticles.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${encodeURIComponent(a.id)}`}
                className="block rounded-card border border-line p-4 transition hover:bg-grey-50"
              >
                <span className="text-card-title font-semibold text-ink">{a.title}</span>
                <span className="mt-1 block text-meta text-ink-3">{a.source}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 큐레이션 안내 */}
      <div className="mt-8 rounded-card bg-grey-50 p-4">
        <p className="text-meta text-ink-2">
          ℹ️ 추천 이유는 세일링이 신뢰할 수 있는 출처를 바탕으로 정리한 큐레이션이에요. 구매 링크는
          제휴 관계가 있으며 본문과 명확히 구분돼요. 도서관 정보를 먼저 안내해요.
        </p>
      </div>

      {/* 같은 컬렉션의 다른 책 */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-h3 font-bold text-ink">같은 컬렉션의 다른 책</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {related.map((b) => (
              <Link key={b.id} href={`/collections/books/${encodeURIComponent(b.id)}`} className="group">
                <div className="aspect-[3/4] w-full">
                  <BookCoverLarge book={b} />
                </div>
                <p className="mt-2 line-clamp-2 text-small font-medium text-ink transition group-hover:text-blue">
                  {b.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
