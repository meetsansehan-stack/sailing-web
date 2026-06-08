import Link from 'next/link';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  // 페이지 번호 → href. 카테고리 등 다른 쿼리는 호출부에서 보존.
  hrefForPage: (page: number) => string;
};

// 현재 페이지 주변 + 처음/끝을 보여주고 나머지는 …로 접는 윈도잉.
function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('ellipsis');
    out.push(p);
    prev = p;
  }
  return out;
}

const cell = 'flex h-9 w-9 items-center justify-center rounded-btn';

export function Pagination({ currentPage, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const items = pageWindow(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="페이지 탐색">
      {hasPrev ? (
        <Link href={hrefForPage(currentPage - 1)} className={`${cell} text-ink-2 transition hover:bg-grey-100`} aria-label="이전 페이지">
          ‹
        </Link>
      ) : (
        <span className={`${cell} text-grey-300`} aria-disabled="true">
          ‹
        </span>
      )}

      {items.map((item, i) =>
        item === 'ellipsis' ? (
          <span key={`e${i}`} className={`${cell} text-ink-3`}>
            …
          </span>
        ) : item === currentPage ? (
          <span key={item} className={`${cell} bg-blue font-semibold text-white`} aria-current="page">
            {item}
          </span>
        ) : (
          <Link key={item} href={hrefForPage(item)} className={`${cell} text-ink-2 transition hover:bg-grey-100`}>
            {item}
          </Link>
        ),
      )}

      {hasNext ? (
        <Link href={hrefForPage(currentPage + 1)} className={`${cell} text-ink-2 transition hover:bg-grey-100`} aria-label="다음 페이지">
          ›
        </Link>
      ) : (
        <span className={`${cell} text-grey-300`} aria-disabled="true">
          ›
        </span>
      )}
    </nav>
  );
}
