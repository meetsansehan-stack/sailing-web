// 도서 컬렉션 enrichment — 수동 시드(제목+추천이유)에 표지·메타·링크를 자동 채움.
// 데이터 소유 → 기사 만료와 무관. Phase 2(파이프라인 자동추출)도 이 스크립트를 그대로 재사용.
//
// 채우는 것:
//   - 알라딘 TTB ItemSearch → coverImageUrl·isbn·author·publisher·pubYear + 구매 링크(제휴)
//   - 정보나루(선택) bookExist → 기본 도서관 소장·대출 확인 후 도서관 링크
//
// 실행: cd packages/db && node --env-file=.env --import tsx scripts/enrich-books.ts [--all]
//   --all 없으면 표지(coverImageUrl) 없는 책만 대상.
//
// 필요 env (.env.example 참조):
//   ALADIN_TTB_KEY            (필수) 알라딘 TTB 키 — https://blog.aladin.co.kr/openapi
//   DATA4LIBRARY_KEY          (선택) 도서관 정보나루 — https://www.data4library.kr
//   DATA4LIBRARY_LIB_CODE     (선택) 기준 도서관 코드 (예: 우리동네 대표관)
//   LIBRARY_URL_TEMPLATE      (선택) 도서관 검색 링크 템플릿, {isbn} 치환 (예: "https://.../search?isbn={isbn}")
import { prisma } from '../src/client';

type BookLink = { label: string; url: string; kind: 'library' | 'buy' };

const ALADIN_KEY = process.env.ALADIN_TTB_KEY;
const LIB_KEY = process.env.DATA4LIBRARY_KEY;
const LIB_CODE = process.env.DATA4LIBRARY_LIB_CODE;
const LIB_URL_TEMPLATE = process.env.LIBRARY_URL_TEMPLATE;

type AladinItem = {
  title: string;
  author: string;
  pubDate: string; // "2007-05-10"
  isbn13: string;
  cover: string; // 표지 이미지 URL
  publisher: string;
  link: string; // TTB 키 포함 상품 링크 = 제휴 구매 링크
};

// 알라딘 ItemSearch (제목 검색, 1건). 제휴 키가 link에 포함돼 그대로 구매(제휴) 링크가 됨.
async function fetchAladin(title: string): Promise<AladinItem | null> {
  const url =
    'http://www.aladin.co.kr/ttb/api/ItemSearch.aspx?' +
    new URLSearchParams({
      ttbkey: ALADIN_KEY!,
      Query: title,
      QueryType: 'Title',
      MaxResults: '1',
      start: '1',
      SearchTarget: 'Book',
      Cover: 'Big',
      output: 'js',
      Version: '20131101',
    }).toString();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { item?: AladinItem[] };
    return data.item?.[0] ?? null;
  } catch {
    return null;
  }
}

// 정보나루 bookExist — 기준 도서관에서 소장·대출 가능 여부. 가능하면 도서관 링크 추가.
async function fetchLibraryLink(isbn13: string): Promise<BookLink | null> {
  if (!LIB_KEY || !LIB_CODE || !isbn13) return null;
  const url =
    'https://data4library.kr/api/bookExist?' +
    new URLSearchParams({ authKey: LIB_KEY, libCode: LIB_CODE, isbn13, format: 'json' }).toString();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      response?: { result?: { hasBook?: string; loanAvailable?: string } };
    };
    const r = data.response?.result;
    if (r?.hasBook !== 'Y') return null;
    // 사용자용 링크 = 도서관 검색 템플릿(설정 시) 또는 정보나루 홈. 첫 실행 시 URL 형식 검증 권장.
    const linkUrl = LIB_URL_TEMPLATE
      ? LIB_URL_TEMPLATE.replace('{isbn}', isbn13)
      : `https://www.data4library.kr/`;
    const label = r.loanAvailable === 'Y' ? '도서관에서 빌리기' : '도서관 소장 확인';
    return { label, url: linkUrl, kind: 'library' };
  } catch {
    return null;
  }
}

async function main() {
  if (!ALADIN_KEY) {
    console.error(
      '⚠️  ALADIN_TTB_KEY 가 없습니다. 알라딘 TTB 키를 발급(https://blog.aladin.co.kr/openapi)해 .env에 넣고 다시 실행하세요.',
    );
    process.exit(1);
  }

  const all = process.argv.includes('--all');
  const books = await prisma.book.findMany({
    where: all ? {} : { coverImageUrl: null },
    select: { id: true, title: true, isbn: true },
  });
  console.log(`대상 ${books.length}권 (${all ? '전체' : '표지 없는 것만'})`);

  let enriched = 0;
  for (const b of books) {
    const item = await fetchAladin(b.title);
    if (!item) {
      console.log(`  · ${b.title} — 알라딘 검색 결과 없음 (스킵)`);
      continue;
    }
    const isbn13 = item.isbn13 || b.isbn || '';
    const links: BookLink[] = [];
    const libLink = await fetchLibraryLink(isbn13);
    if (libLink) links.push(libLink);
    if (item.link) links.push({ label: '알라딘', url: item.link, kind: 'buy' });

    await prisma.book.update({
      where: { id: b.id },
      data: {
        isbn: isbn13 || null,
        coverImageUrl: item.cover || null,
        author: item.author || undefined,
        publisher: item.publisher || null,
        pubYear: item.pubDate ? Number(item.pubDate.slice(0, 4)) || null : null,
        links: links.length ? links : undefined,
      },
    });
    enriched += 1;
    console.log(`  ✓ ${b.title} — 표지·메타${libLink ? '·도서관' : ''}·구매 채움`);
  }
  console.log(
    `\n완료: ${enriched}/${books.length}권 enrichment. 나머지는 폴백(📖) 유지.` +
      (LIB_KEY ? '' : '\n(정보나루 키 미설정 → 도서관 링크는 건너뜀.)'),
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
