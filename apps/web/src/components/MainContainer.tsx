'use client';

import { usePathname } from 'next/navigation';

// 본문 폭 중앙 관리.
//  - 넓은 폭(max-w-container 1120px) = 홈·모든 기사 등 카드 그리드/피드 브라우즈 페이지.
//  - 좁은 폭(max-w-3xl 768px) = 그 외 서브페이지 — 읽기 가독성 고정 폭.
const WIDE_PATHS = ['/', '/articles', '/reservations'];

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWide = WIDE_PATHS.includes(pathname);
  return (
    <main
      className={`mx-auto w-full px-5 py-10 sm:px-6 sm:py-16 ${
        isWide ? 'max-w-container' : 'max-w-3xl'
      }`}
    >
      {children}
    </main>
  );
}
