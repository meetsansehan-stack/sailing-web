import Link from 'next/link';

// 없는 경로·notFound() 호출 시 폴백(RootLayout·MainContainer 안에서 렌더).
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="text-display leading-none" aria-hidden>
        🧭
      </p>
      <h1 className="mt-5 text-h2 text-ink">찾는 페이지가 없어요</h1>
      <p className="mt-3 text-body text-ink-3">
        주소가 바뀌었거나 사라진 페이지일 수 있어요. 홈에서 오늘의 소식부터 살펴보세요.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-grey-900 px-5 py-2.5 text-body font-semibold text-white transition hover:bg-grey-700"
        >
          홈으로
        </Link>
        <Link
          href="/issues"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-grey-300 bg-white px-5 py-2.5 text-body font-semibold text-ink-2 transition hover:bg-grey-50"
        >
          아카이브 둘러보기 →
        </Link>
      </div>
    </div>
  );
}
