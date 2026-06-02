'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CATEGORY_LABEL, type Category } from '@parenting-newsletter/shared';

type Props = {
  // 그날 등장한 카테고리별 기사 수 (0개 카테고리는 비노출)
  countByCategory: Partial<Record<Category, number>>;
  totalCount: number;
};

// 다중 선택(OR) 카테고리 필터. searchParams의 `category`를 콤마 구분 목록으로 관리.
// 드롭다운에서 항목을 토글 → 선택분이 우측에 취소(✕) 가능한 배지 버튼으로 나열.
export function CategoryFilterDropdown({ countByCategory, totalCount }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams.get('category');
  const selected = (raw ? raw.split(',').filter(Boolean) : []) as Category[];

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

  const apply = (next: Category[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.length > 0) {
      params.set('category', next.join(','));
    } else {
      params.delete('category');
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const toggle = (cat: Category) => {
    apply(selected.includes(cat) ? selected.filter((c) => c !== cat) : [...selected, cat]);
  };

  const presentCategories = (Object.keys(countByCategory) as Category[]).filter(
    (c) => (countByCategory[c] ?? 0) > 0,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* 드롭다운 트리거 */}
      <div ref={wrapperRef} className="relative inline-block">
        <div
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="category-listbox"
          tabIndex={0}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
          className={`flex cursor-pointer items-center justify-between gap-2 rounded-card border bg-white px-3.5 py-2 text-body font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
            selected.length ? 'border-blue-300 text-blue' : 'border-grey-300 text-ink-2 hover:border-grey-400'
          }`}
        >
          <span>{selected.length ? '카테고리 추가' : `전체 카테고리 ${totalCount}`}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className={`transition ${open ? 'rotate-180' : ''} ${selected.length ? 'text-blue-400' : 'text-ink-3'}`}
            aria-hidden
          >
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {open && (
          <div
            id="category-listbox"
            role="listbox"
            aria-multiselectable="true"
            className="absolute left-0 z-20 mt-2 max-h-80 w-52 overflow-auto rounded-card border border-grey-200 bg-white p-1 shadow-lg"
          >
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => apply([])}
                className="mb-1 flex w-full items-center rounded-btn px-3 py-2 text-left text-body font-medium text-ink-3 transition hover:bg-grey-50"
              >
                전체 보기 (필터 해제)
              </button>
            )}
            {presentCategories.map((cat) => {
              const count = countByCategory[cat] ?? 0;
              const isActive = selected.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggle(cat)}
                  role="option"
                  aria-selected={isActive}
                  className={`flex w-full items-center justify-between gap-2 rounded-btn px-3 py-2 text-left text-body font-medium transition ${
                    isActive ? 'bg-blue-50 text-blue' : 'text-ink-2 hover:bg-grey-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border ${
                        isActive ? 'border-blue-500 bg-blue-500 text-white' : 'border-grey-300'
                      }`}
                      aria-hidden
                    >
                      {isActive && (
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    {CATEGORY_LABEL[cat]}
                  </span>
                  <span className="text-small text-ink-3">{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 선택된 카테고리 배지 (우측 나열, 취소 가능) */}
      {selected.map((cat) => (
        <span
          key={cat}
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 py-1 pl-3 pr-1.5 text-body font-medium text-blue"
        >
          <span>{CATEGORY_LABEL[cat]}</span>
          <span className="text-small text-blue-400">{countByCategory[cat] ?? 0}</span>
          <button
            type="button"
            onClick={() => toggle(cat)}
            aria-label={`${CATEGORY_LABEL[cat]} 필터 해제`}
            className="flex h-4 w-4 items-center justify-center rounded-full text-blue-400 transition hover:bg-blue-200 hover:text-blue"
          >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}
