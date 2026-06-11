import Link from 'next/link';
import type { Book, BookLink } from '@parenting-newsletter/shared';
import { getBookCollections } from '@/src/data/books';
import { getAllArticles } from '@/src/data/articles';

// 도서 컬렉션 — 기사에서 추출한 추천 도서를 기사 만료와 무관하게 보존하는 에버그린 카탈로그.
// /collections = 허브(현재 도서 1종). 공연·놀이 컬렉션은 후속(컬렉션 구조 재사용).
export const dynamic = 'force-dynamic';

function fmtCollectionDate(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  return m ? `${y}년 ${Number(m)}월` : yyyymm;
}

export default async function CollectionsPage() {
  const collections = await getBookCollections();
  // 출처 기사 역링크용 — 제목 매핑(있을 때만 링크).
  const articles = await getAllArticles().catch(() => []);
  const articleTitle = new Map(articles.map((a) => [a.id, a.title] as const));

  const totalBooks = collections.reduce((n, c) => n + c.books.length, 0);

  return (
    <div>
      <header className="pb-8">
        <p className="mb-2 text-small font-medium tracking-wider text-blue-600">세일링 책장</p>
        <h1 className="mb-3 text-h1 font-bold text-ink">두고두고 보는 추천 도서</h1>
        <p className="text-body leading-7 text-ink-2">
          기사에서 소개한 좋은 책을, 기사가 사라져도 계속 찾아볼 수 있게 모았어요. 지금 {totalBooks}권.
        </p>
        <p className="mt-2 text-small text-ink-3">
          ⓘ 추천 이유는 세일링이 정리한 큐레이션이에요. 도서관·구매 링크는 책마다 순차 연결됩니다.
        </p>
      </header>

      <div className="space-y-14">
        {collections.length === 0 && (
          <p className="py-16 text-center text-body text-ink-3">아직 등록된 컬렉션이 없어요.</p>
        )}
        {collections.map((col) => (
          <section key={col.name}>
            <div className="mb-6 flex items-baseline gap-3">
              <h2 className="text-h2 font-bold text-ink">{col.name}</h2>
              <span className="text-small text-ink-3">
                {fmtCollectionDate(col.collectionDate)} · {col.books.length}권
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {col.books.map((book) => (
                <BookCard key={book.id} book={book} articleTitle={articleTitle} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function BookCover({ book }: { book: Book }) {
  if (book.coverImageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={book.coverImageUrl}
        alt=""
        loading="lazy"
        className="h-full w-full rounded-card object-cover shadow-card"
      />
    );
  }
  // 표지 enrichment 전 폴백 — 책등 느낌의 의도된 플레이스홀더.
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-card border border-line bg-grey-50 p-4 text-center">
      <span className="text-3xl opacity-60" aria-hidden>
        📖
      </span>
      <span className="line-clamp-3 text-small font-medium text-ink-3">{book.title}</span>
    </div>
  );
}

function BookCard({
  book,
  articleTitle,
}: {
  book: Book;
  articleTitle: Map<string, string>;
}) {
  const links = (book.links ?? []) as BookLink[];
  const library = links.find((l) => l.kind === 'library');
  const buy = links.filter((l) => l.kind === 'buy');
  const sourceId = book.sourceArticleIds[0];

  const detailHref = `/collections/books/${encodeURIComponent(book.id)}`;

  return (
    <article className="flex flex-col">
      <Link href={detailHref} className="group block aspect-[3/4] w-full">
        <div className="h-full w-full transition group-hover:opacity-90">
          <BookCover book={book} />
        </div>
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {book.themes.slice(0, 2).map((t) => (
          <span key={t} className="rounded-btn bg-blue-50 px-2 py-0.5 text-meta font-medium text-blue">
            {t}
          </span>
        ))}
        <span className="text-meta text-ink-3">만 {book.ageRange.replace('-', '~')}세</span>
      </div>

      <h3 className="mt-2 text-card-title font-semibold text-ink">
        <Link href={detailHref} className="transition hover:text-blue">
          {book.title}
        </Link>
      </h3>
      <p className="mt-0.5 text-small text-ink-3">
        {[book.author, book.publisher].filter(Boolean).join(' · ')}
      </p>

      <p className="mt-2 line-clamp-4 text-body leading-relaxed text-ink-2">{book.whyRecommended}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {library ? (
          <a
            href={library.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-btn bg-green/10 px-3 py-1.5 text-small font-medium text-green"
          >
            📚 {library.label}
          </a>
        ) : (
          <span className="rounded-btn bg-grey-100 px-3 py-1.5 text-small text-ink-3">
            📚 도서관 정보 준비 중
          </span>
        )}
        {buy.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-btn border border-line px-3 py-1.5 text-small font-medium text-ink-2"
          >
            {l.label} <span className="text-ink-3">(제휴)</span>
          </a>
        ))}
      </div>

      {sourceId && articleTitle.has(sourceId) && (
        <Link
          href={`/articles/${encodeURIComponent(sourceId)}`}
          className="mt-3 text-meta text-ink-3 underline-offset-2 hover:text-blue hover:underline"
        >
          이 책을 소개한 기사 →
        </Link>
      )}
    </article>
  );
}
