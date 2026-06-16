'use client';

import { useState } from 'react';
import Link from 'next/link';

type NavItem = { href: string; label: string };

// 모바일(<md) 전용 햄버거 메뉴. 데스크탑 우측 nav는 layout에서 `hidden md:flex`로 가려지고,
// 좁은 화면에선 이 토글이 같은 메뉴 + 로그인을 드롭다운으로 펼친다(GNB 오버플로 방지).
export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="ml-auto md:hidden">
      <button
        type="button"
        aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink-2 transition hover:bg-grey-100"
      >
        <span className="relative block h-4 w-5" aria-hidden>
          <span
            className={`absolute left-0 block h-0.5 w-5 bg-current transition-all ${
              open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-0'
            }`}
          />
          <span
            className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 bg-current transition-all ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <span
            className={`absolute left-0 block h-0.5 w-5 bg-current transition-all ${
              open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-0'
            }`}
          />
        </span>
      </button>

      {open && (
        <>
          {/* 바깥 클릭 시 닫힘 (헤더 80px 아래 전체 덮음) */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 top-[80px] z-20 cursor-default bg-black/20"
          />
          <nav className="absolute inset-x-0 top-[80px] z-30 flex flex-col border-b border-line bg-white px-5 py-3 shadow-card">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-body font-medium text-ink-2 transition hover:bg-grey-100"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-grey-900 px-4 py-2.5 text-center text-body font-semibold text-white transition hover:bg-grey-700"
            >
              로그인
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
