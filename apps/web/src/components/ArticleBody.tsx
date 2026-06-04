import type { ContentType } from '@parenting-newsletter/shared';
import { parseBody, type Block } from '@/src/lib/parse-body';

// 상세페이지 본문 렌더 — 파싱된 섹션을 역할별로 표시(파서는 lib/parse-body 공용).
//
// 섹션 역할 분류(렌더타임, 스키마 0):
//  - 양육자 so-what(양육자·시사점·*팁) → green 콜아웃(🧭). 의미색 = blue(정보)/red(마감)/green(액션).
//  - Event의 "개요"(* 개요)는 상단 EventInfoBox가 요약 불릿으로 흡수 → 본문에서 미표시(중복 제거).
// 본문은 불릿뿐 아니라 산문 단락도 지원(세일링 보이스로 풀어쓴 핵심 콘텐츠용).

// 양육자 액션/시사점/팁 = "부모가 뭘 하면 되나"의 결론. so-what 콜아웃으로 승격.
// "단계 또는 체크리스트"(how-to 단계)는 제외 — 단계 리스트는 별도 처리 대상(미구현).
function isParentTakeaway(heading: string): boolean {
  return heading.includes('양육자') || heading.includes('시사점') || heading.endsWith('팁');
}

// Event 상단 EventInfoBox가 행사 개요를 흡수 → 본문의 "* 개요" 섹션은 Event에서만 스킵.
function isOverview(heading: string): boolean {
  return heading.endsWith('개요');
}

// 지표 섹션 = 수치 데이터 중심(시장 지표·현황·근거·데이터·지원 단가). stat 행으로 렌더.
// "중립 데이터 매체" 포지셔닝 — 사교육 등은 통계로 다룸(CLAUDE.md 선긋기).
function isMetricHeading(heading: string): boolean {
  return (
    heading.includes('지표') ||
    heading.includes('단가') ||
    heading.includes('시장 현황') ||
    heading.includes('근거·데이터')
  );
}

// 본문 속 수치(3조 원·87만 원·+8.1%)를 파란 굵게 강조. 연도(2025년) 등 단위 없는 건 제외.
const NUM_RE = /[+\-]?\d[\d,.]*\s*(?:조|억|만|천)?\s*(?:원|%|％|배|명|개월|시간|건|곳|위)/g;
function emphasizeNumbers(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  NUM_RE.lastIndex = 0;
  while ((m = NUM_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span key={m.index} className="font-bold text-blue">
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : [text];
}

// 지표 stat 행 — 라벨(좌) + 수치(우, 숫자 강조). 키:값 아니면 한 줄로.
function MetricStats({ items }: { items: string[] }) {
  return (
    <dl className="divide-y divide-line/70 rounded-card bg-grey-50 px-4">
      {items.map((bullet, idx) => {
        const colonIdx = bullet.indexOf(':');
        const hasKey = colonIdx > 0 && colonIdx < 24;
        if (hasKey) {
          const key = bullet.slice(0, colonIdx).trim();
          const value = bullet.slice(colonIdx + 1).trim();
          return (
            <div key={idx} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-body text-ink-2">{key}</dt>
              <dd className="shrink-0 text-right text-body text-ink">{emphasizeNumbers(value)}</dd>
            </div>
          );
        }
        return (
          <div key={idx} className="py-3 text-body leading-relaxed text-ink-2">
            {emphasizeNumbers(bullet)}
          </div>
        );
      })}
    </dl>
  );
}

// "1단계: 내용" / "2단계. 내용" 패턴 → 번호 배지 step. 매칭 안 되면 null.
function parseStep(bullet: string): { num: string; text: string } | null {
  const m = bullet.match(/^(\d+)\s*단계\s*[:.]?\s*(.+)$/);
  return m ? { num: m[1], text: m[2].trim() } : null;
}

function BulletItems({ items, accent }: { items: string[]; accent?: boolean }) {
  // 블록 전체가 "N단계:" 형식이면 번호 배지 ordered list로 (신청 단계·방법 등 액션).
  const isSteps = items.length > 1 && items.every((it) => parseStep(it) !== null);
  if (isSteps) {
    return (
      <ol className="space-y-2.5">
        {items.map((it, i) => {
          const step = parseStep(it)!;
          return (
            <li key={i} className="flex gap-3 text-body leading-relaxed text-ink-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue text-small font-bold text-white">
                {step.num}
              </span>
              <span className="pt-0.5">{step.text}</span>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((bullet, bidx) => {
        const colonIdx = bullet.indexOf(':');
        const hasKey = colonIdx > 0 && colonIdx < 20;
        const key = hasKey ? bullet.slice(0, colonIdx).trim() : '';
        const value = hasKey ? bullet.slice(colonIdx + 1).trim() : bullet;
        return (
          <li key={bidx} className="flex gap-3 text-body leading-relaxed text-ink-2">
            <span
              className={`mt-2.5 inline-block h-1 w-1 shrink-0 rounded-full ${
                accent ? 'bg-green' : 'bg-grey-400'
              }`}
            />
            <span>
              {hasKey && <span className="font-semibold text-ink">{key} · </span>}
              {value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Blocks({ blocks, accent, metric }: { blocks: Block[]; accent?: boolean; metric?: boolean }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, idx) =>
        block.type === 'p' ? (
          <p key={idx} className="text-body leading-relaxed text-ink-2">
            {block.text}
          </p>
        ) : metric ? (
          <MetricStats key={idx} items={block.items} />
        ) : (
          <BulletItems key={idx} items={block.items} accent={accent} />
        ),
      )}
    </div>
  );
}

export function ArticleBody({ body, contentType }: { body: string; contentType: ContentType }) {
  const sections = parseBody(body).filter(
    (s) => !(contentType === 'Event' && isOverview(s.heading)),
  );

  return (
    <article className="mt-12 space-y-10">
      {sections.map((section, idx) =>
        isParentTakeaway(section.heading) ? (
          // 양육자 so-what 콜아웃 (green = 액션·나침반)
          <section key={idx} className="rounded-card border border-green/20 bg-green/[0.06] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-h3 text-green">
              <span aria-hidden>🧭</span>
              {section.heading}
            </h2>
            <Blocks blocks={section.blocks} accent />
          </section>
        ) : (
          // 일반 섹션 — 박스 없이 리딩 흐름
          <section key={idx}>
            <h2 className="mb-4 flex items-center gap-2.5 text-h3 text-ink">
              <span className="inline-block h-5 w-1 rounded-full bg-blue" />
              {section.heading}
            </h2>
            {/* 핵심 콘텐츠 타이틀 하단 이미지 영역 — 자리만 확보(placeholder).
                이미지 소싱은 보류(사용자 결정) → 결정 시 이 슬롯에 <img>만 끼움. */}
            {section.heading === '핵심 콘텐츠' && (
              <div className="mb-5 flex aspect-[16/9] w-full items-center justify-center rounded-card border border-line bg-grey-100 text-meta text-ink-3">
                🖼 이미지 영역 — 원문 이미지가 들어갈 자리
              </div>
            )}
            <Blocks blocks={section.blocks} metric={isMetricHeading(section.heading)} />
          </section>
        ),
      )}
    </article>
  );
}
