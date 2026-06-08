// 수요 발굴 Step 2 — 1회성 진단 스크립트
//
// 산출물:
//   ⓐ 시즌 캘린더 *확정판* — seed 가설월 vs 데이터랩 실측 피크월 대조
//   ⓑ 큐레이션 vs 실수요 *정렬 격차* — 검색광고 절대량 + 우리 seed에 없는 발굴 키워드
//
// 실행: (packages/db 에서)
//   node --env-file=.env --import tsx scripts/demand/diagnose.ts
//
// 검색광고 키가 미활성(403)이면 데이터랩 기반 ⓐ만 산출하고 ⓑ는 'pending'으로 표기.
// 활성화 후 같은 명령 재실행하면 ⓑ까지 합쳐짐.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEMAND_SEEDS, type DemandSeed } from './seed-keywords';
import { keywordTool, datalab, apiDelay, type KeywordToolRow } from './naver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
const FINDINGS_MD = path.join(__dirname, '..', '..', '..', '..', 'docs', 'DEMAND_FINDINGS.md');

// 데이터랩 시즌성: 최근 3개 완결연도로 12개월 프로파일 (가설은 docs/DEMAND_MINING.md)
const SEASON_START = '2023-01-01';
const SEASON_END = '2025-12-31';
const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function norm(s: string): string {
  return s.replace(/\s+/g, '');
}

// ── 시즌성 분석 ────────────────────────────────────────────────────────
type Seasonality = {
  keyword: string;
  category: string;
  hypothesisMonths: string[];
  painkiller: boolean;
  profile: Record<string, number>; // 월 → 평균 지수
  peakMonths: string[]; // 고시즌(피크의 80% 이상)
  topPeak: string; // 단일 최고월
  strength: number; // peak / 평균 (1=평탄, ↑=시즌성 강함)
  verdict: 'confirmed' | 'mismatch' | 'evergreen-ok' | 'new-seasonality' | 'no-data';
  note: string;
};

