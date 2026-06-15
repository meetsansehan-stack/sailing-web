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
import SubscribeCTA from '@/src/components/SubscribeCTA';
import { TOPICS as RADAR_TOPICS } from '@/src/app/radar/data';

// 홈 = "세일링 뉴스" (모든 탭 공통 구조)
//  ① 최상단: "새로 올라온 소식" — 최신 노출분(issueDate=최신)이면서 **원문일이 최근 1주 이내**인 것만 (탭 무관, 단일 그리드)
//  ② 그 아래: "이전 기사" — 나머지 전부(이전 노출일 + 오늘 올렸어도 원문 오래된 것)를 **원문일 최신순**으로 한 블록 (날짜 구획 없음)
//  ③ 모든 기사 보기 CTA
//  ※ 섹션은 날짜로 구획하지 않음(뉴닉·요즘IT·Toss 공통). 카드 날짜=원문 발행일(우리는 외부뉴스 큐레이터).
//  ※ UI = Toss Feed 카드 스타일(디스크립션 미표시). 날짜 기반 정리는 /issues 아카이브에 보존.
type SearchParams = { category?: string };

export default async function Home({ searchParams }: { searchParams?: SearchParams }) {
  const [allRecent, latestIssue] = await Promise.all([getRecentArticles(), getLatestIssue()]);

  const filterCategory = searchParams?.category as Category | undefined;
  const isAllTab = !filterCategory;

  const base = isAllTab ? allRecent : allRecent.filter((a) => a.category === filterCategory);
  const latestDate = base[0]?.issueDate;

  // "새로 올라온 소식" = 오늘 노출(issueDate=최신)분 중 **원문일(publishedAt)이 최근 1주 이내**인 것만.
  // 오늘 큐레이션했어도 원문이 오래된 기사(진행중 행사 등)는 "이전 기사"로 내려간다 → 새 소식엔 진짜 최근 원문만.
  const FRESH_WINDOW_DAYS = 7;
  const freshCutoff = latestDate
    ? (() => {
        const d = new Date(`${latestDate}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() - FRESH_WINDOW_DAYS);
        return d.toISOString().slice(0, 10);
      })()
    : '';
  const isFresh = (a: Article) =>
    a.issueDate === latestDate && a.publishedAt.slice(0, 10) >= freshCutoff;

  const todayArticles: Article[] = base.filter(isFresh);
  // 이전 기사 = 나머지 전부(이전 노출일 + 오늘 올렸어도 원문 오래된 것), 원문일(publishedAt) 최신순.
  const olderArticles: Article[] = base
    .filter((a) => !isFresh(a))
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

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
      {/* 미리 준비 — 시즌별 진입 배너 (각 상세로 바로 진입) */}
      <div className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-meta font-semibold tracking-wider text-blue">🧭 미리 준비</p>
          <Link href="/radar" className="text-small text-ink-3 hover:text-ink-2">
            전체 보기 →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {RADAR_TOPICS.filter((t) => t.status === 'live').map((t) => (
            <Link
              key={t.slug}
              href={t.href}
              className={`group flex items-center gap-3 overflow-hidden rounded-card bg-gradient-to-r ${t.gradient} p-5 text-white shadow-card transition hover:shadow-card-hover`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-white/20 text-h3">
                {t.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-meta font-semibold tracking-wider text-white/80">{t.eyebrow}</p>
                <p className="mt-0.5 text-card-title font-bold leading-snug">{t.title}</p>
              </div>
              <span className="shrink-0 text-lg transition group-hover:translate-x-1">→</span>
            </Link>
          ))}
        </div>
      </div>

      <header className="pb-8">
        <p className="mb-2 text-meta font-semibold uppercase tracking-widest text-blue">SAILING</p>
        <h1 className="text-h1 text-ink">세일링 뉴스</h1>
        <p className="mt-2 text-meta text-ink-3">마지막 업데이트 {updatedLabel}</p>
      </header>

      {/* 카테고리 탭 9개 (전체 + 8) — Feed식 언더라인 탭(선택=하단 라인, 평상시=텍스트 버튼). 9개라 가로 스크롤. */}
      <div className="mb-12 flex gap-6 overflow-x-auto border-b border-line [&::-webkit-scrollbar]:hidden">
        <Link
          href="/"
          className={`-mb-px shrink-0 border-b-2 pb-3 text-body transition ${
            isAllTab ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          전체
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/?category=${cat}`}
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

      {base.length === 0 ? (
        <div className="rounded-card border border-dashed border-grey-300 bg-white p-12 text-center text-ink-3">
          해당 카테고리 기사가 없습니다.
        </div>
      ) : (
        <>
          {/* ① 새로 올라온 소식 — 최신 노출분 중 원문일 1주 이내만. 없으면 섹션 자체를 숨김 */}
          {todayArticles.length > 0 && (
            <section className="mb-20">
              <div className="mb-8 flex items-baseline gap-2">
                <h2 className="text-h2 text-ink">새로 올라온 소식</h2>
                <span className="ml-auto text-meta text-ink-3">{todayArticles.length}건</span>
              </div>
              {/* 추천(featured) — 큰 카드 */}
              <ArticleCard article={todayArticles[0]} variant="featured" showSummary={false} />
              {/* 나머지 — 그리드 */}
              {todayArticles.length > 1 && (
                <div className="mt-14 grid gap-x-9 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-11">
                  {todayArticles.slice(1).map((a) => (
                    <ArticleCard key={a.id} article={a} showSummary={false} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ② 이전 기사 (가제) — 날짜 구분 없이 한 블록, 원문일 최신순 */}
          {olderArticles.length > 0 && (
            <section className="mb-16">
              <div className="mb-8 flex items-baseline gap-2 border-b border-line pb-3">
                <h2 className="text-h3 text-ink">이전 기사</h2>
                <span className="ml-auto text-meta text-ink-3">{olderArticles.length}건</span>
              </div>
              <div className="grid gap-x-9 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-11">
                {olderArticles.map((a) => (
                  <ArticleCard key={a.id} article={a} showSummary={false} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* 이메일 구독 CTA — 라이트 계정·메일 토대 (익명 읽기 안 막음) */}
      <SubscribeCTA source="home_cta" />

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
