'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/src/lib/analytics';

// 페이지뷰 + 체류시간 익명 측정. 레이아웃에 1개 마운트.
// page_view = 경로 변경마다 / page_exit = 이탈(경로변경·탭숨김·언로드)마다 1회, durationMs 동반.
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const enterRef = useRef(0);
  const sentRef = useRef(false);

  useEffect(() => {
    const path = pathname;
    track('page_view');
    enterRef.current = Date.now();
    sentRef.current = false;

    // 이탈 1회 발화(중복 방지) — 진입 경로(path) 보존, 1초 미만 체류는 노이즈로 스킵.
    const flush = () => {
      if (sentRef.current) return;
      const durationMs = Date.now() - enterRef.current;
      if (durationMs < 1000) return;
      sentRef.current = true;
      track('page_exit', undefined, { path, durationMs });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      flush(); // 경로 변경 = 이탈
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [pathname]);

  return null;
}
