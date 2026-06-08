// 수요 발굴 — 정적 HTML 대시보드 생성기 (Option A)
//
// out/diagnosis.json + out/join.json 을 읽어 docs/demand-dashboard.html 생성.
//   인라인 SVG 차트 + 설명. 새 패키지·인프라·JS 0. 브라우저로 열면 됨.
//   재생성: 진단/조인 스크립트 재실행 후 이 스크립트 실행.
//
// 프레이밍(2026-06-07 CPO): ①7~8월 오픈 정렬=유입 엔진 ②입학은 "미리 준비"
//   리드 인디케이터 — 현재 낮은 값 = 리드타임(앞서 제공이 가치), 9월·12월 ramp.
//
// 실행: (packages/db 에서)  node --env-file=.env --import tsx scripts/demand/dashboard.ts
//   (API 호출 없음 — JSON만 읽음. .env 불필요하나 명령 일관성 위해 동일 형태 OK)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
const HTML_OUT = path.join(__dirname, '..', '..', '..', '..', 'docs', 'demand-dashboard.html');

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const ACCENT = '#1B64DA';
const INK = '#17171C';

type Seasonality = {
  keyword: string; category: string; painkiller: boolean;
  hypothesisMonths: string[]; profile: Record<string, number>;
  peakMonths: string[]; topPeak: string; strength: number; verdict: string; note: string;
};
type JoinRow = {
  kw: string; tag: string; currentAbs: number; peakMonth: string;
  peakRatio: number; curRatio: number; projectedPeakAbs: number | null; reliability: string;
};

