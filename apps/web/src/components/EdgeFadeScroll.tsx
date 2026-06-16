'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

// 가로 스크롤 컨테이너에 "더 있음" visual cue를 더하는 래퍼.
//  - 스크롤 위치를 감지해 좌/우 끝에 페이드(from-white)를 켬/끔.
//  - 시작이면 좌측 페이드 off, 끝이면 우측 페이드 off → 더 볼 게 있는 방향만 표시.
//  - 콘텐츠가 다 들어가면(데스크톱 등) 양쪽 다 off → 자동으로 사라짐(미디어쿼리 불필요).
export function EdgeFadeScroll({
  children,
  className = '',
  containerClassName = '',
}: {
  children: ReactNode;
  className?: string; // 스크롤 요소(flex·gap·overflow-x-auto 등)
  containerClassName?: string; // 바깥 래퍼(여백 등)
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  return (
    <div className={`relative ${containerClassName}`}>
      <div ref={ref} onScroll={update} className={className}>
        {children}
      </div>
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 ${
          atStart ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 ${
          atEnd ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}
