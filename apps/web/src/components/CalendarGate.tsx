'use client';

import { usePathname } from 'next/navigation';

// 키데이트 캘린더 배너를 날짜·일정 맥락 경로에서만 노출.
//  - /radar(미리 준비): 신청·마감 D-day
//  - /reservations(예약 정보): 예약 가능 일정
// 풀폭 유지를 위해 배너는 root layout(MainContainer 바깥)에 두고, 표시만 경로로 게이트한다.
// usePathname은 SSR에서도 현재 경로를 반환 → 깜빡임 없음.
// prefix 매칭 — /radar 허브 + 하위 상세(/radar/admission·/radar/summer) 모두 포함.
const CALENDAR_PREFIXES = ['/radar', '/reservations'];

export function CalendarGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const match = CALENDAR_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  return match ? <>{children}</> : null;
}
