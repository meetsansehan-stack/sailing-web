import {
  PRICING_LABEL,
  type Article,
  type ReservableVenue,
} from '@parenting-newsletter/shared';
import { overviewBullets } from '@/src/lib/parse-body';
import OutboundLink from '@/src/components/OutboundLink';

// Event 골격 — "행사 정보" 통합 블록 (contentType=Event 전용).
//
// 디자인(2026-06-04 갱신): 연파랑(blue-50) 박스 = 구조화 행(일시·장소·대상·입장)
//   + **개요 요약 불릿**(서술형 prose 대신 간단 불릿 — 한눈 요약) + 예약 CTA.
//   요약 불릿은 본문 "* 개요" 섹션에서 가져옴(본문은 Event에서 개요를 스킵 → 중복 렌더 0).
//   본문 핵심 콘텐츠와 내용이 겹쳐도 '요약'으로 읽혀 무리 없음(사용자 확정 2026-06-04).
//   별도 "한눈에 보는 핵심" 박스는 Event에선 미표시(상세페이지에서 배타 처리).
//
// Degradation-first: 일시·요약 불릿은 항상, 장소·대상·입장·예약은 venue 매칭 시만.
// venue는 상위(상세페이지)에서 matchVenueForEvent로 찾아 주입 — 미매칭이면 undefined.

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

// "3-12" → "3~12세". 한쪽만 있거나 포맷이 다르면 원문 유지.
function fmtAgeRange(range: string): string {
  const m = range.match(/^(\d+)\s*-\s*(\d+)$/);
  return m ? `${m[1]}~${m[2]}세` : range;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-11 shrink-0 pt-0.5 text-meta font-semibold text-blue">{label}</span>
      <span className="text-body text-ink">{children}</span>
    </div>
  );
}

export function EventInfoBox({
  article,
  venue,
}: {
  article: Article;
  venue?: ReservableVenue;
}) {
  if (article.contentType !== 'Event' || !article.eventStartDate) return null;

  const dateLabel = article.eventEndDate
    ? `${fmtDate(article.eventStartDate)} ~ ${fmtDate(article.eventEndDate)}`
    : `${fmtDate(article.eventStartDate)} 시작`;

  // 요약 불릿 = 본문 "개요" 섹션. 없으면 summary prose로 폴백(degradation-first).
  const summary = overviewBullets(article.body);

  return (
    <div className="mt-8 rounded-card bg-blue-50 p-5">
      <p className="text-meta font-bold tracking-wider text-blue">📅 행사 정보</p>

      {/* 구조화 행 — 빠른 스캔 */}
      <div className="mt-3 space-y-2">
        <Row label="일시">{dateLabel}</Row>
        {venue && (
          <>
            <Row label="장소">
              {venue.name}
              <span className="text-ink-3"> · {venue.region}</span>
            </Row>
            <Row label="대상">{fmtAgeRange(venue.ageRange)}</Row>
            <Row label="입장">{PRICING_LABEL[venue.pricing]}</Row>
          </>
        )}
      </div>

      {/* 개요 요약 — 간단 불릿(한눈 요약). 개요 불릿 없으면 summary prose 폴백 */}
      {summary.length > 0 ? (
        <>
          <div className="my-4 border-t border-blue/15" />
          <ul className="space-y-2">
            {summary.map((item, idx) => (
              <li key={idx} className="flex gap-2.5 text-body leading-relaxed text-ink-2">
                <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-blue/50" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </>
      ) : article.summary ? (
        <>
          <div className="my-4 border-t border-blue/15" />
          <p className="text-body leading-relaxed text-ink-2">{article.summary}</p>
        </>
      ) : null}

      {/* 예약·예매 CTA — venue 매칭 시만. 미매칭은 페이지 하단 "원문 사이트에서 읽기"가 대체 */}
      {venue && (
        <OutboundLink
          href={venue.reservationUrl}
          label="event_reserve"
          className="mt-4 inline-flex items-center gap-1 rounded-btn bg-blue px-4 py-2.5 text-meta font-semibold text-white transition hover:bg-blue-600"
        >
          🎟 예약·예매 페이지로 <span aria-hidden>↗</span>
        </OutboundLink>
      )}
    </div>
  );
}
