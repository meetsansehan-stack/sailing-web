'use client';

import { track } from '@/src/lib/analytics';

// 외부(원문·예매 등) 링크 — 클릭 시 outbound_click 익명 이벤트 발화. intent·신뢰 신호 측정.
// page_view로는 못 잡는 "사이트 밖으로 나간 행동". meta로 발생 경로·대상 라벨만(PII 0).
export default function OutboundLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label?: string; // 어떤 버튼인지 구분용 라벨 (예: 'article_source', 'event_reserve')
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => track('outbound_click', label ? { label } : undefined)}
    >
      {children}
    </a>
  );
}
