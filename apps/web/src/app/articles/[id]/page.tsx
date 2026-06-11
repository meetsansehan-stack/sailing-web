import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CATEGORY_LABEL, CONTENT_TYPE_LABEL } from '@parenting-newsletter/shared';
import { getAllArticles, getArticleById } from '@/src/data/articles';
import { getBooksByArticle } from '@/src/data/books';
import { getAllVenues } from '@/src/data/venues';
import { matchVenueForEvent } from '@/src/lib/event-venue';
import { EventInfoBox } from '@/src/components/EventInfoBox';
import { ArticleBody } from '@/src/components/ArticleBody';
import { credibilityTier } from '@/src/lib/credibility';
import { summaryBullets, keyPointBullets } from '@/src/lib/parse-body';

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((a) => ({ id: a.id }));
}

type PageProps = {
  params: { id: string };
  searchParams?: { preview?: string };
};

export default async function ArticleDetailPage({ params, searchParams }: PageProps) {
  // preview 토큰이 있으면 미공개(draft) 이슈의 기사도 조회 (운영자 검수). API가 토큰을 검증.
  const preview = searchParams?.preview;
  const decodedId = decodeURIComponent(params.id);
  const article = await getArticleById(decodedId, preview);

  if (!article) {
    notFound();
  }

  // Event 골격 — venue 매칭으로 메타박스 보강 (미매칭이면 article 필드로 degrade).
  // ⚠️ 렌더타임 퍼지매칭(프로토타입). 정식은 파이프라인 Article.venueId — lib/event-venue.ts 참조.
  const matchedVenue =
    article.contentType === 'Event'
      ? matchVenueForEvent(article, await getAllVenues())
      : undefined;

  // 이 기사에서 추출돼 도서 컬렉션에 보존된 책 (기사 만료와 무관하게 접근). 역링크.
  const sourcedBooks = await getBooksByArticle(decodedId).catch(() => []);

  const publishedLabel = new Date(article.publishedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="mx-auto max-w-article">
      {preview && (
        <div className="mb-5 rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-small font-semibold text-amber-800">
          🔍 미리보기 — 미공개 초안 기사입니다.
        </div>
      )}
      <Link href="/" className="text-meta text-ink-3 transition hover:text-ink">
        ← 세일링 뉴스
      </Link>

      {/* 헤더 */}
      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-meta font-semibold text-blue">{CATEGORY_LABEL[article.category]}</span>
          <span className="text-meta text-ink-3">{CONTENT_TYPE_LABEL[article.contentType]}</span>
          <span className="text-meta text-ink-3">· {article.source}</span>
        </div>
        <h1 className="mt-3 text-h1 text-ink">{article.title}</h1>
        <p className="mt-3 text-meta text-ink-3">{publishedLabel}</p>
      </header>

      {/* 이벤트 정보 — Event 골격 (venue 매칭 보강) */}
      <EventInfoBox article={article} venue={matchedVenue} />

      {/* 마감 정보 */}
      {article.deadline &&
        (() => {
          const deadlineDate = new Date(article.deadline);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const remaining = Math.round(
            (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          const isPast = remaining < 0;
          return (
            <div className="mt-8 rounded-card bg-red-bg p-5">
              <div className="flex items-center gap-2">
                <p className="text-meta font-bold tracking-wider text-red">⏰ 신청·접수 마감</p>
                {!isPast && remaining <= 3 && (
                  <span className="inline-flex items-center rounded-full bg-red px-2 py-0.5 text-small font-bold text-white">
                    D-{remaining}
                  </span>
                )}
                {isPast && (
                  <span className="inline-flex items-center rounded-full bg-grey-400 px-2 py-0.5 text-small font-bold text-white">
                    마감 완료
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-card-title font-semibold text-red">
                {deadlineDate.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
                {isPast ? ' 마감됨' : ' 까지'}
              </p>
              <p className="mt-1 text-meta text-red">신청 채널·서류는 본문 체크리스트와 원문 링크 참고</p>
            </div>
          );
        })()}

      {/* 한눈에 보는 핵심 (요약) — Event는 summary가 EventInfoBox에 통합되므로 미표시 (중복 제거).
          조건 = EventInfoBox가 렌더되는 경우(Event + eventStartDate)와 정확히 배타. */}
      {!(article.contentType === 'Event' && article.eventStartDate) &&
        (() => {
          // 박스 = 본문 "## 한눈에" TL;DR 불릿(있으면), 없으면 summary 문장 분할로 폴백
          const key = keyPointBullets(article.body);
          const bullets = key.length ? key : summaryBullets(article.summary);
          return (
            <div className="mt-10 rounded-card bg-blue-50 p-6">
              <p className="text-meta font-bold tracking-wider text-blue">한눈에 보는 핵심</p>
              <ul className="mt-3 space-y-2">
                {bullets.map((b, i) => (
                  <li key={i} className="flex gap-2.5 text-body leading-relaxed text-ink">
                    <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-blue/50" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

      {/* 본문 — 역할 분류(양육자 콜아웃) + Event 개요는 상단 박스가 흡수 */}
      <ArticleBody body={article.body} contentType={article.contentType} />

      {/* 이 기사가 소개한 책 — 도서 컬렉션 역링크 (기사 만료돼도 책은 보존). */}
      {sourcedBooks.length > 0 && (
        <section className="mt-14">
          <h2 className="text-h3 font-bold text-ink">이 기사가 소개한 책</h2>
          <p className="mb-5 mt-1 text-meta text-ink-3">
            기사가 지나가도 책장에서 계속 찾아볼 수 있어요.
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4">
            {sourcedBooks.map((b) => (
              <Link
                key={b.id}
                href={`/collections/books/${encodeURIComponent(b.id)}`}
                className="group"
              >
                <div className="aspect-[3/4] w-full overflow-hidden rounded-card">
                  {b.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.coverImageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:opacity-90"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 border border-line bg-grey-50 p-2 text-center">
                      <span className="text-2xl opacity-60" aria-hidden>
                        📖
                      </span>
                      <span className="line-clamp-2 text-meta text-ink-3">{b.title}</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-small font-medium text-ink transition group-hover:text-blue">
                  {b.title}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href="/collections"
            className="mt-5 inline-block text-meta text-blue hover:underline"
          >
            세일링 책장 전체 보기 →
          </Link>
        </section>
      )}

      {/* 큐레이션 안내 */}
      <div className="mt-12 rounded-card bg-grey-50 p-4">
        <p className="text-meta text-ink-2">
          ℹ️ 본 콘텐츠는 신뢰할 수 있는 출처를 바탕으로 자체 편집한 큐레이션입니다. 원문은 아래
          링크에서 확인하실 수 있습니다.
        </p>
      </div>

      {/* 출처 · 신뢰 등급 — 박스 없이 (점수 %(가짜 정밀도) 대신 출처 등급 배지) */}
      <div className="mt-6">
        <p className="mb-2 text-meta text-ink-3">출처</p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-card-title font-semibold text-ink">{article.source}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-meta font-semibold text-blue">
            ✓ {credibilityTier(article.credibilityScore).label}
          </span>
        </div>
        <p className="mt-2 text-meta text-ink-3">
          {credibilityTier(article.credibilityScore).desc}
        </p>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center rounded-btn bg-blue px-6 py-3.5 text-card-title font-semibold text-white transition hover:bg-blue-600"
        >
          원문 사이트에서 읽기 ↗
        </a>
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center rounded-btn border border-line bg-white px-6 py-3.5 text-card-title font-semibold text-ink-2 transition hover:bg-grey-50"
        >
          홈으로 돌아가기
        </Link>
      </div>

      <div className="mt-12 space-y-2 text-center text-meta text-ink-3">
        <p>이 기사는 신뢰할 수 있는 국내 소스에서 큐레이션되었습니다.</p>
        <p>
          더 많은 뉴스는 <Link href="/" className="text-blue hover:underline">오늘의 이슈</Link> 또는{' '}
          <Link href="/issues" className="text-blue hover:underline">아카이브</Link>에서 확인하세요.
        </p>
      </div>
    </div>
  );
}
