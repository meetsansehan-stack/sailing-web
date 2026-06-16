'use client';

import Link from 'next/link';

// 세그먼트 렌더/데이터 fetch 실패 시 흰 화면 대신 보이는 폴백(RootLayout·MainContainer 안에서 렌더).
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="text-display leading-none" aria-hidden>
        ⛵
      </p>
      <h1 className="mt-5 text-h2 text-ink">잠시 항로를 벗어났어요</h1>
      <p className="mt-3 text-body text-ink-3">
        화면을 불러오는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-grey-900 px-5 py-2.5 text-body font-semibold text-white transition hover:bg-grey-700"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-grey-300 bg-white px-5 py-2.5 text-body font-semibold text-ink-2 transition hover:bg-grey-50"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
