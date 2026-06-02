import { prisma } from '@parenting-newsletter/db';
import type { DateCheck, DateVerdict } from '@parenting-newsletter/shared';

// qa v0 — 날짜 grounded 검증 (LLM 없이, 지금 실행 가능).
// 기사 원문 URL을 다시 가져와 deadline/event 날짜가 그 페이지에 *실재*하는지 코드로 대조.
// 'verified' = 강한 형식(년월일·M월D일·Y.MM.DD 등)으로 원문에서 발견 → 신뢰.
// 'unconfirmed' = 못 찾음/원문 fetch 실패 → 운영자 클릭 감사 대상(⚠️).
// 설계 바이어스: 애매하면 'unconfirmed'로. false-verified(틀린데 통과)가 가장 위험하므로 보수적으로 판정.
// 6/15 API 풀리면 LLM 판단 레이어(애매 포맷·"날짜는 있으나 다른 의미")를 agents/qa에 얹어 업그레이드.
// DateCheck/DateVerdict 타입은 @parenting-newsletter/shared 단일 소스.

const FETCH_TIMEOUT_MS = 8000;

// 날짜를 한국어/숫자 강한 포맷 후보들로. 공백 제거 기준으로 비교(페이지 띄어쓰기 차이 흡수).
// 약한 포맷(연도 없는 M.D, M/D)은 오탐 위험이 커서 제외 — 보수적 판정.
function strongDateCandidates(d: Date): string[] {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const mm = String(m).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return [
    `${y}년${m}월${day}일`,
    `${m}월${day}일`,
    `${y}.${mm}.${dd}`,
    `${y}.${m}.${day}`,
    `${y}-${mm}-${dd}`,
    `${y}/${mm}/${dd}`,
  ].map(stripWhitespace);
}

function stripWhitespace(s: string): string {
  return s.replace(/\s+/g, '');
}

function pageMentionsDate(normalizedNoSpace: string, d: Date): boolean {
  return strongDateCandidates(d).some((cand) => normalizedNoSpace.includes(cand));
}

async function fetchPageText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SailingFactCheck/0.1)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // 태그 제거 후 공백 정규화. 매칭은 호출부에서 공백 제거 기준으로 수행.
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type DatedArticle = {
  id: string;
  url: string;
  deadline: Date | null;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
};

export async function verifyArticleDates(article: DatedArticle): Promise<DateCheck> {
  const text = await fetchPageText(article.url);
  const fetchOk = text !== null;
  const norm = text ? stripWhitespace(text) : '';
  const check: DateCheck = { checkedAt: new Date().toISOString(), fetchOk };

  const verdict = (d: Date | null): DateVerdict | undefined => {
    if (!d) return undefined;
    if (!fetchOk) return 'unconfirmed';
    return pageMentionsDate(norm, d) ? 'verified' : 'unconfirmed';
  };

  const dl = verdict(article.deadline);
  const es = verdict(article.eventStartDate);
  const ee = verdict(article.eventEndDate);
  if (dl) check.deadline = dl;
  if (es) check.eventStartDate = es;
  if (ee) check.eventEndDate = ee;
  return check;
}

// 한 이슈(날짜)의 기사들 중 날짜를 가진 것만 검증해 Article.dateCheck에 기록.
export async function runFactCheckForIssue(issueDateStr: string): Promise<{
  issueDate: string;
  checked: number;
  results: Array<{ id: string; check: DateCheck }>;
}> {
  const issueDate = new Date(issueDateStr);
  const articles = await prisma.article.findMany({
    where: { issueDate },
    select: {
      id: true,
      url: true,
      deadline: true,
      eventStartDate: true,
      eventEndDate: true,
    },
  });

  const results: Array<{ id: string; check: DateCheck }> = [];
  for (const a of articles) {
    if (!a.deadline && !a.eventStartDate && !a.eventEndDate) continue; // 검증할 날짜 없음
    const check = await verifyArticleDates(a);
    await prisma.article.update({ where: { id: a.id }, data: { dateCheck: check } });
    results.push({ id: a.id, check });
  }
  return { issueDate: issueDateStr, checked: results.length, results };
}
