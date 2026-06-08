// 수요 발굴 — 두 API 조인 (절대량 × 시즌 배율 = 피크 투영)
//
// 키워드도구(절대량, 단 *직전 1개월* 스냅샷) × 데이터랩(시즌 배율) 조인.
//   현재월 절대량 + 피크월 + 투영 피크 절대량(≈ 현재 × 피크지수/현재월지수).
//   ⚠️ 현재월이 비수기 바닥(지수<피크 10%)이면 투영 신뢰도↓ → 'rough' 표기.
//
// 실행: (packages/db 에서)
//   node --env-file=.env --import tsx scripts/demand/join.ts

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { keywordTool, datalab, apiDelay } from './naver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
const REPORT_MD = path.join(__dirname, '..', '..', '..', '..', 'docs', 'DEMAND_JOIN.md');

// 데이터랩은 36개월(3년)로 시즌 배율 안정화
const DL_START = '2023-06-01';
const DL_END = '2026-05-31';
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const CUR_MONTH = '06'; // 키워드도구 스냅샷 시점(현재 6월)

// 전략 키워드 — 진통제 + 베타(7월) 윈도우 + 벤치마크 + 발굴검증
const STRATEGIC: { kw: string; tag: string }[] = [
  // 겨울 입학·돌봄 진통제 (2026-06 검증된 실수요 앵커)
  { kw: '아이돌봄서비스', tag: '진통제' },
  { kw: '늘봄', tag: '진통제' },
  { kw: '취학통지서', tag: '진통제' },
  { kw: '초등학교 입학준비', tag: '진통제' },
  { kw: '영어유치원', tag: '진통제' },
  { kw: '어린이집 입소대기', tag: '진통제' },
  // 유치원 입학(9월~)
  { kw: '처음학교로', tag: '유치원입학' },
  { kw: '유치원 입학설명회', tag: '유치원입학' },
  // 여름방학/베타 윈도우
  { kw: '여름방학', tag: '여름' },
  { kw: '어린이 뮤지컬', tag: '여름' },
  { kw: '키즈 풀빌라', tag: '여름' },
  { kw: '물놀이장', tag: '여름' },
  { kw: '워터파크', tag: '여름' },
  // 거대 상시(놀이) — 벤치마크
  { kw: '키즈카페', tag: '벤치마크' },
  { kw: '레고랜드', tag: '벤치마크' },
  { kw: '베이비페어', tag: '벤치마크' },
  { kw: '서울형키즈카페', tag: '발굴검증' },
  // 도서(작은 카테고리 확인) — 어린이도서관이 진짜 앵커
  { kw: '어린이도서관', tag: '도서' },
  { kw: '그림책 추천', tag: '도서' },
];

function norm(s: string) {
  return s.replace(/\s+/g, '');
}

type JoinRow = {
  kw: string;
  tag: string;
  currentAbs: number; // 직전 1개월 절대 검색수(PC+MO)
  peakMonth: string;
  peakRatio: number;
  curRatio: number;
  projectedPeakAbs: number | null;
  reliability: 'ok' | 'rough' | 'na';
};