function analyzeSeasonality(
  seed: DemandSeed,
  data: { period: string; ratio: number }[],
): Seasonality {
  const hyp = [...(seed.hypothesisMonths ?? [])];
  const base = {
    keyword: seed.keyword,
    category: seed.category,
    hypothesisMonths: hyp,
    painkiller: !!seed.painkiller,
  };
  if (!data.length) {
    return { ...base, profile: {}, peakMonths: [], topPeak: '', strength: 0, verdict: 'no-data', note: '데이터 없음' };
  }
  const byMonth: Record<string, number[]> = {};
  for (const m of MONTHS) byMonth[m] = [];
  for (const d of data) {
    const m = d.period.slice(5, 7);
    if (byMonth[m]) byMonth[m].push(d.ratio);
  }
  const profile: Record<string, number> = {};
  for (const m of MONTHS) {
    const xs = byMonth[m];
    profile[m] = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  }
  const vals = MONTHS.map((m) => profile[m]);
  const peakVal = Math.max(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length || 1;
  const strength = peakVal / (avg || 1);
  const topPeak = MONTHS[vals.indexOf(peakVal)];
  const peakMonths = MONTHS.filter((m) => profile[m] >= 0.8 * peakVal);

  let verdict: Seasonality['verdict'];
  let note: string;
  const isSeasonal = strength >= 1.4;
  if (hyp.length === 0) {
    if (!isSeasonal) {
      verdict = 'evergreen-ok';
      note = `상시 가설 부합 (시즌성 약함 ${strength.toFixed(2)})`;
    } else {
      verdict = 'new-seasonality';
      note = `예상 못한 시즌성 발견: 피크 ${topPeak}월 (강도 ${strength.toFixed(2)})`;
    }
  } else {
    const overlap = peakMonths.filter((m) => hyp.includes(m));
    if (overlap.length) {
      verdict = 'confirmed';
      note = `가설 적중: 고시즌 ${peakMonths.join('·')} ∩ 가설 ${hyp.join('·')} = ${overlap.join('·')}`;
    } else {
      verdict = 'mismatch';
      note = `가설 빗나감: 실측 피크 ${topPeak}월(고시즌 ${peakMonths.join('·')}) vs 가설 ${hyp.join('·')}`;
    }
  }
  return { ...base, profile, peakMonths, topPeak, strength, verdict, note };
}

// ── 절대량(검색광고) 분석 ──────────────────────────────────────────────
type Volume = {
  keyword: string;
  category: string;
  seedVolume: number; // seed 자신의 월검색량(PC+MO)
  related: { keyword: string; volume: number; comp: string }[]; // 발굴 연관어
};

async function fetchVolumes(): Promise<{ available: boolean; reason?: string; volumes: Volume[] }> {
  const volumes: Volume[] = [];
  // 먼저 1건으로 활성화 여부 타진
  try {
    await keywordTool(DEMAND_SEEDS[0].keyword);
  } catch (e: any) {
    return { available: false, reason: e.message, volumes: [] };
  }
  for (const seed of DEMAND_SEEDS) {
    try {
      const rows = await keywordTool(seed.keyword);
      const hint = norm(seed.keyword);
      const self = rows.find((r) => norm(r.relKeyword) === hint);
      const related = rows
        .filter((r) => norm(r.relKeyword) !== hint)
        .sort((a, b) => b.monthlyTotalQcCnt - a.monthlyTotalQcCnt)
        .slice(0, 8)
        .map((r) => ({ keyword: r.relKeyword, volume: r.monthlyTotalQcCnt, comp: r.compIdx }));
      volumes.push({
        keyword: seed.keyword,
        category: seed.category,
        seedVolume: self?.monthlyTotalQcCnt ?? 0,
        related,
      });
    } catch (e: any) {
      volumes.push({ keyword: seed.keyword, category: seed.category, seedVolume: 0, related: [] });
    }
    await apiDelay(250); // 쿼터 보호
  }
  return { available: true, volumes };
}

// ── 메인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`수요 발굴 진단 시작 — seed ${DEMAND_SEEDS.length}개\n`);

  // 1) 데이터랩 시즌성 (5개씩 배치)
  console.log('① 데이터랩 시즌성 수집...');
  const seasonalities: Seasonality[] = [];
  for (const batch of chunk(DEMAND_SEEDS, 5)) {
    const groups = batch.map((s) => ({ groupName: s.keyword, keywords: [s.keyword] }));
    try {
      const results = await datalab(groups, { startDate: SEASON_START, endDate: SEASON_END, timeUnit: 'month' });
      for (const seed of batch) {
        const r = results.find((x) => x.keyword === seed.keyword);
        seasonalities.push(analyzeSeasonality(seed, r?.data ?? []));
      }
    } catch (e: any) {
      console.log(`  배치 실패: ${e.message}`);
      for (const seed of batch) seasonalities.push(analyzeSeasonality(seed, []));
    }
    await apiDelay(300);
  }
  const confirmed = seasonalities.filter((s) => s.verdict === 'confirmed').length;
  const mismatch = seasonalities.filter((s) => s.verdict === 'mismatch');
  const newSeason = seasonalities.filter((s) => s.verdict === 'new-seasonality');
  console.log(`  완료 — 가설적중 ${confirmed} / 빗나감 ${mismatch.length} / 신규시즌성 ${newSeason.length}\n`);

  // 2) 검색광고 절대량 (best-effort)
  console.log('② 검색광고 절대량 수집...');
  const vol = await fetchVolumes();
  if (!vol.available) {
    console.log(`  ⏸ 미활성/실패 → ⓑ pending. (${vol.reason})\n`);
  } else {
    console.log(`  완료 — ${vol.volumes.length}개 seed 절대량 수집\n`);
  }

  // 3) 월별 캘린더 집계 (확정판)
  const byMonthPainkillers: Record<string, string[]> = {};
  for (const m of MONTHS) byMonthPainkillers[m] = [];
  for (const s of seasonalities) {
    for (const m of s.peakMonths) {
      if (s.verdict === 'confirmed' || s.verdict === 'new-seasonality') {
        byMonthPainkillers[m].push(s.painkiller ? `🔴${s.keyword}` : s.keyword);
      }
    }
  }

  // 4) 정렬 격차 (ⓑ) — 검색광고 있을 때만
  const catVolume: Record<string, { total: number; seeds: number }> = {};
  const discovered: { keyword: string; volume: number; comp: string }[] = [];
  if (vol.available) {
    const seedSet = new Set(DEMAND_SEEDS.map((s) => norm(s.keyword)));
    for (const v of vol.volumes) {
      catVolume[v.category] ??= { total: 0, seeds: 0 };
      catVolume[v.category].total += v.seedVolume;
      catVolume[v.category].seeds += 1;
      for (const r of v.related) {
        if (!seedSet.has(norm(r.keyword))) discovered.push(r);
      }
    }
    // 발굴 키워드 dedupe(최대 볼륨 유지) + 정렬
    const dmap = new Map<string, { keyword: string; volume: number; comp: string }>();
    for (const d of discovered) {
      const k = norm(d.keyword);
      if (!dmap.has(k) || dmap.get(k)!.volume < d.volume) dmap.set(k, d);
    }
    discovered.length = 0;
    discovered.push(...[...dmap.values()].sort((a, b) => b.volume - a.volume));
  }

  // 5) 출력
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const json = {
    generatedFor: { seasonRange: [SEASON_START, SEASON_END], seedCount: DEMAND_SEEDS.length },
    seasonalities,
    calendar: byMonthPainkillers,
    adAvailable: vol.available,
    adReason: vol.reason ?? null,
    categoryVolume: catVolume,
    discoveredKeywords: discovered.slice(0, 40),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'diagnosis.json'), JSON.stringify(json, null, 2));

  // 마크다운 리포트
  const md = renderMarkdown(seasonalities, byMonthPainkillers, vol, catVolume, discovered);
  fs.writeFileSync(FINDINGS_MD, md);

  console.log(`📄 산출:`);
  console.log(`  - ${path.relative(process.cwd(), path.join(OUT_DIR, 'diagnosis.json'))} (머신리더블)`);
  console.log(`  - ${path.relative(process.cwd(), FINDINGS_MD)} (리포트)`);
  if (mismatch.length) {
    console.log(`\n⚠️ 가설 빗나간 키워드 (캘린더 갱신 후보):`);
    for (const m of mismatch) console.log(`  - ${m.keyword}: ${m.note}`);
  }
}

