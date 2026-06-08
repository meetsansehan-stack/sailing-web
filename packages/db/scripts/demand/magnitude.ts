// 수요 발굴 — 상대 규모 + 베타 윈도우(7월 오픈) 진단
//
// 목적:
//   (5) 검색광고 절대량 없이도 "우리 키워드가 교육·보육 헤드 키워드 대비 얼마나 큰가"를
//       데이터랩 앵커-체이닝으로 *상대 규모 순위*화. (절대 수치는 검색광고 활성화 후 백필)
//   (1·2·3) 베타~오픈(6~9월) 윈도우에 걸리는 키워드: 입학설명회·여름방학 신규 포함.
//
// 방법(앵커 체이닝): 모든 요청에 공통 앵커 1개 + 타깃 4개를 함께 넣음.
//   같은 요청 내 지수는 비교 가능 → 각 키워드의 12개월 평균지수 ÷ 앵커 평균지수 = 앵커 배수.
//   앵커=1.0 기준으로 모든 키워드를 한 척도에 정렬. (앵커 = 키즈카페, 상시·중간 규모)
//
// 실행: (packages/db 에서)
//   node --env-file=.env --import tsx scripts/demand/magnitude.ts

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMAND_SEEDS } from './seed-keywords';
import { datalab, apiDelay } from './naver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
const REPORT_MD = path.join(__dirname, '..', '..', '..', '..', 'docs', 'DEMAND_MAGNITUDE.md');

// 최근 12개월(완결) — 현재 검색 행태 기준
const START = '2025-06-01';
const END = '2026-05-31';
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const ANCHOR = '키즈카페'; // 상시·중간 규모 → 큰/작은 키워드 모두 0으로 안 죽음

// 벤치마크 헤드 키워드 (교육·보육 절대 상위권 가늠용)
const BENCHMARK = ['어린이집', '유치원', '초등학교', '학원', '한글', '독서'];

// 베타~오픈(6~9월) 윈도우 신규 키워드
const LAUNCH = [
  // 입학설명회 (유치원 입학 9월~ 탐색 시작 가설)
  '입학설명회', '유치원 입학설명회', '초등학교 입학설명회', '처음학교로', '유치원 추첨', '유치원 입학',
  // 여름방학
  '여름방학', '여름방학 프로그램', '여름방학 특강', '여름 캠프', '방학 숙제', '방학 생활계획표',
  '물놀이장', '여름 물놀이', '아이와 여행',
];

function uniq(xs: string[]): string[] {
  return [...new Set(xs)];
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

type Row = {
  keyword: string;
  group: 'seed' | 'benchmark' | 'launch' | 'anchor';
  category?: string;
  mean: number; // 요청 내 12개월 평균 지수
  anchorMultiple: number; // 평균 ÷ 앵커평균 (상대 규모)
  monthly: Record<string, number>; // 월 → 지수 (요청 내 스케일)
};

async function main() {
  const seedKw = DEMAND_SEEDS.map((s) => s.keyword);
  const catOf = new Map(DEMAND_SEEDS.map((s) => [s.keyword, s.category as string]));

  // 타깃 = seed + benchmark + launch (앵커는 매 요청에 별도 추가, 중복 제거)
  const targetsRaw = uniq([...seedKw, ...BENCHMARK, ...LAUNCH]).filter((k) => k !== ANCHOR);
  console.log(`상대 규모 진단 — 타깃 ${targetsRaw.length}개 (앵커=${ANCHOR})\n`);

  const rows: Row[] = [];
  let validatedDrift: number | null = null;
  let prevAnchorPair: { kw: string; scaled: number } | null = null;

  for (const batch of chunk(targetsRaw, 4)) {
    const groups = [
      { groupName: ANCHOR, keywords: [ANCHOR] },
      ...batch.map((k) => ({ groupName: k, keywords: [k] })),
    ];
    let results;
    try {
      results = await datalab(groups, { startDate: START, endDate: END, timeUnit: 'month' });
    } catch (e: any) {
      console.log(`  배치 실패(${batch.join(',')}): ${e.message}`);
      await apiDelay(400);
      continue;
    }
    const meanOf = (kw: string): { mean: number; monthly: Record<string, number> } => {
      const r = results!.find((x) => x.keyword === kw);
      const monthly: Record<string, number> = {};
      const data = r?.data ?? [];
      for (const d of data) monthly[d.period.slice(5, 7)] = d.ratio;
      const vals = data.map((d) => d.ratio);
      const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { mean, monthly };
    };
    const anchor = meanOf(ANCHOR);
    if (anchor.mean <= 0) {
      console.log(`  ⚠️ 앵커 평균 0 — 배치 스킵(${batch.join(',')})`);
      await apiDelay(400);
      continue;
    }
    for (const k of batch) {
      const { mean, monthly } = meanOf(k);
      const group: Row['group'] = BENCHMARK.includes(k)
        ? 'benchmark'
        : LAUNCH.includes(k)
          ? 'launch'
          : 'seed';
      rows.push({
        keyword: k,
        group,
        category: catOf.get(k),
        mean,
        anchorMultiple: mean / anchor.mean,
        monthly,
      });
    }
    await apiDelay(400);
  }

  // 앵커 자체도 기록 (배수 1.0)
  rows.push({ keyword: ANCHOR, group: 'anchor', mean: 1, anchorMultiple: 1, monthly: {} });

  rows.sort((a, b) => b.anchorMultiple - a.anchorMultiple);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'magnitude.json'), JSON.stringify({ anchor: ANCHOR, window: [START, END], rows }, null, 2));
  fs.writeFileSync(REPORT_MD, render(rows));

  console.log(`완료. 상위 10 (앵커=${ANCHOR} 대비 배수):`);
  for (const r of rows.slice(0, 10)) {
    console.log(`  ${r.anchorMultiple.toFixed(2)}× ${r.keyword} [${r.group}]`);
  }
  console.log(`\n📄 ${path.relative(process.cwd(), REPORT_MD)}`);
}

