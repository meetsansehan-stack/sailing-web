// 수요 발굴 — niche 키워드 발굴 (구체·고유 long-tail)
//
// 목적: 헤드(과경쟁) 말고, 0~8 부모가 실제 치는 *구체적 long-tail*을 발굴.
//   = 경쟁 얇아 SEO 선점 가능 + 의도 뾰족해 공명 큼 + 대학/성인에 안 뺏긴 깨끗한 신호.
// 방법: 다양한 육아 hint로 검색광고 연관어 대량 수집 → 강한 필터 → niche 밴드 + 경쟁 낮음 우선.
//
// 실행: (packages/db) node --env-file=.env --import tsx scripts/demand/niche.ts

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { keywordTool, apiDelay } from './naver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_MD = path.join(__dirname, '..', '..', '..', '..', 'docs', 'DEMAND_NICHE.md');

// niche 밴드(월검색량): 너무 작으면 무의미, 너무 크면 헤드(과경쟁)
const NICHE_MIN = 300;
const NICHE_MAX = 20000;
const HEAD_CAP = 20000; // 이상은 헤드로 분리

// 다양한 hint — 카테고리·월령·상황별로 연관어 그물을 넓게
const HINTS = [
  // 발달·월령 (연령 특이 long-tail의 보고)
  '신생아', '100일 아기', '돌아기', '18개월', '24개월', '4살', '5세', '6세', '7세', '영유아 발달',
  // 상황·고민 (공명 큰 구체 키워드)
  '분리불안', '등원거부', '잠투정', '편식', '어린이집 적응', '떼쓰기', '훈육', '대소변 가리기',
  // 취학·학습
  '한글', '초등 입학준비', '수세기', '받아쓰기', '처음학교로',
  // 놀이·체험 (지역·유형 long-tail)
  '실내놀이터', '아이와 가볼만한곳', '유아 체험', '박물관 어린이',
  // 정책·돌봄·도서
  '아이돌봄', '늘봄', '유아학비', '어린이도서관',
];

// 육아 의도 토큰(allowlist) — 하나라도 포함해야 통과
const ALLOW = ['아기', '아이', '유아', '영아', '신생아', '어린이', '키즈', '육아', '돌', '개월', '세', '살',
  '유치원', '어린이집', '초등', '취학', '입학', '돌봄', '늘봄', '한글', '그림책', '동화', '놀이', '체험',
  '발달', '훈육', '수면', '이유식', '분리불안', '등원', '편식', '장난감', '가볼만한곳', '박물관', '체험전',
  '키카', '베이비', '월령', '기질', '애착', '낮잠', '배변', '영유아', '아동', '소아'];

// 노이즈·인접도메인(denylist) — 하나라도 포함하면 제외
const DENY = ['맛집', '날씨', '유학', '대학교', '대학원', '사이버', '인강', '주식', '부동산', '코인', '비트',
  '성인', '고양이', '강아지', '반려', '다이어트', '보험', '대출', '카드', '환율', '복권', '게임', '웹툰',
  '드라마', '영화', '연예', '주가', '부업', '재테크', '자격증', '공무원', '토익', '운전', '중고', '렌트',
  '호텔', '항공', '면세', '카지노', '성형', '시술', '탈모', '운세', '띠', '제조업', '도매', '임대'];

function n(s: string) { return s.replace(/\s+/g, ''); }
function isParenting(k: string) {
  if (DENY.some((d) => k.includes(d))) return false;
  return ALLOW.some((a) => k.includes(a));
}

type Cand = { keyword: string; volume: number; comp: string };

async function main() {
  console.log(`niche 발굴 — hint ${HINTS.length}개, 밴드 ${NICHE_MIN}~${NICHE_MAX}/월\n`);
  const map = new Map<string, Cand>();
  let raw = 0;
  for (const hint of HINTS) {
    try {
      const rows = await keywordTool(hint);
      raw += rows.length;
      for (const r of rows) {
        const k = n(r.relKeyword);
        if (!map.has(k) || map.get(k)!.volume < r.monthlyTotalQcCnt) {
          map.set(k, { keyword: r.relKeyword, volume: r.monthlyTotalQcCnt, comp: r.compIdx });
        }
      }
      process.stdout.write('.');
    } catch (e: any) {
      console.log(`\n  [${hint}] 실패: ${e.message}`);
    }
    await apiDelay(250);
  }
  console.log(`\n수집 연관어(중복포함) ${raw} → 고유 ${map.size}`);

  const all = [...map.values()].filter((c) => isParenting(c.keyword));
  const niche = all.filter((c) => c.volume >= NICHE_MIN && c.volume <= NICHE_MAX);
  const head = all.filter((c) => c.volume > HEAD_CAP);

  const lowComp = niche.filter((c) => c.comp === '낮음').sort((a, b) => b.volume - a.volume);
  const midComp = niche.filter((c) => c.comp === '중간').sort((a, b) => b.volume - a.volume);
  const byVol = [...niche].sort((a, b) => b.volume - a.volume);

  console.log(`육아필터 통과 ${all.length} / niche밴드 ${niche.length} (경쟁낮음 ${lowComp.length}·중간 ${midComp.length})`);

  fs.writeFileSync(REPORT_MD, render({ niche: byVol, lowComp, midComp, head, total: all.length }));
  console.log(`\n📄 ${path.relative(process.cwd(), REPORT_MD)}`);
  console.log(`\n★ SEO 선점 0순위(경쟁낮음·상위10):`);
  for (const c of lowComp.slice(0, 10)) console.log(`  ${String(c.volume).padStart(7)}  ${c.keyword}`);
}

function tbl(rows: Cand[], n = 40) {
  const L = ['| 키워드 | 월검색 | 경쟁 |', '|---|---|---|'];
  for (const c of rows.slice(0, n)) L.push(`| ${c.keyword} | ${c.volume.toLocaleString()} | ${c.comp} |`);
  return L.join('\n');
}

function render(d: { niche: Cand[]; lowComp: Cand[]; midComp: Cand[]; head: Cand[]; total: number }) {
  const L: string[] = [];
  L.push('# 수요 발굴 — niche 키워드 (구체·고유 long-tail)');
  L.push('');
  L.push(`> 검색광고 연관어를 강한 육아 필터로 거른 niche 밴드(월 ${NICHE_MIN}~${NICHE_MAX}). 절대량 작아도 *우리 유저가 실제 치는 말* + 경쟁 얇음.`);
  L.push('> 자동 생성 — `scripts/demand/niche.ts`. (대학·맛집·성인 등 인접도메인 제외)');
  L.push('');
  L.push('## ★ SEO 선점 0순위 — 경쟁 "낮음" (이길 수 있고 의도 뾰족)');
  L.push('');
  L.push(tbl(d.lowComp, 30));
  L.push('');
  L.push('## 경쟁 "중간" — 콘텐츠로 승부 가능');
  L.push('');
  L.push(tbl(d.midComp, 25));
  L.push('');
  L.push('## niche 밴드 전체 (검색량순)');
  L.push('');
  L.push(tbl(d.niche, 50));
  L.push('');
  L.push('## 참고: 헤드 키워드(과경쟁, niche 아님)');
  L.push('');
  L.push(tbl(d.head.sort((a, b) => b.volume - a.volume), 15));
  L.push('');
  return L.join('\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
