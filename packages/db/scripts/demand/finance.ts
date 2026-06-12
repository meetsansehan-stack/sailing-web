// 수요 발굴 — 어린이 경제·금융 교육 *전용* 1회성 진단 (2026-06-12)
//
// 목적: "어린이 금융교육" 신규 섹션(메뉴 목적지·오리지널 연재)에 투자할
//       가치가 있는지 + 어떤 *앵글*(용돈/경제그림책/주식/기업탐구 등)이
//       실수요가 큰지를 네이버 공식 데이터로 객관화.
//
// 카테고리가 아니라 횡단 주제라 seed-keywords.ts(Category 타입 묶임)에 안 넣고 독립.
//
// 산출:
//   ⓐ 앵글별 절대 월검색량(키워드도구) + 연관어 발굴 → 어디에 수요가 몰리나
//   ⓑ 시즌성(데이터랩 월별 프로파일, 2023~2025) → 연재·캘린더 타이밍
//
// 실행 (packages/db 에서):
//   node --env-file=../../.env --import tsx scripts/demand/finance.ts
//   (또는 루트 .env 경로에 맞춰 --env-file 조정)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { keywordTool, datalab, apiDelay, type KeywordToolRow } from './naver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
const FINDINGS_MD = path.join(__dirname, '..', '..', '..', '..', 'docs', 'DEMAND_FINANCE_FINDINGS.md');

const SEASON_START = '2023-01-01';
const SEASON_END = '2025-12-31';
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

// 앵글 가설별 seed. label = 앵글 분류(연관어 발굴 결과를 묶어 보기 위함).
type FinSeed = { keyword: string; angle: string; note?: string };
const SEEDS: FinSeed[] = [
  // 상위 우산어
  { keyword: '어린이 경제교육', angle: '경제교육(우산)' },
  { keyword: '어린이 금융교육', angle: '금융교육(우산)' },
  { keyword: '초등 경제교육', angle: '경제교육(우산)' },
  // 용돈 — 일상 진입 앵글
  { keyword: '용돈교육', angle: '용돈' },
  { keyword: '용돈기입장', angle: '용돈', note: '실천 도구 = 행동 의도 강함' },
  { keyword: '어린이 통장', angle: '용돈' },
  // 콘텐츠(도서) 앵글 — 연재·제휴 BM 직결
  { keyword: '경제 그림책', angle: '도서' },
  { keyword: '어린이 경제동화', angle: '도서' },
  { keyword: '어린이 경제책', angle: '도서' },
  // 투자·자산 앵글 (회색지대 — 톤 가드레일 주의)
  { keyword: '어린이 주식계좌', angle: '투자' },
  { keyword: '미성년자 주식계좌', angle: '투자' },
  // 체험 앵글
  { keyword: '키즈 잡월드', angle: '체험' },
  { keyword: '어린이 경제캠프', angle: '체험' },
  // 사용자 발의 구체 컨셉
  { keyword: '기업 탐구', angle: '기업탐구(발의)', note: '사용자 발의 "별별 기업 탐구책" 앵커 — 절대량 미미 예상, 신호만 확인' },
];