async function main() {
  console.log(`조인 진단 — 전략 키워드 ${STRATEGIC.length}개\n`);
  const rows: JoinRow[] = [];

  // 1) 데이터랩 시즌 배율 (5개씩)
  const profiles = new Map<string, Record<string, number>>();
  for (let i = 0; i < STRATEGIC.length; i += 5) {
    const batch = STRATEGIC.slice(i, i + 5);
    const groups = batch.map((s) => ({ groupName: s.kw, keywords: [s.kw] }));
    try {
      const res = await datalab(groups, { startDate: DL_START, endDate: DL_END, timeUnit: 'month' });
      for (const s of batch) {
        const r = res.find((x) => x.keyword === s.kw);
        const byMonth: Record<string, number[]> = {};
        for (const m of MONTHS) byMonth[m] = [];
        for (const d of r?.data ?? []) byMonth[d.period.slice(5, 7)]?.push(d.ratio);
        const prof: Record<string, number> = {};
        for (const m of MONTHS) {
          const xs = byMonth[m];
          prof[m] = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
        }
        profiles.set(s.kw, prof);
      }
    } catch (e: any) {
      console.log(`  데이터랩 배치 실패: ${e.message}`);
    }
    await apiDelay(300);
  }

  // 2) 키워드도구 절대량(직전 1개월) + 조인
  for (const s of STRATEGIC) {
    let currentAbs = 0;
    try {
      const ktRows = await keywordTool(s.kw);
      const self = ktRows.find((r) => norm(r.relKeyword) === norm(s.kw));
      currentAbs = self?.monthlyTotalQcCnt ?? 0;
    } catch (e: any) {
      console.log(`  키워드도구 실패(${s.kw}): ${e.message}`);
    }
    const prof = profiles.get(s.kw) ?? {};
    const vals = MONTHS.map((m) => prof[m] ?? 0);
    const peakRatio = Math.max(...vals, 0);
    const peakMonth = MONTHS[vals.indexOf(peakRatio)] ?? '';
    const curRatio = prof[CUR_MONTH] ?? 0;

    let projectedPeakAbs: number | null = null;
    let reliability: JoinRow['reliability'] = 'na';
    if (currentAbs > 0 && curRatio > 0 && peakRatio > 0) {
      projectedPeakAbs = Math.round(currentAbs * (peakRatio / curRatio));
      reliability = curRatio >= 0.1 * peakRatio ? 'ok' : 'rough';
    }
    rows.push({ kw: s.kw, tag: s.tag, currentAbs, peakMonth, peakRatio, curRatio, projectedPeakAbs, reliability });
    await apiDelay(250);
  }

  rows.sort((a, b) => (b.projectedPeakAbs ?? b.currentAbs) - (a.projectedPeakAbs ?? a.currentAbs));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'join.json'), JSON.stringify({ window: [DL_START, DL_END], curMonth: CUR_MONTH, rows }, null, 2));
  fs.writeFileSync(REPORT_MD, render(rows));
  console.log('\n조인 결과 (피크 투영 내림차순):');
  for (const r of rows) {
    const proj = r.projectedPeakAbs != null ? `${r.projectedPeakAbs.toLocaleString()}(${parseInt(r.peakMonth)}월${r.reliability === 'rough' ? '~' : ''})` : 'n/a';
    console.log(`  ${r.kw.padEnd(12)} 현재 ${r.currentAbs.toLocaleString().padStart(8)} → 피크 ${proj}`);
  }
  console.log(`\n📄 ${path.relative(process.cwd(), REPORT_MD)}`);
}

function render(rows: JoinRow[]): string {
  const L: string[] = [];
  L.push('# 수요 발굴 — 절대량 × 시즌 조인 (피크 투영)');
  L.push('');
  L.push('> 키워드도구 절대량(직전 1개월=현재 6월 스냅샷) × 데이터랩 시즌 배율(3년).');
  L.push('> **투영 피크** = 현재 절대량 × (피크월지수 / 6월지수). `~`=비수기 바닥 측정이라 rough.');
  L.push('> 자동 생성 — `scripts/demand/join.ts`.');
  L.push('');
  L.push('| 키워드 | 태그 | 현재(6월) 월검색 | 피크월 | 투영 피크 월검색 | 신뢰 |');
  L.push('|--------|------|------------------|--------|------------------|------|');
  for (const r of rows) {
    const proj = r.projectedPeakAbs != null ? r.projectedPeakAbs.toLocaleString() : '—';
    const rel = r.reliability === 'ok' ? '✅' : r.reliability === 'rough' ? '⚠️rough' : '—';
    L.push(`| ${r.kw} | ${r.tag} | ${r.currentAbs.toLocaleString()} | ${r.peakMonth ? parseInt(r.peakMonth) + '월' : '—'} | ${proj} | ${rel} |`);
  }
  L.push('');
  L.push('> ⚠️ "현재 6월" 스냅샷은 여름 키워드엔 거의 피크라 신뢰도 높음. 겨울 진통제(늘봄·취학)는 6월이 바닥이라 투영이 rough — 절대 규모는 검색광고를 *겨울에 재측정*하면 정확. 시점 패턴(피크월)은 데이터랩이 이미 확정.');
  return L.join('\n');
}

main().catch((e) => {
  console.error('실패:', e);
  process.exit(1);
});
