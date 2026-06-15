'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/src/lib/analytics';

// 페이지뷰 익명 측정 — 경로 변경마다 1회. 레이아웃에 1개 마운트.
export default function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    track('page_view');
  }, [pathname]);
  return null;
}
