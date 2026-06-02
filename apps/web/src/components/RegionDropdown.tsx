'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { REGIONS } from '@parenting-newsletter/shared';

type Props = {
  venueCountByRegion: Record<string, number>;
};

export function RegionDropdown({ venueCountByRegion }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('region');

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const navigate = (region: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (region) {
      params.set('region', region);
    } else {
      params.delete('region');
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <div
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="region-listbox"
        tabIndex={0}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className={`flex min-w-[140px] cursor-pointer items-center justify-between gap-2 rounded-card border bg-white px-3 py-1.5 text-small font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
          current
            ? 'border-blue-300 text-blue'
            : 'border-grey-300 text-ink-3 hover:border-grey-400'
        }`}
      >
        <span>{current ?? '지역 선택'}</span>
        <div className="flex flex-shrink-0 items-center gap-1.5">
          {current && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(null);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label="지역 필터 해제"
              className="flex h-4 w-4 items-center justify-center rounded-full bg-grey-100 text-ink-3 transition hover:bg-grey-300 hover:text-ink"
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path
                  d="M2 2l6 6M8 2l-6 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className={`transition ${open ? 'rotate-180' : ''} ${
              current ? 'text-blue-400' : 'text-ink-3'
            }`}
            aria-hidden
          >
            <path
              d="M2 4l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {open && (
        <div
          id="region-listbox"
          role="listbox"
          className="absolute left-0 z-20 mt-2 max-h-72 w-44 overflow-auto rounded-card border border-grey-200 bg-white p-1 shadow-lg"
        >
          {REGIONS.map((r) => {
            const count = venueCountByRegion[r] ?? 0;
            const isActive = current === r;
            const isDisabled = count === 0;
            return (
              <button
                key={r}
                type="button"
                onClick={() => navigate(r)}
                role="option"
                aria-selected={isActive}
                disabled={isDisabled}
                className={`flex w-full items-center justify-between rounded-btn px-3 py-2 text-left text-small font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue'
                    : isDisabled
                      ? 'cursor-not-allowed text-grey-300'
                      : 'text-ink-2 hover:bg-grey-50'
                }`}
              >
                <span>{r}</span>
                {count > 0 && <span className="text-micro text-ink-3">{count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
