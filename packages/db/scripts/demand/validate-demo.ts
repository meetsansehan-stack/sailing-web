// 수요 발굴 — niche 후보 연령·성별 검증 (우리 타겟 = 0~8 부모 ≈ 30~44 여성)
//
// 방법(정규화 함정 우회): 같은 5개 묶음을 ①무필터 ②타겟(여성·25~44) 로 두 번 호출.
//   각 키워드의 '묶음 내 점유율' = mean_k / Σmean. 같은 요청 내 비율이라 묶음 스케일 상쇄 →
//   share_target / share_all = skew. >1 = 타겟에 과대표(우리 수요), <1 = 타겟서 빠짐(노이즈).
//
// 실행: (packages/db) node --env-file=.env --import tsx scripts/demand/validate-demo.ts

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { datalab, apiDelay } from './naver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_MD = path.join(__dirname, '..', '..', '..', '..', 'docs', 'DEMAND_DEMO.md');

const START = '2025-06-01';
const END = '2026-05-31';
const TARGET_AGES = ['4', '5', '6', '7']; // 25~29,30~34,35~39,40~44
const TARGET_GENDER = 'f';

// 검증 묶음(각 5개) — niche 테마별 + 검증용 대조군(데이트가볼만한곳=타겟 약해야 정상)
const BASKETS: string[][] = [
  ['어린이박물관', '데이트가볼만한곳', '일산가볼만한곳', '서울아이랑갈만한곳', '6월가볼만한곳'],
  ['아이돌봄사', '베이비시터', '아이돌보미', '늘봄', '처음학교로'],
  ['한글맞춤법', '전래동화', '받아쓰기', '미취학아동', '편식'],
  ['무인키즈카페', '대형키즈카페', '베이비카페', '아기수영장', '물놀이장'],
  ['아기옷브랜드', '아동복', '놀이방매트', '신생아바디수트', '어린이도서관'],
  ['어린이공연', '놀이공원', '초등사자성어', '동탄가볼만한곳', '신생아'],
];

type Row = { keyword: string; shareAll: number; shareTarget: number; skew: number };

function meanOf(results: any[], kw: string): number {
  const r = results.find((x) => x.keyword === kw);
  const vals = (r?.data ?? []).map((d: any) => d.ratio);
  return vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
}

async function shares(basket: string[], opts: any): Promise<Record<string, number>> {
  const groups = basket.map((k) => ({ groupName: k, keywords: [k] }));
  const res = await datalab(groups, { startDate: START, endDate: END, timeUnit: 'month', ...opts });
  const means: Record<string, number> = {};
  let sum = 0;
  for (const k of basket) { means[k] = meanOf(res, k); sum += means[k]; }
  const sh: Record<string, number> = {};
  for (const k of basket) sh[k] = sum > 0 ? means[k] / sum : 0;
  return sh;
}

async function main() {
  console.log(`연령·성별 검증 — 타겟 = 여성 25~44, 묶음 ${BASKETS.length}개\n`);
  const rows: Row[] = [];
  for (const basket of BASKETS) {
    try {
      const shAll = await shares(basket, {});
      await apiDelay(300);
      const shTgt = await shares(basket, { gender: TARGET_GENDER, ages: TARGET_AGES });
      await apiDelay(300);
      for (const k of basket) {
        const skew = shAll[k] > 0 ? shTgt[k] / shAll[k] : 0;
        rows.push({ keyword: k, shareAll: shAll[k], shareTarget: shTgt[k], skew });
      }
      process.stdout.write('.');
    } catch (e: any) {
      console.log(`\n  묶음 실패(${basket.join(',')}): ${e.message}`);
    }
  }
  rows.sort((a, b) => b.skew - a.skew);
  fs.writeFileSync(REPORT_MD, render(rows));
  console.log('\n\n타겟(30~44여) 과대표 순위:');
  for (const r of rows) {
    const tag = r.skew >= 1.15 ? '✅우리수요' : r.skew <= 0.85 ? '⚠️노이즈' : '·중립';
    console.log(`  ${r.skew.toFixed(2)}x  ${r.keyword.padEnd(12)} ${tag}`);
  }
  console.log(`\n📄 ${path.relative(process.cwd(), REPORT_MD)}`);
}

function render(rows: Row[]): string {
  const L: string[] = [];
  L.push('# 수요 발굴 — niche 후보 연령·성별 검증');
  L.push('');
  L.push(`> 타겟 = **여성 25~44세**(0~8 부모 근사). skew = 타겟 점유율 ÷ 전체 점유율.`);
  L.push('> skew > 1 = 우리 유저에 과대표(진짜 수요), < 1 = 타겟서 빠짐(데이트·일반인 등 노이즈).');
  L.push('> 대조군 "데이트가볼만한곳"이 낮게 나오면 방법 검증 OK. 자동 생성 `scripts/demand/validate-demo.ts`.');
  L.push('');
  L.push('| 키워드 | 타겟 skew | 전체 점유 | 타겟 점유 | 판정 |');
  L.push('|---|---|---|---|---|');
  for (const r of rows) {
    const tag = r.skew >= 1.15 ? '✅ 우리 수요' : r.skew <= 0.85 ? '⚠️ 노이즈' : '· 중립';
    L.push(`| ${r.keyword} | ${r.skew.toFixed(2)}x | ${(r.shareAll * 100).toFixed(1)}% | ${(r.shareTarget * 100).toFixed(1)}% | ${tag} |`);
  }
  L.push('');
  L.push('> ※ skew는 *묶음 내 상대* 비교라 같은 묶음끼리 가장 의미 있음. 절대 affinity는 데이터랩 한계상 근사치.');
  return L.join('\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