function bar(profile: Record<string, number>): string {
  const max = Math.max(...MONTHS.map((m) => profile[m] || 0)) || 1;
  const blocks = '▁▂▃▄▅▆▇█';
  return MONTHS.map((m) => {
    const v = profile[m] || 0;
    const idx = Math.min(blocks.length - 1, Math.round((v / max) * (blocks.length - 1)));
    return blocks[idx];
  }).join('');
}

function renderMarkdown(
  ss: Seasonality[],
  calendar: Record<string, string[]>,
  vol: { available: boolean; reason?: string; volumes: Volume[] },
  catVolume: Record<string, { total: number; seeds: number }>,
  discovered: { keyword: string; volume: number; comp: string }[],
): string {
  const L: string[] = [];
  L.push('# 수요 발굴 — 진단 결과 (Step 2 산출물)');
  L.push('');
  L.push(`> 데이터랩 시즌성(${SEASON_START}~${SEASON_END}, 월단위 3년 평균) + 검색광고 절대량 진단.`);
  L.push(`> 가설은 [docs/DEMAND_MINING.md](./DEMAND_MINING.md) 시즌 캘린더. 이 문서가 *확정판*.`);
  L.push(`> 자동 생성 — \`packages/db/scripts/demand/diagnose.ts\`. 재실행 시 덮어씀.`);
  L.push('');

  // ⓐ 시즌 캘린더 확정판
  L.push('## ⓐ 시즌 캘린더 — 확정판 (데이터 검증)');
  L.push('');
  L.push('각 월 = 그 달에 고시즌(피크 80%↑)인 키워드. 🔴 = 진통제(신청·마감·예매 시점성).');
  L.push('');
  L.push('| 월 | 고시즌 키워드 |');
  L.push('|----|----------------|');
  for (const m of MONTHS) {
    const ks = calendar[m];
    L.push(`| ${parseInt(m, 10)}월 | ${ks.length ? ks.join(', ') : '—'} |`);
  }
  L.push('');

  // 가설 검증 표
  L.push('## 키워드별 시즌성 (가설 대조)');
  L.push('');
  L.push('| 키워드 | 카테고리 | 월별 프로파일(1→12) | 피크 | 강도 | 판정 |');
  L.push('|--------|----------|---------------------|------|------|------|');
  const order = { confirmed: 0, 'new-seasonality': 1, mismatch: 2, 'evergreen-ok': 3, 'no-data': 4 } as const;
  for (const s of [...ss].sort((a, b) => order[a.verdict] - order[b.verdict])) {
    const icon =
      s.verdict === 'confirmed' ? '✅적중'
      : s.verdict === 'new-seasonality' ? '➕신규시즌'
      : s.verdict === 'mismatch' ? '⚠️빗나감'
      : s.verdict === 'evergreen-ok' ? '🟦상시'
      : '∅무데이터';
    const peak = s.topPeak ? `${parseInt(s.topPeak, 10)}월` : '—';
    L.push(`| ${s.painkiller ? '🔴' : ''}${s.keyword} | ${s.category} | \`${bar(s.profile)}\` | ${peak} | ${s.strength.toFixed(2)} | ${icon} |`);
  }
  L.push('');

  // ⓑ 정렬 격차
  L.push('## ⓑ 큐레이션 vs 실수요 — 정렬 격차');
  L.push('');
  if (!vol.available) {
    L.push(`⏸ **검색광고 절대량 = pending** — 키 미활성/실패: \`${(vol.reason ?? '').slice(0, 120)}\``);
    L.push('');
    L.push('→ 활성화 후 `node --env-file=.env --import tsx scripts/demand/diagnose.ts` 재실행하면 이 섹션이 채워짐.');
  } else {
    L.push('### 카테고리별 절대 수요 (seed 월검색량 합)');
    L.push('');
    L.push('| 카테고리 | seed 수 | 월검색량 합 | seed당 평균 |');
    L.push('|----------|---------|-------------|-------------|');
    const cats = Object.entries(catVolume).sort((a, b) => b[1].total - a[1].total);
    for (const [c, v] of cats) {
      L.push(`| ${c} | ${v.seeds} | ${v.total.toLocaleString()} | ${Math.round(v.total / v.seeds).toLocaleString()} |`);
    }
    L.push('');
    L.push('### 우리 seed에 없는 발굴 키워드 (실수요 상위 — 큐레이션 보강 후보)');
    L.push('');
    L.push('| 발굴 키워드 | 월검색량 | 경쟁 |');
    L.push('|-------------|----------|------|');
    for (const d of discovered.slice(0, 30)) {
      L.push(`| ${d.keyword} | ${d.volume.toLocaleString()} | ${d.comp} |`);
    }
  }
  L.push('');
  return L.join('\n');
}

main().catch((e) => {
  console.error('진단 실패:', e);
  process.exit(1);
});
