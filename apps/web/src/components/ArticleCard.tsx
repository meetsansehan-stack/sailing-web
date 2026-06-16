import Link from 'next/link';
import { CATEGORY_LABEL, CONTENT_TYPE_LABEL, type Article } from '@parenting-newsletter/shared';
import { CategoryVisual } from './CategoryVisual';

// 공용 기사 카드 — 홈·기사목록·이슈상세 공통.
// 디자인: Toss Feed 에디토리얼 카드 (박스/보더 없음, hover 시 제목 블루·썸네일 흐려짐).
//  - default : 반응형 — 모바일=가로 리스트 행(텍스트 좌 + 정사각 썸네일 우, Toss Feed 모바일 실측)
//              / sm+=그리드 세로 카드(썸네일 16:10 상단 + 제목 + 메타)
//  - featured: "추천 아티클" — 큰 썸네일 16:9 + 큰 제목 + 설명 (lg에서 이미지 좌/텍스트 우)
//  - showSummary: 요약 노출 제어 (미지정 시 노출). 홈은 false로 디스크립션 숨김.
export function ArticleCard({
  article,
  isNew = false,
  variant = 'default',
  showSummary = true,
}: {
  article: Article;
  isNew?: boolean;
  variant?: 'default' | 'featured';
  showSummary?: boolean;
}) {
  const featured = variant === 'featured';

  const Thumb = (
    <div
      className={`relative overflow-hidden rounded-card bg-grey-100 ${
        featured ? 'aspect-[16/9]' : 'aspect-square sm:aspect-[16/10]'
      }`}
    >
      {isNew && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-blue px-2.5 py-1 text-small font-semibold text-white">
          🆕 새로 나온
        </span>
      )}
      {article.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:opacity-90"
        />
      ) : (
        <CategoryVisual category={article.category} size={featured ? 'hero' : 'card'} />
      )}
      {/* hover 툴팁 — 카드엔 제목만, 설명은 hover 시 썸네일 위 2줄로(default 카드 한정). 순수 CSS. */}
      {!featured && article.summary && (
        <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="line-clamp-2 text-small leading-snug text-white">{article.summary}</p>
        </div>
      )}
    </div>
  );

  const Meta = (
    <>
      <div className="flex items-center gap-2">
        <span className="text-meta font-semibold text-blue">{CATEGORY_LABEL[article.category]}</span>
        <span className="text-meta text-ink-3">{CONTENT_TYPE_LABEL[article.contentType]}</span>
      </div>
      <h3
        className={`line-clamp-2 text-ink transition group-hover:text-blue-600 ${
          // 카드 타이틀 = headline 토큰(24px/600/lh1.4, Toss Feed 실측). featured는 더 큰 단계.
          featured ? 'mt-2 text-h2 lg:text-h1' : 'mt-1 text-h3 sm:mt-2 sm:text-headline'
        }`}
      >
        {article.title}
      </h3>
      {showSummary && article.summary && (
        <p
          className={`text-ink-2 ${
            featured ? 'mt-3 line-clamp-3 text-body lg:text-card-title lg:font-normal' : 'mt-1.5 line-clamp-2 text-body'
          }`}
        >
          {article.summary}
        </p>
      )}
      {article.contentType === 'Event' && article.eventStartDate && (
        <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-btn bg-blue-50 px-2.5 py-1 text-small font-medium text-blue">
          📅 {new Date(article.eventStartDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 시작
        </div>
      )}
      {article.deadline && (
        <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-btn bg-red-bg px-2.5 py-1 text-small font-semibold text-red">
          ⏰ {new Date(article.deadline).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 마감
        </div>
      )}
      <div className="mt-3 flex items-center gap-1.5 text-meta text-ink-3">
        <span className="truncate">{article.source}</span>
        <span>·</span>
        {/* 우리는 외부 뉴스 큐레이터 → 원문 발행일(publishedAt)을 표시(정보·신뢰).
            정렬·신선도는 issueDate(노출일), 표시는 원문일로 역할 분리. */}
        <span className="shrink-0">{new Date(article.publishedAt).toLocaleDateString('ko-KR')}</span>
      </div>
    </>
  );

  if (featured) {
    return (
      <Link
        href={`/articles/${encodeURIComponent(article.id)}`}
        className="group grid items-center gap-6 lg:grid-cols-2 lg:gap-10"
      >
        {Thumb}
        <div>{Meta}</div>
      </Link>
    );
  }

  // 모바일 = 가로 리스트 행(텍스트 좌 + 정사각 썸네일 우) / sm+ = 세로 카드(썸네일 상단).
  return (
    <Link
      href={`/articles/${encodeURIComponent(article.id)}`}
      className="group flex flex-row items-start gap-4 sm:flex-col sm:gap-0"
    >
      <div className="order-1 min-w-0 flex-1 sm:order-2">{Meta}</div>
      <div className="order-2 w-24 shrink-0 sm:order-1 sm:mb-4 sm:w-auto sm:self-stretch">{Thumb}</div>
    </Link>
  );
}