function fmt(n: number): string {
  return n.toLocaleString('ko-KR');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const startedNote = '(타임스탬프는 호출 측에서 주입 안 함 — 파일 mtime 참조)';

  // ── ⓐ 절대 검색량 + 연관어 발굴 ───────────────────────────────────
  type SeedResult = {
    seed: FinSeed;
    self: KeywordToolRow | null; // seed 자신의 행(있으면)
    related: KeywordToolRow[]; // 연관어 상위(절대량순)
    error?: string;
  };
  const results: SeedResult[] = [];

  for (const seed of SEEDS) {
    try {
      const rows = await keywordTool(seed.keyword);
      const norm = (s: string) => s.replace(/\s+/g, '');
      const self = rows.find((r) => norm(r.relKeyword) === norm(seed.keyword)) ?? null;
      const related = rows
        .filter((r) => norm(r.relKeyword) !== norm(seed.keyword))
        .sort((a, b) => b.monthlyTotalQcCnt - a.monthlyTotalQcCnt)
        .slice(0, 8);
      results.push({ seed, self, related });
      console.log(
        `✅ ${seed.keyword} [${seed.angle}] = ${self ? fmt(self.monthlyTotalQcCnt) : 'self행 없음'} /월, 연관어 ${rows.length}개`,
      );
    } catch (e: any) {
      const msg = e?.status ? `${e.status}` : String(e?.message ?? e);
      results.push({ seed, self: null, related: [], error: msg });
      console.log(`⚠️ ${seed.keyword} [${seed.angle}] 실패: ${msg}`);
    }
    await apiDelay(350);
  }

  // ── ⓑ 시즌성 (데이터랩 월별, 2023~2025) ────────────────────────────
  type Season = { keyword: string; profile: Record<string, number>; topPeak: string; strength: number };
  const seasons: Season[] = [];
  const dlKeywords = SEEDS.map((s) => s.keyword);
  const chunk = <T,>(a: T[], n: number): T[][] => {
    const o: T[][] = [];
    for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n));
    return o;
  };
  for (const batch of chunk(dlKeywords, 5)) {
    try {
      const res = await datalab(
        batch.map((k) => ({ groupName: k, keywords: [k] })),
        { startDate: SEASON_START, endDate: SEASON_END, timeUnit: 'month' },
      );
      for (const r of res) {
        const byMonth: Record<string, number[]> = {};
        for (const p of r.data) {
          const m = p.period.slice(5, 7); // 'YYYY-MM-01' → 'MM'
          (byMonth[m] ??= []).push(p.ratio);
        }
        const profile: Record<string, number> = {};
        for (const m of MONTHS) {
          const arr = byMonth[m] ?? [];
          profile[m] = arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
        }
        const vals = MONTHS.map((m) => profile[m]);
        const avg = vals.reduce((s, v) => s + v, 0) / 12 || 1;
        const peak = Math.max(...vals);
        const topPeak = MONTHS[vals.indexOf(peak)];
        seasons.push({ keyword: r.keyword, profile, topPeak, strength: +(peak / avg).toFixed(1) });
      }
      console.log(`📈 데이터랩 시즌성 ${batch.length}개 완료`);
    } catch (e: any) {
      console.log(`⚠️ 데이터랩 배치 실패: ${e?.status ?? e?.message ?? e}`);
    }
    await apiDelay(350);
  }

  // ── 출력: JSON + 마크다운 ──────────────────────────────────────────
  fs.writeFileSync(
    path.join(OUT_DIR, 'finance-raw.json'),
    JSON.stringify({ results, seasons }, null, 2),
  );

  const byAngle: Record<string, number> = {};
  for (const r of results) {
    if (r.self) byAngle[r.seed.angle] = (byAngle[r.seed.angle] ?? 0) + r.self.monthlyTotalQcCnt;
  }
  const angleRank = Object.entries(byAngle).sort((a, b) => b[1] - a[1]);
  const seasonByKw = new Map(seasons.map((s) => [s.keyword.replace(/\s+/g, ''), s]));

  let md = `# 어린이 경제·금융 교육 — 수요 진단 (네이버 공식 데이터)\n\n`;
  md += `> 1회성 산출 · 절대량=검색광고 키워드도구(월 PC+MO) · 시즌성=데이터랩(2023~2025 월별)\n`;
  md += `> 목적: 신규 섹션(메뉴·오리지널 연재) 투자가치 + 앵글 우선순위 객관화. ${startedNote}\n\n`;

  md += `## 앵글별 수요 순위 (seed 자신의 월검색량 합)\n\n`;
  md += `| 순위 | 앵글 | 월검색량 합 |\n|---|---|---|\n`;
  angleRank.forEach(([a, v], i) => {
    md += `| ${i + 1} | ${a} | ${fmt(v)} |\n`;
  });

  md += `\n## seed별 상세 (절대량 + 시즌 피크 + 발굴 연관어)\n\n`;
  for (const r of [...results].sort((a, b) => (b.self?.monthlyTotalQcCnt ?? 0) - (a.self?.monthlyTotalQcCnt ?? 0))) {
    const vol = r.self ? `${fmt(r.self.monthlyTotalQcCnt)}/월 (경쟁 ${r.self.compIdx})` : r.error ? `에러 ${r.error}` : 'self행 없음';
    const s = seasonByKw.get(r.seed.keyword.replace(/\s+/g, ''));
    const peak = s ? `피크 ${s.topPeak}월 (강도 ${s.strength})` : '시즌데이터 없음';
    md += `### ${r.seed.keyword} — \`${r.seed.angle}\`\n`;
    md += `- **절대량**: ${vol} · **시즌**: ${peak}\n`;
    if (r.seed.note) md += `- _가설_: ${r.seed.note}\n`;
    if (r.related.length) {
      md += `- **발굴 연관어**: ` + r.related.map((k) => `${k.relKeyword}(${fmt(k.monthlyTotalQcCnt)})`).join(', ') + `\n`;
    }
    md += `\n`;
  }

  md += `## 시즌 캘린더 (월별 프로파일, 0~100 상대지수)\n\n`;
  md += `| 키워드 | ${MONTHS.map((m) => m).join(' | ')} | 피크 |\n`;
  md += `|---|${MONTHS.map(() => '---').join('|')}|---|\n`;
  for (const s of seasons) {
    md += `| ${s.keyword} | ${MONTHS.map((m) => Math.round(s.profile[m])).join(' | ')} | **${s.topPeak}** |\n`;
  }

  fs.writeFileSync(FINDINGS_MD, md);
  console.log(`\n📄 findings → ${FINDINGS_MD}`);
  console.log(`📊 raw → ${path.join(OUT_DIR, 'finance-raw.json')}`);
  console.log(`\n=== 앵글 순위 ===`);
  angleRank.forEach(([a, v], i) => console.log(`${i + 1}. ${a}: ${fmt(v)}/월`));
}

main().catch((e) => {
  console.error('진단 실패:', e);
  process.exit(1);
});
