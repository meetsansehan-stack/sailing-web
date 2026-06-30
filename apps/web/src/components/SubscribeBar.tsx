'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const LS_SUBSCRIBED = 'sailing_subscribed';
const LS_BAR_CLOSED = 'sailing_bar_closed';

export default function SubscribeBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const subscribed = localStorage.getItem(LS_SUBSCRIBED) === '1';
    const closed = localStorage.getItem(LS_BAR_CLOSED) === '1';
    if (!subscribed && !closed) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(LS_BAR_CLOSED, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-grey-900 shadow-[0_-4px_24px_rgba(0,0,0,0.18)]">
      <div className="max-w-container mx-auto flex items-center gap-4 px-5 py-4 sm:px-6">
        {/* 아이콘 */}
        <span className="shrink-0 text-xl hidden sm:block">⛵</span>
        <div className="flex-1 min-w-0">
          <p className="text-body font-bold text-white truncate">
            매주 화요일, 세일링 레터 받기
          </p>
          <p className="text-small text-grey-400 hidden sm:block mt-0.5">
            육아 정책·신청·행사를 골라 이메일로 보내드려요.
          </p>
        </div>
        <Link
          href="/subscribe"
          className="shrink-0 rounded-btn bg-blue px-5 py-2.5 text-body font-bold text-white transition hover:bg-blue-400 whitespace-nowrap"
        >
          레터 구독하기
        </Link>
        <button
          onClick={dismiss}
          aria-label="닫기"
          className="shrink-0 text-grey-500 hover:text-grey-300 p-1 transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
