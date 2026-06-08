// 수요 발굴 — 6~7월 출시 윈도우 딥다이브
//
// 출시(6~7월)에 실제 유입될 표적: ① 6월 절대량(키워드도구=현재 스냅샷) ② 7월 추세·여름 집중도
// (데이터랩) ③ 우리 유저 적합도 skew(여성25~44). 셋 조인 → "여름 트래픽 크고 진짜 부모" 추출.
//
// 실행: (packages/db) node --env-file=.env --import tsx scripts/demand/summer.ts

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { keywordTool, datalab, apiDelay } from './naver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_MD = path.join(__dirname, '..', '..', '..', '..', 'docs', 'DEMAND_SUMMER.md');
const START = '2025-06-01', END = '2026-05-31';
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const TARGET = { gender: 'f', ages: ['4','5','6','7'] };

// 출시 윈도우 후보 — 여름 놀이·체험·공연·방학·여행 + 아이명시 나들이 + 대조군
const BASKETS: string[][] = [
  ['워터파크', '물놀이장', '아기수영장', '키즈 풀빌라', '실내놀이터'],
  ['키즈카페', '무인키즈카페', '베이비카페', '어린이박물관', '놀이공원'],
  ['서울아이랑갈만한곳', '아이와 가볼만한곳', '6월가볼만한곳', '데이트가볼만한곳', '아이랑 갈만한곳'],
  ['어린이 뮤지컬', '어린이 공연', '어린이 연극', '키즈 뮤지컬', '아쿠아리움'],
  ['여름방학', '여름방학 프로그램', '여름방학 특강', '여름 캠프', '방학 숙제'],
  ['아이와 여행', '가평 키즈펜션', '키즈펜션', '풀빌라', '캠핑장'],
];

const n = (s: string) => s.replace(/\s+/g, '');

function profileFrom(results: any[], kw: string) {
  const r = results.find((x) => x.keyword === kw);
  const by: Record<string, number> = {};
  for (const m of MONTHS) by[m] = 0;
  for (const d of r?.data ?? []) by[d.period.slice(5, 7)] = d.ratio;
  const vals = MONTHS.map((m) => by[m]);
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / 12;
  const peakVal = Math.max(...vals);
  const peak = MONTHS[vals.indexOf(peakVal)];
  const summerShare = sum > 0 ? (by['06'] + by['07'] + by['08']) / sum : 0;
  return { by, mean, peak, peakVal, summerShare };
}

type Row = {
  kw: string; juneVol: number; comp: string;
  jun: number; jul: number; peak: string; summerShare: number; skew: number;
};

async function main() {
  console.log(`6~7월 출시 딥다이브 — 후보 ${BASKETS.flat().length}개\n`);
  const rows: Row[] = [];
  for (const basket of BASKETS) {
    // 절대량(키워드도구)
    const vol: Record<string, { v: number; c: string }> = {};
    for (const kw of basket) {
      try {
        const kt = await keywordTool(kw);
        const self = kt.find((r) => n(r.relKeyword) === n(kw));
        vol[kw] = { v: self?.monthlyTotalQcCnt ?? 0, c: self?.compIdx ?? '-' };
      } catch { vol[kw] = { v: 0, c: '-' }; }
      await apiDelay(220);
    }
    // 데이터랩: 전체 + 타겟
    try {
      const groups = basket.map((k) => ({ groupName: k, keywords: [k] }));
      const all = await datalab(groups, { startDate: START, endDate: END, timeUnit: 'month' });
      await apiDelay(300);
      const tgt = await datalab(groups, { startDate: START, endDate: END, timeUnit: 'month', ...TARGET });
      await apiDelay(300);
      const sumAll = basket.reduce((s, k) => s + profileFrom(all, k).mean, 0);
      const sumTgt = basket.reduce((s, k) => s + profileFrom(tgt, k).mean, 0);
      for (const kw of basket) {
        const p = profileFrom(all, kw);
        const pt = profileFrom(tgt, kw);
        const shAll = sumAll > 0 ? p.mean / sumAll : 0;
        const shTgt = sumTgt > 0 ? pt.mean / sumTgt : 0;
        rows.push({
          kw, juneVol: vol[kw].v, comp: vol[kw].c,
          jun: p.by['06'], jul: p.by['07'], peak: p.peak, summerShare: p.summerShare,
          skew: shAll > 0 ? shTgt / shAll : 0,
        });
      }
    } catch (e: any) { console.log(`\n  데이터랩 실패(${basket.join(',')}): ${e.message}`); }
    process.stdout.write('.');
  }

  // 출시 표적 점수 = 6월 절대량 × 적합도(skew, 0.5 하한) — 여름 피크 우대
  const scored = rows.map((r) => ({
    ...r,
    summerPeak: ['06', '07', '08'].includes(r.peak),
    score: r.juneVol * Math.max(0.4, Math.min(1.6, r.skew)),
  })).sort((a, b) => b.score - a.score);

  fs.writeFileSync(REPORT_MD, render(scored));
  console.log('\n\n★ 6~7월 출시 유입 표적 (절대량×적합도):');
  for (const r of scored.slice(0, 12)) {
    const tag = r.skew >= 1.15 ? '✅' : r.skew <= 0.85 ? '⚠️' : '·';
    console.log(`  ${tag} ${r.kw.padEnd(12)} 6월 ${String(r.juneVol).padStart(7)}  skew ${r.skew.toFixed(2)}  피크 ${parseInt(r.peak)}월`);
  }
  console.log(`\n📄 ${path.relative(process.cwd(), REPORT_MD)}`);
}

function render(rows: any[]): string {
  const L: string[] = [];
  L.push('# 수요 발굴 — 6~7월 출시 윈도우 딥다이브');
  L.push('');
  L.push('> 6월 절대 검색량(키워드도구) × 7월 추세·여름집중도(데이터랩) × 우리 유저 적합도 skew(여성25~44).');
  L.push('> 출시 표적 = 여름에 트래픽 크고 + 진짜 부모가 치는 키워드. 자동 생성 `scripts/demand/summer.ts`.');
  L.push('');
  L.push('| 키워드 | 6월 검색량 | 7월 추세 | 피크월 | 여름집중 | 우리유저 skew | 경쟁 |');
  L.push('|---|---|---|---|---|---|---|');
  for (const r of rows) {
    const trend = r.jul > r.jun * 1.1 ? `↑ ${r.jun.toFixed(0)}→${r.jul.toFixed(0)}` : r.jul < r.jun * 0.9 ? `↓ ${r.jun.toFixed(0)}→${r.jul.toFixed(0)}` : `→ ${r.jul.toFixed(0)}`;
    const sk = r.skew >= 1.15 ? `${r.skew.toFixed(2)} ✅` : r.skew <= 0.85 ? `${r.skew.toFixed(2)} ⚠️` : r.skew.toFixed(2);
    L.push(`| ${r.kw} | ${r.juneVol.toLocaleString()} | ${trend} | ${parseInt(r.peak)}월${r.summerPeak ? ' ☀' : ''} | ${(r.summerShare * 100).toFixed(0)}% | ${sk} | ${r.comp} |`);
  }
  L.push('');
  L.push('> 추세=데이터랩 지수(묶음내). ☀=여름(6~8월) 피크. skew✅=부모 과대표·⚠️=일반인 노이즈. 6월 검색량은 직전1개월 절대(출시월 근사).');
  return L.join('\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
