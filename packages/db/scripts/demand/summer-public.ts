// 수요 발굴 — 6~7월 출시 윈도우 × 공공기관 포커스
//
// Sailing 정체성 = 교육·신뢰 출처(국공립·지자체·도서관·박물관·과학관) 통합 제공.
// 상업 시설(키즈풀빌라·카페) 제외, 공공기관 여름 수요만 3중 필터(절대량·여름추세·부모 skew).
//
// 실행: (packages/db) node --env-file=.env --import tsx scripts/demand/summer-public.ts

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { keywordTool, datalab, apiDelay } from './naver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_MD = path.join(__dirname, '..', '..', '..', '..', 'docs', 'DEMAND_PUBLIC.md');
const START = '2025-06-01', END = '2026-05-31';
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const TARGET = { gender: 'f', ages: ['4','5','6','7'] };

// 공공기관 포커스 후보 (국공립·지자체·도서관·박물관·과학관·자연·공연)
const BASKETS: string[][] = [
  ['어린이박물관', '과학관', '국립과천과학관', '어린이 과학관', '자연사박물관'],
  ['어린이도서관', '도서관 프로그램', '국립어린이청소년도서관', '도서관 여름방학', '책놀이'],
  ['여름방학 프로그램', '여름방학 특강', '무료 체험', '어린이 체험', '방학 프로그램'],
  ['수목원', '식물원', '서울대공원', '어린이대공원', '생태체험'],
  ['어린이 공연', '어린이 뮤지컬', '어린이 연극', '인형극', '키즈 전시'],
  ['현장체험학습', '체험학습', '견학', '천문대', '문화센터'],
  // 공공·무료 물놀이 (지자체 운영, 구·시마다 흩어짐 = 통합 가치 큼)
  ['무료 물놀이장', '바닥분수', '물놀이터', '한강 수영장', '어린이 수영장'],
];

const n = (s: string) => s.replace(/\s+/g, '');

function profileFrom(results: any[], kw: string) {
  const r = results.find((x) => x.keyword === kw);
  const by: Record<string, number> = {};
  for (const m of MONTHS) by[m] = 0;
  for (const d of r?.data ?? []) by[d.period.slice(5, 7)] = d.ratio;
  const vals = MONTHS.map((m) => by[m]);
  const sum = vals.reduce((a, b) => a + b, 0);
  const peakVal = Math.max(...vals);
  return { by, mean: sum / 12, peak: MONTHS[vals.indexOf(peakVal)], summerShare: sum > 0 ? (by['06'] + by['07'] + by['08']) / sum : 0 };
}

async function main() {
  console.log(`공공기관 × 6~7월 딥다이브 — 후보 ${BASKETS.flat().length}개\n`);
  const rows: any[] = [];
  for (const basket of BASKETS) {
    const vol: Record<string, { v: number; c: string }> = {};
    for (const kw of basket) {
      try { const kt = await keywordTool(kw); const s = kt.find((r) => n(r.relKeyword) === n(kw)); vol[kw] = { v: s?.monthlyTotalQcCnt ?? 0, c: s?.compIdx ?? '-' }; }
      catch { vol[kw] = { v: 0, c: '-' }; }
      await apiDelay(220);
    }
    try {
      const groups = basket.map((k) => ({ groupName: k, keywords: [k] }));
      const all = await datalab(groups, { startDate: START, endDate: END, timeUnit: 'month' }); await apiDelay(300);
      const tgt = await datalab(groups, { startDate: START, endDate: END, timeUnit: 'month', ...TARGET }); await apiDelay(300);
      const sumAll = basket.reduce((s, k) => s + profileFrom(all, k).mean, 0);
      const sumTgt = basket.reduce((s, k) => s + profileFrom(tgt, k).mean, 0);
      for (const kw of basket) {
        const p = profileFrom(all, kw), pt = profileFrom(tgt, kw);
        const shAll = sumAll > 0 ? p.mean / sumAll : 0, shTgt = sumTgt > 0 ? pt.mean / sumTgt : 0;
        rows.push({ kw, juneVol: vol[kw].v, comp: vol[kw].c, jun: p.by['06'], jul: p.by['07'], peak: p.peak, summerShare: p.summerShare, skew: shAll > 0 ? shTgt / shAll : 0 });
      }
    } catch (e: any) { console.log(`\n  실패(${basket.join(',')}): ${e.message}`); }
    process.stdout.write('.');
  }
  const scored = rows.map((r) => ({ ...r, summerPeak: ['06','07','08'].includes(r.peak), score: r.juneVol * Math.max(0.4, Math.min(1.6, r.skew)) }))
    .sort((a, b) => b.score - a.score);
  fs.writeFileSync(REPORT_MD, render(scored));
  console.log('\n\n★ 공공기관 6~7월 출시 표적 (절대량×적합도):');
  for (const r of scored.slice(0, 14)) {
    const tag = r.skew >= 1.15 ? '✅' : r.skew <= 0.85 ? '⚠️' : '·';
    console.log(`  ${tag} ${r.kw.padEnd(14)} 6월 ${String(r.juneVol).padStart(7)}  skew ${r.skew.toFixed(2)}  피크 ${parseInt(r.peak)}월`);
  }
  console.log(`\n📄 ${path.relative(process.cwd(), REPORT_MD)}`);
}

function render(rows: any[]): string {
  const L = ['# 수요 발굴 — 6~7월 출시 × 공공기관 포커스', '',
    '> Sailing 정체성(교육·신뢰 출처) 정렬: 국공립·지자체·도서관·박물관·과학관 여름 수요만. 상업시설 제외.',
    '> 6월 절대량 × 7월 추세 × 부모 skew(여성25~44). 자동 생성 `scripts/demand/summer-public.ts`.', '',
    '| 키워드 | 6월 검색량 | 7월 추세 | 피크월 | 여름집중 | 우리유저 skew | 경쟁 |', '|---|---|---|---|---|---|---|'];
  for (const r of rows) {
    const trend = r.jul > r.jun * 1.1 ? `↑ ${r.jun.toFixed(0)}→${r.jul.toFixed(0)}` : r.jul < r.jun * 0.9 ? `↓ ${r.jun.toFixed(0)}→${r.jul.toFixed(0)}` : `→ ${r.jul.toFixed(0)}`;
    const sk = r.skew >= 1.15 ? `${r.skew.toFixed(2)} ✅` : r.skew <= 0.85 ? `${r.skew.toFixed(2)} ⚠️` : r.skew.toFixed(2);
    L.push(`| ${r.kw} | ${r.juneVol.toLocaleString()} | ${trend} | ${parseInt(r.peak)}월${r.summerPeak ? ' ☀' : ''} | ${(r.summerShare * 100).toFixed(0)}% | ${sk} | ${r.comp} |`);
  }
  L.push('', '> ☀=여름(6~8월) 피크. skew✅=부모 과대표. 공공기관 정보 통합 = Sailing 차별점(흩어진 국공립·지자체·도서관 일정을 한곳에).');
  return L.join('\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