function readJson(p: string): any {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fmt = (n: number) => n.toLocaleString('en-US');

// 파랑 농도 (0~1)
function cell(intensity: number): string {
  const op = 0.06 + 0.94 * Math.max(0, Math.min(1, intensity));
  const dark = intensity > 0.62;
  return `fill="${ACCENT}" fill-opacity="${op.toFixed(3)}"${dark ? '' : ''}`;
}

// ── 시즌 히트맵 (키워드 × 12개월, 행별 자기 최대로 정규화) ──────────────
function heatmap(ss: Seasonality[]): string {
  const cw = 30, ch = 22, labelW = 150, top = 24;
  const cats = ['policy', 'parenting', 'academy', 'play', 'shows', 'books', 'market'];
  const rows = ss
    .filter((s) => s.verdict !== 'no-data')
    .sort((a, b) => cats.indexOf(a.category) - cats.indexOf(b.category) || b.strength - a.strength);
  const w = labelW + cw * 12 + 16;
  const h = top + rows.length * ch + 8;
  const parts: string[] = [`<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px">`];
  // 월 헤더
  MONTHS.forEach((m, i) => {
    parts.push(`<text x="${labelW + i * cw + cw / 2}" y="16" text-anchor="middle" font-size="11" fill="#888">${parseInt(m)}</text>`);
  });
  rows.forEach((s, r) => {
    const y = top + r * ch;
    const max = Math.max(...MONTHS.map((m) => s.profile[m] || 0)) || 1;
    const label = `${s.painkiller ? '🔴 ' : ''}${s.keyword}`;
    parts.push(`<text x="${labelW - 8}" y="${y + ch / 2 + 4}" text-anchor="end" font-size="11.5" fill="${INK}">${esc(label)}</text>`);
    MONTHS.forEach((m, i) => {
      const v = (s.profile[m] || 0) / max;
      const x = labelW + i * cw;
      const isPeak = m === s.topPeak;
      parts.push(`<rect x="${x + 1}" y="${y + 1}" width="${cw - 2}" height="${ch - 2}" rx="3" ${cell(v)}${isPeak ? ` stroke="${ACCENT}" stroke-width="1.4"` : ''}/>`);
    });
  });
  parts.push('</svg>');
  return parts.join('');
}

// ── 가로 막대 ───────────────────────────────────────────────────────────
function hbars(items: { label: string; value: number; sub?: string; hot?: boolean }[], unit = ''): string {
  const max = Math.max(...items.map((i) => i.value)) || 1;
  const bw = 360, lh = 28, labelW = 130;
  const w = labelW + bw + 80;
  const h = items.length * lh + 8;
  const parts: string[] = [`<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px">`];
  items.forEach((it, i) => {
    const y = i * lh + 4;
    const len = (it.value / max) * bw;
    parts.push(`<text x="${labelW - 8}" y="${y + 17}" text-anchor="end" font-size="12" fill="${INK}">${esc(it.label)}</text>`);
    parts.push(`<rect x="${labelW}" y="${y + 4}" width="${Math.max(2, len)}" height="16" rx="3" fill="${it.hot ? ACCENT : '#9DB8EE'}"/>`);
    parts.push(`<text x="${labelW + Math.max(2, len) + 6}" y="${y + 17}" font-size="11.5" fill="#555">${fmt(it.value)}${unit}${it.sub ? ` <tspan fill="#999">${esc(it.sub)}</tspan>` : ''}</text>`);
  });
  parts.push('</svg>');
  return parts.join('');
}

// ── 스파크라인 (입학 ramp) ──────────────────────────────────────────────
function sparkline(profile: Record<string, number>, highlight: string[]): string {
  const w = 300, h = 56, pad = 4;
  const max = Math.max(...MONTHS.map((m) => profile[m] || 0)) || 1;
  const x = (i: number) => pad + (i / 11) * (w - 2 * pad);
  const y = (v: number) => h - pad - (v / max) * (h - 2 * pad);
  const pts = MONTHS.map((m, i) => `${x(i).toFixed(1)},${y(profile[m] || 0).toFixed(1)}`).join(' ');
  const parts: string[] = [`<svg viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px">`];
  // 하이라이트 월 배경
  highlight.forEach((m) => {
    const i = MONTHS.indexOf(m);
    if (i >= 0) parts.push(`<rect x="${x(i) - 12}" y="0" width="24" height="${h}" fill="${ACCENT}" fill-opacity="0.08"/>`);
  });
  parts.push(`<polyline points="${pts}" fill="none" stroke="${ACCENT}" stroke-width="2"/>`);
  MONTHS.forEach((m, i) => {
    const r = m === MONTHS.reduce((a, b) => ((profile[b] || 0) > (profile[a] || 0) ? b : a), '01') ? 3.2 : 1.8;
    parts.push(`<circle cx="${x(i)}" cy="${y(profile[m] || 0)}" r="${r}" fill="${ACCENT}"/>`);
  });
  // 월 라벨 (홀수만)
  MONTHS.forEach((m, i) => { if (i % 2 === 0) parts.push(`<text x="${x(i)}" y="${h}" text-anchor="middle" font-size="8" fill="#aaa">${parseInt(m)}</text>`); });
  parts.push('</svg>');
  return parts.join('');
}

const PARENT_TOKENS = ['아이', '유아', '어린이', '키즈', '육아', '초등', '유치원', '어린이집', '그림책', '동화', '놀이', '체험', '공연', '뮤지컬', '연극', '전시', '박물관', '축제', '입학', '방학', '캠프', '풀빌라', '워터', '물놀이', '장난감', '돌잔치', '베이비', '가볼만한곳', '레고', '키카'];
function isParentingKw(k: string): boolean {
  return PARENT_TOKENS.some((t) => k.includes(t));
}

function main() {
  const diag = readJson(path.join(OUT_DIR, 'diagnosis.json'));
  const join = readJson(path.join(OUT_DIR, 'join.json'));
  if (!diag) {
    console.error('diagnosis.json 없음 — 먼저 diagnose.ts 실행');
    process.exit(1);
  }
  const ss: Seasonality[] = diag.seasonalities ?? [];
  const catVol: Record<string, { total: number; seeds: number }> = diag.categoryVolume ?? {};
  const discovered: { keyword: string; volume: number; comp: string }[] = diag.discoveredKeywords ?? [];
  const jrows: JoinRow[] = join?.rows ?? [];
  const stamp = new Date().toISOString().slice(0, 10);

  const profOf = (kw: string) => ss.find((s) => s.keyword === kw)?.profile ?? {};

  // 1) 베타 윈도우(여름) — join에서 여름 태그 + 큰 놀이 벤치마크
  const summer = jrows
    .filter((r) => r.tag === '여름' || r.tag === '벤치마크' || r.tag === '발굴검증')
    .sort((a, b) => b.currentAbs - a.currentAbs)
    .map((r) => ({ label: r.kw, value: r.currentAbs, hot: r.tag === '여름' }));

  // 2) 미리 준비 리드 — 입학 키워드
  const leadKws = jrows.filter((r) => r.tag === '유치원입학' || r.tag === '진통제');

  // 3) 카테고리 절대 수요
  const catBars = Object.entries(catVol)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([c, v]) => ({ label: c, value: v.total, sub: `(seed ${v.seeds})` }));

  // 4) 피크 투영 랭킹
  const joinBars = [...jrows]
    .sort((a, b) => (b.projectedPeakAbs ?? b.currentAbs) - (a.projectedPeakAbs ?? a.currentAbs))
    .map((r) => ({
      label: r.kw,
      value: r.projectedPeakAbs ?? r.currentAbs,
      sub: `${r.peakMonth ? parseInt(r.peakMonth) + '월' : ''}${r.reliability === 'rough' ? '~' : ''}`,
      hot: r.tag === '유치원입학' || r.tag === '진통제',
    }));

  // 5) 발굴 키워드 (노이즈 필터)
  const discFiltered = discovered.filter((d) => isParentingKw(d.keyword)).slice(0, 20);

  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>수요 발굴 대시보드 — Sailing</title>
<style>
  :root { --ink:${INK}; --accent:${ACCENT}; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Pretendard", "Apple SD Gothic Neo", system-ui, sans-serif; color: var(--ink); max-width: 920px; margin: 0 auto; padding: 32px 20px 80px; line-height: 1.6; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 19px; margin: 44px 0 6px; padding-top: 16px; border-top: 1px solid #eee; }
  h2:first-of-type { border: 0; }
  .stamp { color: #999; font-size: 13px; margin-bottom: 20px; }
  .note { background: #F5F8FE; border-left: 3px solid var(--accent); padding: 10px 14px; border-radius: 6px; font-size: 13.5px; color: #333; margin: 10px 0 4px; }
  .lead { display: grid; grid-template-columns: 1fr 300px; gap: 10px 18px; align-items: center; padding: 12px 0; border-bottom: 1px dashed #eee; }
  .lead b { font-size: 14.5px; }
  .lead .meta { color: #666; font-size: 12.5px; }
  .tag { display:inline-block; font-size:11px; padding:1px 7px; border-radius:10px; background:#EAF0FC; color:var(--accent); margin-left:6px; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; margin-top: 8px; }
  td, th { text-align: left; padding: 5px 8px; border-bottom: 1px solid #f0f0f0; }
  th { color:#888; font-weight:500; }
  .small { font-size: 12.5px; color:#777; }
</style></head><body>
<h1>🔎 수요 발굴 대시보드</h1>
<div class="stamp">생성일 ${stamp} · 출처: 네이버 데이터랩(시즌·3년) + 검색광고 키워드도구(절대량) · 자동 생성 <code>scripts/demand/dashboard.ts</code></div>

<div class="note"><b>읽는 법.</b> ① <b>지수</b>(히트맵·스파크라인) = 상대 비율(요청 내 최대=100), "<b>언제</b> 뜨나"의 타이밍. ② <b>월검색수</b>(막대) = 검색광고 절대 검색수(직전 1개월=현재). 여름 키워드는 지금이 거의 피크라 신뢰도↑, 겨울 입학은 지금이 비수기라 <b>투영(~)</b>은 rough. ③ <b>"미리 준비" 관점</b>: 입학 키워드는 지금 작아도 그게 <b>리드타임</b> — 수요가 오기 전에 제공하는 것이 가치.</div>

<h2>① 베타 윈도우 (7~8월 오픈) — 여름 유입 엔진</h2>
<div class="note">베타 오픈 시점의 최대 검색 수요 = 여름 놀이·체험·공연. 가장 큰 트래픽이 여기 있음 → <b>첫 콘텐츠를 여기 맞춰 유입을 받음</b>. (월검색수, 현재 기준)</div>
${hbars(summer, '')}

<h2>② "미리 준비" 리드 인디케이터 — 입학 (유치원 9월·초등 12월)</h2>
<div class="note">입학 키워드는 <b>지금(여름) 작은 게 정상</b> — 유치원은 9월부터, 초등은 12월부터 솟음. <b>그 전에 미리 제공</b>하는 것이 "미리 준비" 차별점. 아래 스파크라인의 음영 = 상승 구간.</div>
${leadKws.map((r) => {
    const hl = r.tag === '유치원입학' ? ['09', '10', '11'] : ['12', '01', '02'];
    const proj = r.projectedPeakAbs != null ? `피크 ~${fmt(r.projectedPeakAbs)}/월 (${parseInt(r.peakMonth)}월${r.reliability === 'rough' ? ', rough' : ''})` : '';
    return `<div class="lead"><div><b>${esc(r.kw)}</b><span class="tag">${r.tag === '유치원입학' ? '유치원 입학' : '초등 취학'}</span><div class="meta">현재 ${fmt(r.currentAbs)}/월 · ${proj}</div></div>${sparkline(profOf(r.kw), hl)}</div>`;
  }).join('')}

<h2>③ 시즌 히트맵 — 전 키워드 × 12개월</h2>
<div class="note">행별로 자기 최대치 기준 정규화(색이 진할수록 그달 검색↑). 테두리 = 피크월. 🔴 = 진통제(신청·마감·예매 시점성). 카테고리 순 정렬.</div>
${heatmap(ss)}

<h2>④ 카테고리별 절대 수요 (현재 월검색수 합)</h2>
<div class="note">seed 절대 검색수 합(6월 스냅샷). play(놀이)가 압도적, books(도서)는 최하 → 도서는 SEO 유입보다 브랜드·리텐션 자산으로.</div>
${hbars(catBars)}

<h2>⑤ 절대량 × 시즌 피크 투영 랭킹</h2>
<div class="note">전략 키워드의 피크월 투영 검색수(파랑=입학 진통제). <code>~</code>는 비수기 측정이라 규모 rough(시점은 확정).</div>
${hbars(joinBars)}

<h2>⑥ 발굴 키워드 (우리 seed에 없는 실수요 · 육아 관련 필터)</h2>
<div class="note">검색광고 연관어 중 우리 seed에 없는 고볼륨 키워드(육아 토큰 필터). 큐레이션·SEO 보강 후보.</div>
<table><tr><th>키워드</th><th>월검색수</th><th>경쟁</th></tr>
${discFiltered.map((d) => `<tr><td>${esc(d.keyword)}</td><td>${fmt(d.volume)}</td><td class="small">${esc(d.comp)}</td></tr>`).join('')}
</table>
<p class="small">※ 절대량은 검색광고 "직전 1개월" 스냅샷. 겨울 진통제 정확 규모는 11~12월 재측정 권장. 전체 원자료: <code>scripts/demand/out/*.json</code>, 리포트: <code>docs/DEMAND_FINDINGS.md</code>·<code>DEMAND_JOIN.md</code>.</p>
</body></html>`;

  fs.writeFileSync(HTML_OUT, html);
  console.log(`📊 대시보드 생성: ${path.relative(process.cwd(), HTML_OUT)}`);
  console.log(`   브라우저로 열기: open ${HTML_OUT}`);
}

main();
