import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CATEGORY_LABEL,
  CONTENT_TYPE_LABEL,
  type Category,
  type Article,
} from '@parenting-newsletter/shared';
import { getAllIssues, getIssueByDate, getIssueArticles } from '@/src/data/issues';
import { CategoryFilterDropdown } from '@/src/components/CategoryFilterDropdown';

// 날짜 검증 배지 (운영자 프리뷰 전용) — 원문 대조 결과를 ✅/⚠️로.
function DateCheckBadge({ article }: { article: Article }) {
  const hasDate = Boolean(article.deadline || article.eventStartDate || article.eventEndDate);
  if (!hasDate) return null;
  const check = article.dateCheck;
  if (!check) {
    return (
      <span className="inline-flex rounded-full bg-grey-100 px-2.5 py-0.5 font-medium text-ink-3">
        🕐 날짜 미검증
      </span>
    );
  }
  const verdicts = [check.deadline, check.eventStartDate, check.eventEndDate].filter(Boolean);
  if (verdicts.includes('unconfirmed')) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-800">
        ⚠️ 날짜 미확인 — 원문 확인
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-green/10 px-2.5 py-0.5 font-semibold text-green">
      ✅ 날짜 검증됨
    </span>
  );
}

export async function generateStaticParams() {
  const issues = await getAllIssues();
  return issues.map((i) => ({ date: i.date }));
}

type SearchParams = { category?: string; preview?: string };

type PageProps = {
  params: Promise<{ date: string }>;
  searchParams?: Promise<SearchParams>;
};

// per-issue SEO — 후킹 편집테마(issue.title)를 제목으로. getIssueByDate는 getAllIssues(cache) 공유.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { date } = await params;
  const issue = await getIssueByDate(date).catch(() => undefined);
  if (!issue) return { title: '이슈를 찾을 수 없어요' };
  const dateLabel = `${date} 큐레이션`;
  const title = issue.title || dateLabel;
  const desc = issue.summary || '세일링이 그날 골라낸 육아 정책·신청·행사·콘텐츠를 한눈에.';
  return {
    title,
    description: desc,
    alternates: { canonical: `/issues/${date}` },
    openGraph: { type: 'article', title, description: desc, url: `/issues/${date}` },
    twitter: { card: 'summary', title, description: desc },
  };
}

export default async function IssueDatePage({ params, searchParams }: PageProps) {
  // preview 토큰이 있으면 미공개(draft) 이슈도 조회 (운영자 검수). API가 토큰을 검증.
  const { date } = await params;
  const sp = await searchParams;
  const preview = sp?.preview;
  const issue = await getIssueByDate(date, preview);
  if (!issue) {
    notFound();
  }

  const allArticles = await getIssueArticles(issue.date, preview);
  const selectedCategories = (
    sp?.category ? sp.category.split(',').filter(Boolean) : []
  ) as Category[];
  const articles = selectedCategories.length
    ? allArticles.filter((a) => selectedCategories.includes(a.category))
    : allArticles;

  const countByCategory: Partial<Record<Category, number>> = {};
  for (const a of allArticles) {
    countByCategory[a.category] = (countByCategory[a.category] ?? 0) + 1;
  }

  const dateLabel = new Date(issue.date).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  // 묶음 정체성 = 후킹 편집 테마(issue.title). 날짜는 "N월 N일 큐레이션" eyebrow로 강등.
  const editionLabel =
    new Date(issue.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) +
    ' 큐레이션';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {preview && (
        <div className="mb-6 rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-small font-semibold text-amber-800">
          🔍 미리보기 — 미공개 초안입니다. 공개하려면 Supabase에서 이 이슈의 status를 published로 변경하세요.
        </div>
      )}
      <header className="mb-6">
        <Link href="/issues" className="text-body font-medium text-blue-600 hover:underline">
          ← 아카이브
        </Link>
        <p className="mt-3 text-small font-semibold text-blue">
          {editionLabel} · 기사 전체 {allArticles.length}개
        </p>
        <h1 className="mt-1 text-h1 font-bold leading-snug text-ink">{issue.title || dateLabel}</h1>
        {issue.summary && <p className="mt-2 text-body text-ink-2">{issue.summary}</p>}
      </header>

      <div className="mb-6 flex items-center justify-between gap-3 border-b border-grey-200 pb-4">
        <CategoryFilterDropdown countByCategory={countByCategory} totalCount={allArticles.length} />
        <span className="text-body text-ink-3">
          {selectedCategories.length ? `${articles.length}개 표시` : `${allArticles.length}개`}
        </span>
      </div>

      <ul className="divide-y divide-grey-100">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/articles/${encodeURIComponent(article.id)}${preview ? `?preview=${encodeURIComponent(preview)}` : ''}`}
              className="group block py-5 transition"
            >
              <div className="mb-2 flex items-center gap-2 text-small">
                <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 font-semibold text-blue">
                  {CATEGORY_LABEL[article.category]}
                </span>
                <span className="inline-flex rounded-full bg-grey-100 px-2.5 py-0.5 font-medium text-ink-2">
                  {CONTENT_TYPE_LABEL[article.contentType]}
                </span>
                <span className="truncate text-ink-3">{article.source}</span>
                {preview && <DateCheckBadge article={article} />}
              </div>

              <h2 className="text-h3 font-semibold leading-snug text-ink group-hover:text-blue">
                {article.title}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-body leading-6 text-ink-2">{article.summary}</p>

              <span className="mt-2 inline-flex text-small font-semibold text-blue-600">자세히 보기 →</span>
            </Link>
          </li>
        ))}
      </ul>

      {articles.length === 0 && (
        <p className="py-12 text-center text-body text-ink-3">이 카테고리의 기사가 없습니다.</p>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-body font-semibold text-white transition hover:bg-blue"
        >
          오늘의 이슈로 →
        </Link>
      </div>
    </div>
  );
}
