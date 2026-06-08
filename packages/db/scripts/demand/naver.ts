// 수요 발굴 — 네이버 공식 API 2개 클라이언트 (Step 2)
//   ① 검색광고 키워드도구: 연관어 + 절대 월검색량 (HMAC-SHA256 서명)
//   ② 데이터랩 검색어트렌드: 연령·성별·시계열(시즌성 지수)
// 키는 .env (NAVER_AD_*, NAVER_DATALAB_*). 값은 절대 로깅하지 않음.

import crypto from 'node:crypto';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── ① 검색광고 키워드도구 ──────────────────────────────────────────────
export type KeywordToolRow = {
  relKeyword: string;
  monthlyPcQcCnt: number; // 월 PC 검색수 (정규화: "< 10" → 5)
  monthlyMobileQcCnt: number; // 월 모바일 검색수
  monthlyTotalQcCnt: number; // PC+MO 합
  compIdx: string; // 경쟁정도 (낮음/중간/높음)
};

// 네이버는 검색량 10 미만을 "< 10" 문자열로 줌 → 보수적으로 5로 환산
function parseCount(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    if (v.includes('<')) return 5;
    const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export async function keywordTool(hintKeyword: string): Promise<KeywordToolRow[]> {
  const customerId = process.env.NAVER_AD_CUSTOMER_ID;
  const apiKey = process.env.NAVER_AD_API_KEY;
  const secret = process.env.NAVER_AD_SECRET_KEY;
  if (!customerId || !apiKey || !secret) {
    throw new Error('검색광고 키 누락 (NAVER_AD_CUSTOMER_ID/API_KEY/SECRET_KEY)');
  }
  const base = 'https://api.searchad.naver.com';
  const path = '/keywordstool';
  const method = 'GET';
  const ts = Date.now().toString();
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${ts}.${method}.${path}`)
    .digest('base64');
  // 키워드도구는 공백 제거된 hintKeyword를 권장
  const hint = hintKeyword.replace(/\s+/g, '');
  const url = `${base}${path}?hintKeywords=${encodeURIComponent(hint)}&showDetail=1`;
  const res = await fetch(url, {
    method,
    headers: {
      'X-Timestamp': ts,
      'X-API-KEY': apiKey,
      'X-Customer': customerId,
      'X-Signature': sig,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    const err: any = new Error(`검색광고 ${res.status}: ${body.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const j: any = await res.json();
  const list: any[] = j.keywordList ?? [];
  return list.map((k) => {
    const pc = parseCount(k.monthlyPcQcCnt);
    const mo = parseCount(k.monthlyMobileQcCnt);
    return {
      relKeyword: k.relKeyword,
      monthlyPcQcCnt: pc,
      monthlyMobileQcCnt: mo,
      monthlyTotalQcCnt: pc + mo,
      compIdx: k.compIdx ?? '',
    };
  });
}

// ── ② 데이터랩 검색어트렌드 ────────────────────────────────────────────
export type DataLabPoint = { period: string; ratio: number };
export type DataLabResult = { keyword: string; data: DataLabPoint[] };

type DataLabOpts = {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  timeUnit?: 'date' | 'week' | 'month';
  ages?: string[]; // '1'..'11' (연령 밴드 코드)
  gender?: 'm' | 'f';
};

// keywordGroups 최대 5개/요청 → 호출자가 5개씩 배치해 넣음
export async function datalab(
  groups: { groupName: string; keywords: string[] }[],
  opts: DataLabOpts,
): Promise<DataLabResult[]> {
  const clientId = process.env.NAVER_DATALAB_CLIENT_ID;
  const clientSecret = process.env.NAVER_DATALAB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('데이터랩 키 누락 (NAVER_DATALAB_CLIENT_ID/SECRET)');
  }
  if (groups.length > 5) throw new Error('데이터랩 keywordGroups는 최대 5개');
  const body: any = {
    startDate: opts.startDate,
    endDate: opts.endDate,
    timeUnit: opts.timeUnit ?? 'month',
    keywordGroups: groups,
  };
  if (opts.ages) body.ages = opts.ages;
  if (opts.gender) body.gender = opts.gender;
  const res = await fetch('https://openapi.naver.com/v1/datalab/search', {
    method: 'POST',
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(`데이터랩 ${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const j: any = await res.json();
  return (j.results ?? []).map((r: any) => ({
    keyword: r.title,
    data: (r.data ?? []).map((d: any) => ({ period: d.period, ratio: d.ratio })),
  }));
}

// 호출 간 예의상 간격 (네이버 일일 쿼터 보호)
export const apiDelay = sleep;
