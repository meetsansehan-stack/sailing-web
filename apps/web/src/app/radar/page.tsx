import Link from 'next/link';
import { TOPICS } from './data';

// 미리 준비 허브 — 토스피드 에디션형 "타이포그래피 리스트".
// 큰 제목 + 구분선만으로 시즌 주제를 나열, 제목 클릭 → 상세(/radar/[slug]).
//  · status 'live' = 클릭 가능한 상세.
//  · status 'soon' = 예고편(클릭 불가). 공개 시기만 안내 + '알림 받기'(카카오·계정 trigger 가설).
// 주제가 늘면 TOPICS 배열에 추가하면 메뉴가 그대로 늘어남.
export default function RadarHub() {
  return (
    <div className="mx-auto max-w-4xl px-1">
      {/* 헤더 (중앙 정렬) */}
      <header className="pb-14 pt-6 text-center sm:pb-20 sm:pt-10">
        <p className="mb-4 text-meta font-semibold tracking-widest text-blue">🧭 SAILING · 미리 준비</p>
        <h1 className="text-h1 font-bold text-ink sm:text-display">미리 준비</h1>
        <p className="mx-auto mt-5 max-w-xl text-body leading-relaxed text-ink-3">
          시즌마다 흩어진 신청·마감·프로그램을 한 가지 주제로 깊게 모았어요.
          <br className="hidden sm:block" />
          내 아이 기준으로, 놓치면 안 될 것만 미리 챙겨드려요.
        </p>
      </header>

      {/* 타이포그래피 리스트 — 큰 제목 + 구분선 */}
      <ul className="border-t border-ink/15">
        {TOPICS.map((t) =>
          t.status === 'live' ? (
            <li key={t.slug}>
              <Link
                href={t.href}
                className="group flex items-center justify-between gap-4 border-b border-ink/15 py-8 transition-colors sm:py-12"
              >
                <div className="min-w-0">
                  <p className="mb-2 text-meta font-semibold tracking-wider text-ink-3">{t.eyebrow}</p>
                  <h2 className="text-4xl font-bold leading-tight tracking-tight text-ink transition-colors group-hover:text-blue sm:text-6xl">
                    {t.title}
                  </h2>
                </div>
                <span
                  aria-hidden
                  className="shrink-0 text-3xl text-grey-300 transition group-hover:translate-x-1 group-hover:text-blue sm:text-5xl"
                >
                  →
                </span>
              </Link>
            </li>
          ) : (
            <li
              key={t.slug}
              className="flex items-center justify-between gap-4 border-b border-ink/15 py-8 sm:py-12"
            >
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-meta font-semibold tracking-wider text-ink-3">{t.eyebrow}</p>
                  <span className="rounded-full bg-grey-100 px-2 py-0.5 text-micro font-semibold text-ink-3">
                    예고편
                  </span>
                  {t.openLabel && (
                    <span className="text-micro font-semibold text-blue">🕐 {t.openLabel}</span>
                  )}
                </div>
                <h2 className="text-4xl font-bold leading-tight tracking-tight text-grey-300 sm:text-6xl">
                  {t.title}
                </h2>
                {/* 알림 trigger (가설: 카카오 알림·계정 등록 진입점) — 지금은 stub */}
                <button
                  type="button"
                  disabled
                  className="mt-4 inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border border-grey-200 px-3.5 py-1.5 text-small font-semibold text-ink-3 opacity-70"
                >
                  🔔 공개되면 알림 받기 <span className="text-ink-3">(준비중)</span>
                </button>
              </div>
              <span aria-hidden className="shrink-0 text-3xl text-grey-200 sm:text-5xl">
                🔒
              </span>
            </li>
          ),
        )}
      </ul>

      <p className="mt-10 text-center text-small text-ink-3">
        ※ 데모 — 새로운 시즌 주제가 생기면 이 목록에 더해져요. ‘예고편’은 시즌이 다가오면 열려요.
      </p>
    </div>
  );
}
