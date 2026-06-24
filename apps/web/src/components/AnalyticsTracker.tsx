'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/src/lib/analytics';

// 페이지뷰 + 체류시간 + 스크롤 깊이 익명 측정. 레이아웃에 1개 마운트.
// page_view = 경로 변경마다
// page_exit = 이탈(경로변경·탭숨김·언로드)마다 1회, durationMs + scrollDepthPct 동반.
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const enterRef = useRef(0);
  const sentRef = useRef(false);
  const maxScrollRef = useRef(0);

  useEffect(() => {
    const path = pathname;
    track('page_view');
    enterRef.current = Date.now();
    sentRef.current = false;
    maxScrollRef.current = 0;

    // 스크롤 깊이 측정 — 스크롤할 때마다 최대값 갱신 (throttle 없이도 가벼움, 숫자 비교만)
    const onScroll = () => {
      const el = document.documentElement;
      if (el.scrollHeight <= el.clientHeight) return; // 스크롤 불필요한 페이지
      const pct = Math.round(((window.scrollY + el.clientHeight) / el.scrollHeight) * 100);
      if (pct > maxScrollRef.current) maxScrollRef.current = Math.min(100, pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // 진입 시점 초기값

    // 이탈 1회 발화(중복 방지) — 진입 경로(path) 보존, 1초 미만 체류는 노이즈로 스킵.
    const flush = () => {
      if (sentRef.current) return;
      const durationMs = Date.now() - enterRef.current;
      if (durationMs < 1000) return;
      sentRef.current = true;
      const scrollDepthPct = maxScrollRef.current;
      track('page_exit', scrollDepthPct > 0 ? { scrollDepthPct } : undefined, { path, durationMs });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      flush(); // 경로 변경 = 이탈
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [pathname]);

  return null;
}
