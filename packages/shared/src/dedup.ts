// 제목 근접중복(near-duplicate) 판정 — 같은 뉴스가 다른 URL·매체로 들어올 때 잡는다.
//
// curation의 URL 완전일치 dedup(@@unique([issueDate,url]) + cross-day URL 제외)이 못 잡는
// 케이스를 보강한다: 같은 사건을 A매체·B매체가 각자 다른 URL로 올리면 URL은 다르지만 같은 뉴스다.
// 결정적(LLM 비용 0)이라 cross-day(LLM이 과거 발행분을 못 봄)에서 특히 가치가 크다.
//
// 메트릭 = 정규화 후 문자 bigram Jaccard. 한국어는 형태소 분석 없이 토큰화가 어려워 문자 n-gram이
// 어순·조사 변화에 강건하다(국어 near-dup의 표준 휴리스틱). 임계값은 보수적으로 둔다 —
// false positive(실기사를 중복으로 오인해 버림)가 누락보다 비싸므로, 명백한 중복만 잡고
// 애매한 건 curation LLM 선별에 맡긴다.

// 말미 매체명 패턴 (" - 베이비뉴스", " | 한겨레", " · 연합뉴스"). 구분자 뒤 공백 없는 짧은 토큰만.
const SOURCE_SUFFIX = /\s[-|–—·<>]\s*\S{1,12}$/;

/** 비교용 제목 정규화 — 대괄호·소괄호·낫표 내용, 말미 매체명, 공백·구두점 제거 후 소문자화. */
export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[[(〈「][^\])〉」]*[\])〉」]/g, '') // [단독]·(종합)·〈…〉·「…」 내용 제거
    .replace(SOURCE_SUFFIX, '') // 말미 매체명 1개 제거
    .replace(/[\s·​<>〈〉「」"'""'`,.!?:;…\-–—_/\\()[\]{}]/g, '')
    .trim();
}

function bigrams(s: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i += 1) set.add(s.slice(i, i + 2));
  return set;
}

/** 두 제목의 유사도(0~1). 정규화 후 문자 bigram Jaccard. 완전일치(정규화 기준)=1. */
export function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const ba = bigrams(na);
  const bb = bigrams(nb);
  if (ba.size === 0 || bb.size === 0) return 0; // 1글자 제목 등 — 완전일치는 위에서 처리됨
  let inter = 0;
  for (const g of ba) if (bb.has(g)) inter += 1;
  const union = ba.size + bb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * 근접중복 판정 임계값. 실 research 후보 제목 4배치(06-12~14)로 캘리브레이션(2026-06-15):
 * 같은 사건 다른 매체 쌍 = 0.45~0.78, 서로 다른 사건(다른 URL) 최고 = 0.31 (도서관 vs
 * 도서연구회 추천도서). 0.31↔0.45 사이 갭 중앙인 0.42로 둬서 어순 재배치된 중복(토스뱅크
 * 체크카드 0.45)까지 잡되 별개 기사는 보존. 운영하며 누락 보이면 하향, 오제거 보이면 상향.
 */
export const TITLE_DUP_THRESHOLD = 0.42;

/** a와 b가 근접중복 제목인지. */
export function isNearDuplicateTitle(a: string, b: string, threshold = TITLE_DUP_THRESHOLD): boolean {
  return titleSimilarity(a, b) >= threshold;
}