function tier(mult: number): string {
  if (mult >= 3) return '🟥 매우 큼';
  if (mult >= 1) return '🟧 큼';
  if (mult >= 0.3) return '🟨 중간';
  if (mult >= 0.1) return '🟩 작음';
  return '⬜ 매우 작음';
}

function render(rows: Row[]): string {
  const L: string[] = [];
  L.push('# 수요 발굴 — 상대 규모 + 베타 윈도우 진단');
  L.push('');
  L.push(`> 데이터랩 앵커-체이닝(앵커=\`${ANCHOR}\`, 최근 12개월 ${START}~${END} 평균지수). **상대 규모**(절대 검색수 아님).`);
  L.push('> "배수" = 그 키워드 12개월 평균지수 ÷ 앵커 평균지수. 앵커=1.00×.');
  L.push('> ⚠️ 절대 검색수는 검색광고 API 활성화 후 백필. 지금은 *서로 간 상대 크기*만 유효.');
  L.push(`> 자동 생성 — \`scripts/demand/magnitude.ts\`.`);
  L.push('');

  // 전체 랭킹
  L.push('## 상대 규모 순위 (전체)');
  L.push('');
  L.push('| 순위 | 키워드 | 분류 | 카테고리 | 앵커 대비 | 규모 |');
  L.push('|------|--------|------|----------|-----------|------|');
  rows.forEach((r, i) => {
    const g = r.group === 'benchmark' ? '벤치마크' : r.group === 'launch' ? '베타윈도우' : r.group === 'anchor' ? '앵커' : 'seed';
    L.push(`| ${i + 1} | ${r.keyword} | ${g} | ${r.category ?? '—'} | ${r.anchorMultiple.toFixed(2)}× | ${tier(r.anchorMultiple)} |`);
  });
  L.push('');

  // 베타 윈도우(6~9월) 집중
  L.push('## 베타~오픈 윈도우 (6~9월) 집중');
  L.push('');
  L.push('각 키워드의 6·7·8·9월 지수(요청 내 스케일) + 앵커 대비 규모. 베타 시기 유입 가늠용.');
  L.push('');
  L.push('| 키워드 | 분류 | 6월 | 7월 | 8월 | 9월 | 앵커 대비 |');
  L.push('|--------|------|-----|-----|-----|-----|-----------|');
  const launchView = rows
    .filter((r) => r.group === 'launch' || r.group === 'benchmark')
    .concat(rows.filter((r) => r.group === 'seed' && ['shows', 'play'].includes(r.category ?? '')));
  for (const r of launchView) {
    const g = r.group === 'benchmark' ? '벤치마크' : r.group === 'launch' ? '베타윈도우' : 'seed';
    const m = (mm: string) => (r.monthly[mm] != null ? r.monthly[mm].toFixed(1) : '—');
    L.push(`| ${r.keyword} | ${g} | ${m('06')} | ${m('07')} | ${m('08')} | ${m('09')} | ${r.anchorMultiple.toFixed(2)}× |`);
  }
  L.push('');
  return L.join('\n');
}

main().catch((e) => {
  console.error('실패:', e);
  process.exit(1);
});
