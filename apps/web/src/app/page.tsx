import Link from 'next/link';
import {
  CATEGORIES,
  CATEGORY_LABEL,
  type Article,
  type Category,
} from '@parenting-newsletter/shared';
import { getRecentArticles } from '@/src/data/articles';
import { getLatestIssue } from '@/src/data/issues';
import { ArticleCard } from '@/src/components/ArticleCard';

// 홈 = "세일링 뉴스" (모든 탭 공통 구조)
//  ① 최상단: "{yy.mm.dd}의 큐레이션" — 오늘(최신 발행일) 기사 (탭 무관, 단일 그리드, 첫 카드 🆕)
//  ② 그 아래: "이전 기사" — 나머지를 날짜 구분 없이 한 블록으로 (순차)
//  ③ 모든 기사 보기 CTA
//  ※ UI = Toss Feed 카드 스타일(디스크립션 미표시). UX 구조(날짜정렬·큐레이션/이전기사 묶음)는 고정.
type SearchParams = { category?: string };

function fmtStamp(iso: string): string {
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

export default async function Home({ searchParams }: { searchParams?: SearchParams }) {
  const [allRecent, latestIssue] = await Promise.all([getRecentArticles(), getLatestIssue()]);

  const filterCategory = searchParams?.category as Category | undefined;
  const isAllTab = !filterCategory;

  const base = isAllTab ? allRecent : allRecent.filter((a) => a.category === filterCategory);
  const latestDate = base[0]?.issueDate;
  const todayArticles: Article[] = latestDate ? base.filter((a) => a.issueDate === latestDate) : [];
  const olderArticles: Article[] = latestDate
    ? base.filter((a) => a.issueDate !== latestDate)
    : [];
  const newId = todayArticles[0]?.id; // 프로토타입: 최신 1건 = '오후 발행' 가상 🆕

  const updatedLabel = latestIssue
    ? new Date(latestIssue.date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      })
    : '—';

  return (
    <div>
      {/* 미리 준비 — hero 배너 (최상단 진입점) */}
      <Link
        href="/radar"
        className="group mb-10 flex items-center gap-4 overflow-hidden rounded-card bg-gradient-to-r from-blue to-blue-600 p-6 text-white shadow-card transition hover:shadow-card-hover"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-white/20 text-h2">
          🧭
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-meta font-semibold tracking-wider text-blue-50">미리 준비</p>
          <p className="mt-1 text-h3 font-bold leading-snug">
            다가오는 입학·신청·마감, 미리 알려드려요
          </p>
          <p className="mt-1 text-body text-blue-50">유치원·초등 입학 준비부터 마감일까지 한눈에</p>
        </div>
        <span className="shrink-0 text-xl transition group-hover:translate-x-1">→</span>
      </Link>

      <header className="pb-8">
        <p className="mb-2 text-meta font-semibold uppercase tracking-widest text-blue">SAILING</p>
        <h1 className="text-h1 text-ink">세일링 뉴스</h1>
        <p className="mt-2 text-meta text-ink-3">마지막 업데이트 {updatedLabel}</p>
      </header>

      {/* 카테고리 탭 9개 (전체 + 8) */}
      <div className="mb-12 flex flex-wrap items-center gap-2 border-b border-line pb-5">
        <Link
          href="/"
          className={`rounded-full px-4 py-2 text-meta font-medium transition ${
            isAllTab ? 'bg-ink text-white' : 'bg-grey-100 text-ink-2 hover:bg-grey-200'
          }`}
        >
          전체
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/?category=${cat}`}
            className={`rounded-full px-4 py-2 text-meta font-medium transition ${
              filterCategory === cat
                ? 'bg-ink text-white'
                : 'bg-grey-100 text-ink-2 hover:bg-grey-200'
            }`}
          >
            {CATEGORY_LABEL[cat]}
          </Link>
        ))}
      </div>

      {todayArticles.length === 0 ? (
        <div className="rounded-card border border-dashed border-grey-300 bg-white p-12 text-center text-ink-3">
          해당 카테고리 기사가 없습니다.
        </div>
      ) : (
        <>
          {/* ① {yy.mm.dd}의 큐레이션 — 모든 탭 공통, 단일 그리드 */}
          <section className="mb-20">
            <div className="mb-8 flex items-baseline gap-2">
              <h2 className="text-h2 text-ink">
                <span className="text-blue">{fmtStamp(latestDate!)}</span>의 큐레이션
              </h2>
              <span className="ml-auto text-meta text-ink-3">{todayArticles.length}건</span>
            </div>
            {/* 추천(featured) — 큰 카드 */}
            <ArticleCard
              article={todayArticles[0]}
              isNew={todayArticles[0].id === newId}
              variant="featured"
              showSummary={false}
            />
            {/* 나머지 — 그리드 */}
            {todayArticles.length > 1 && (
              <div className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {todayArticles.slice(1).map((a) => (
                  <ArticleCard key={a.id} article={a} showSummary={false} />
                ))}
              </div>
            )}
          </section>

          {/* ② 이전 기사 (가제) — 날짜 구분 없이 한 블록 */}
          {olderArticles.length > 0 && (
            <section className="mb-16">
              <div className="mb-8 flex items-baseline gap-2 border-b border-line pb-3">
                <h2 className="text-h3 text-ink">이전 기사</h2>
                <span className="ml-auto text-meta text-ink-3">{olderArticles.length}건</span>
              </div>
              <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {olderArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} showSummary={false} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ③ 모든 기사 보기 */}
      <div className="mt-16 flex flex-col items-center gap-4">
        <Link
          href={isAllTab ? '/articles' : `/articles?category=${filterCategory}`}
          className="inline-flex items-center gap-2 rounded-btn bg-blue px-6 py-3.5 text-card-title font-semibold text-white transition hover:bg-blue-600"
        >
          {isAllTab ? '모든 기사 보기' : `${CATEGORY_LABEL[filterCategory!]} 기사 모두 보기`} →
        </Link>
        <Link
          href="/issues"
          className="text-meta text-ink-3 underline underline-offset-4 hover:text-ink-2"
        >
          또는 이전 이슈 보기
        </Link>
      </div>
    </div>
  );
}
