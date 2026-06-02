/**
 * /style — Sailing 디자인 시스템 + 컴포넌트 라이브러리 (개발용)
 * 토큰 단일 소스 = tailwind.config.ts.
 * = Toss Feed(toss.im/tossfeed) 계승. Feed에 없는 컴포넌트는 TDS 폴백(섹션에 표기).
 * 상태: normal / hover / active / focus / selected / disabled / loading / error.
 */

function Group({ kind, title }: { kind: 'feed' | 'tds'; title: string }) {
  return (
    <div className="mb-2 mt-14 flex items-center gap-2 first:mt-0">
      <span
        className={`rounded-full px-2.5 py-1 text-small font-semibold ${
          kind === 'feed' ? 'bg-blue-50 text-blue' : 'bg-grey-100 text-ink-2'
        }`}
      >
        {kind === 'feed' ? 'TOSS FEED 계승' : 'TDS 폴백 · Feed에 없음'}
      </span>
      <span className="text-meta text-ink-3">{title}</span>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-b border-line py-10">
      <h2 className="text-h2 text-ink mb-6">{title}</h2>
      {children}
    </section>
  );
}

function StateCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex items-center">{children}</div>
      <span className="text-meta text-ink-3">{label}</span>
    </div>
  );
}

function Swatch({ name, value, className }: { name: string; value: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-14 w-full rounded-card border border-line ${className}`} />
      <div className="text-meta text-ink-2">{name}</div>
      <div className="text-small text-ink-3">{value}</div>
    </div>
  );
}

export default function StylePage() {
  return (
    <main className="mx-auto max-w-container px-4 py-12 md:px-6">
      <header className="mb-6">
        <div className="text-meta uppercase tracking-widest text-blue">SAILING DESIGN SYSTEM</div>
        <h1 className="text-display text-ink mt-2">Toss Feed 계승</h1>
        <p className="text-body text-ink-2 mt-3 max-w-xl">
          에디토리얼 매거진 결 — 먹색 텍스트 중심 · 본문 15px / LH 1.6 · 블루는 링크·라벨에 절제 ·
          radius 16/8 · Pretendard. Feed에 없는 컴포넌트는 Toss DS 폴백.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2 text-meta">
          {[
            ['tokens', '토큰'],
            ['type', '타이포'],
            ['card', '카드'],
            ['rank', '랭크 리스트'],
            ['chip', '칩/탭'],
            ['badge', '배지'],
            ['pagination', '페이지네이션'],
            ['button', '버튼·TDS'],
            ['input', '인풋·TDS'],
            ['accordion', '아코디언·TDS'],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full bg-grey-100 px-3 py-1 text-ink-2 hover:bg-grey-200">
              {label}
            </a>
          ))}
        </nav>
      </header>

      {/* ── 토큰 ── */}
      <Section id="tokens" title="컬러 토큰 (Feed 실측)">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7">
          <Swatch name="blue" value="#3182F6" className="bg-blue" />
          <Swatch name="blue-50" value="#E8F3FF" className="bg-blue-50" />
          <Swatch name="ink (먹색)" value="#17171C" className="bg-ink" />
          <Swatch name="ink-2 본문" value="#4E5968" className="bg-ink-2" />
          <Swatch name="ink-3 메타" value="#8B95A1" className="bg-ink-3" />
          <Swatch name="red" value="#F04452" className="bg-red" />
          <Swatch name="green" value="#029359" className="bg-green" />
          <Swatch name="grey-100" value="#F2F4F6" className="bg-grey-100" />
          <Swatch name="grey-200" value="#E5E8EB" className="bg-grey-200" />
          <Swatch name="grey-300" value="#D1D6DB" className="bg-grey-300" />
          <Swatch name="grey-500" value="#8B95A1" className="bg-grey-500" />
          <Swatch name="grey-800" value="#333D4B" className="bg-grey-800" />
          <Swatch name="red-bg" value="#FFEEEE" className="bg-red-bg" />
          <Swatch name="white" value="#FFFFFF" className="bg-white" />
        </div>
      </Section>

      {/* ── 타이포 ── */}
      <Section id="type" title="타이포그래피 (Pretendard · Feed 스케일)">
        <div className="space-y-3">
          <div className="text-display text-ink">display 48 / 700</div>
          <div className="text-h1 text-ink">h1 36 / 700 — 아티클 타이틀</div>
          <div className="text-h2 text-ink">h2 24 / 700 — 섹션</div>
          <div className="text-h3 text-ink">h3 19 / 600</div>
          <div className="text-card-title text-ink">card-title 17 / 600</div>
          <p className="text-body text-ink-2 max-w-xl">
            body 15 / LH 1.6 — Toss Feed 본문 기준. 양육자가 차분히 읽도록 넉넉한 행간으로,
            먹색(#17171C) 헤드라인에 본문은 grey-700(#4E5968)으로 위계를 줍니다.
          </p>
          <div className="text-meta text-ink-3">meta 13 / 500 · 2026.05.31 · 교육 정책</div>
        </div>
      </Section>

      <Group kind="feed" title="아래는 Feed에 실제 있는 컴포넌트" />

      {/* ── 카드 ── */}
      <Section id="card" title="카드 (에디토리얼) — normal / hover">
        <div className="grid gap-6 md:grid-cols-3">
          <article className="group cursor-pointer">
            <div className="mb-3 flex h-44 items-center justify-center overflow-hidden rounded-card bg-grey-100 text-4xl transition group-hover:opacity-90">
              🏫
            </div>
            <div className="text-meta font-semibold text-blue">교육 정책</div>
            <h3 className="text-card-title text-ink mt-1 transition group-hover:text-blue-600">
              2027 초등 취학통지·예비소집 일정 안내
            </h3>
            <div className="mt-2 text-meta text-ink-3">EBS · 2026.05.31</div>
          </article>
          <article className="group cursor-pointer">
            <div className="mb-3 flex h-44 items-center justify-center overflow-hidden rounded-card bg-grey-100 text-4xl opacity-90">
              📚
            </div>
            <div className="text-meta font-semibold text-blue">도서그림책</div>
            <h3 className="text-card-title mt-1 text-blue-600">hover — 썸네일 살짝 흐려지고 제목 블루</h3>
            <div className="mt-2 text-meta text-ink-3">한미화 · 2026.05.31</div>
          </article>
          {/* 피처(큰) 카드 = 이미지 위 오버레이 */}
          <article className="group relative cursor-pointer overflow-hidden rounded-card">
            <div className="flex h-full min-h-44 items-center justify-center bg-grey-800 text-4xl">🌊</div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 p-5">
              <div className="text-meta font-semibold text-white/80">이 주의 콘텐츠</div>
              <h3 className="text-h3 text-white mt-1">아이의 항해 — 실패의 힘</h3>
            </div>
          </article>
        </div>
      </Section>

      {/* ── 랭크 리스트 ── */}
      <Section id="rank" title="랭크 리스트 (지금 많이 보는) — 카드 아닌 미니멀 리스트">
        <ol className="divide-y divide-line">
          {[
            ['늘봄·돌봄 신청, 맞벌이 1순위로 챙기세요', true],
            ['처음학교로 유치원 추첨 — 등록 마감 함정', false],
            ['입학 전 한글, 꼭 떼야 할까 (참고 분포)', false],
          ].map(([t, isNew], i) => (
            <li key={t as string} className="group flex cursor-pointer items-center gap-4 py-3.5">
              <span className="text-h3 font-bold text-ink-3">{i + 1}</span>
              <span className="text-card-title text-ink transition group-hover:text-blue-600">{t}</span>
              {isNew && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-small font-semibold text-blue">새로 나온</span>
              )}
            </li>
          ))}
        </ol>
      </Section>

      {/* ── 칩/탭 ── */}
      <Section id="chip" title="칩 / 탭 — selected / normal / hover / disabled">
        <div className="flex flex-wrap items-center gap-6">
          <StateCell label="selected">
            <span className="rounded-full bg-ink px-4 py-2 text-meta font-semibold text-white">전체</span>
          </StateCell>
          <StateCell label="normal (live)">
            <button className="rounded-full bg-grey-100 px-4 py-2 text-meta text-ink-2 transition hover:bg-grey-200">교육 정책</button>
          </StateCell>
          <StateCell label="hover">
            <span className="rounded-full bg-grey-200 px-4 py-2 text-meta text-ink-2">양육·발달</span>
          </StateCell>
          <StateCell label="disabled">
            <span className="rounded-full bg-grey-50 px-4 py-2 text-meta text-grey-300">놀이·체험</span>
          </StateCell>
        </div>
        {/* 언더라인 탭(Feed 상단 필터 결) */}
        <div className="mt-8 flex gap-6 border-b border-line">
          <span className="-mb-px border-b-2 border-ink pb-3 text-card-title font-semibold text-ink">전체</span>
          <button className="-mb-px border-b-2 border-transparent pb-3 text-card-title text-ink-3 transition hover:text-ink">뉴스</button>
          <button className="-mb-px border-b-2 border-transparent pb-3 text-card-title text-ink-3 transition hover:text-ink">인사이트</button>
          <button className="-mb-px border-b-2 border-transparent pb-3 text-card-title text-ink-3 transition hover:text-ink">영상</button>
        </div>
      </Section>

      {/* ── 배지 ── */}
      <Section id="badge" title="배지 / 라벨 — 비인터랙티브">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-meta font-semibold text-blue">교육 정책</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-small font-semibold text-blue">새로 나온</span>
          <span className="rounded-full bg-grey-100 px-2.5 py-1 text-small font-medium text-ink-2">Policy</span>
          <span className="rounded-full bg-red-bg px-2.5 py-1 text-small font-semibold text-red">D-3 마감</span>
          <span className="rounded-full bg-green/10 px-2.5 py-1 text-small font-semibold text-green">신청 완료</span>
        </div>
      </Section>

      {/* ── 페이지네이션 ── */}
      <Section id="pagination" title="페이지네이션 — current / normal / hover / disabled">
        <div className="flex items-center gap-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-btn text-grey-300">‹</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-btn bg-blue font-semibold text-white">1</span>
          <button className="flex h-9 w-9 items-center justify-center rounded-btn text-ink-2 transition hover:bg-grey-100">2</button>
          <button className="flex h-9 w-9 items-center justify-center rounded-btn text-ink-2 transition hover:bg-grey-100">3</button>
          <span className="flex h-9 w-9 items-center justify-center text-ink-3">…</span>
          <button className="flex h-9 w-9 items-center justify-center rounded-btn text-ink-2 transition hover:bg-grey-100">7</button>
          <button className="flex h-9 w-9 items-center justify-center rounded-btn text-ink-2 transition hover:bg-grey-100">›</button>
        </div>
      </Section>

      <Group kind="tds" title="아래는 Feed에 없어 Toss DS 컨벤션으로 채운 컴포넌트" />

      {/* ── 버튼 ── */}
      <Section id="button" title="버튼 (CTA) — normal / hover / active / focus / disabled / loading">
        <div className="flex flex-wrap gap-6">
          <StateCell label="primary · live">
            <button className="rounded-btn bg-blue px-5 py-3 text-card-title font-semibold text-white transition hover:bg-blue-600 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2">
              미리 준비 보기
            </button>
          </StateCell>
          <StateCell label="active">
            <span className="rounded-btn bg-blue-700 px-5 py-3 text-card-title font-semibold text-white">미리 준비 보기</span>
          </StateCell>
          <StateCell label="disabled">
            <span className="rounded-btn bg-grey-200 px-5 py-3 text-card-title font-semibold text-grey-400">미리 준비 보기</span>
          </StateCell>
          <StateCell label="loading">
            <span className="inline-flex items-center gap-2 rounded-btn bg-blue px-5 py-3 text-card-title font-semibold text-white opacity-90">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              처리 중
            </span>
          </StateCell>
          <StateCell label="weak">
            <button className="rounded-btn bg-blue-50 px-5 py-3 text-card-title font-semibold text-blue transition hover:bg-blue-100">자세히</button>
          </StateCell>
          <StateCell label="secondary">
            <button className="rounded-btn border border-line bg-white px-5 py-3 text-card-title font-semibold text-ink transition hover:bg-grey-50">취소</button>
          </StateCell>
        </div>
      </Section>

      {/* ── 인풋 ── */}
      <Section id="input" title="인풋 — normal / focus / filled / error / disabled">
        <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-meta font-medium text-ink-2">이메일 (focus 클릭)</span>
            <input
              type="email"
              placeholder="parent@example.com"
              className="w-full rounded-btn border border-line bg-white px-4 py-3 text-body text-ink placeholder:text-ink-3 transition focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-meta font-medium text-ink-2">filled</span>
            <input readOnly value="parent@sailing.kr" className="w-full rounded-btn border border-line bg-white px-4 py-3 text-body text-ink" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-meta font-medium text-red">error</span>
            <input readOnly value="parent@" className="w-full rounded-btn border border-red bg-red-bg px-4 py-3 text-body text-ink focus:outline-none" />
            <span className="mt-1 block text-meta text-red">올바른 이메일 형식이 아니에요.</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-meta font-medium text-ink-3">disabled</span>
            <input disabled placeholder="입력 불가" className="w-full cursor-not-allowed rounded-btn border border-line bg-grey-50 px-4 py-3 text-body text-grey-400" />
          </label>
        </div>
      </Section>

      {/* ── 아코디언 + 셀렉트 ── */}
      <Section id="accordion" title="아코디언 / 셀렉트">
        <div className="divide-y divide-line rounded-card border border-line bg-white">
          {[
            ['유치원 — 처음학교로 추첨·등록', '오후 6시 등록 마감 함정, 추첨 일정을 미리 알려드려요.'],
            ['초등 — 취학통지·예비소집', '예비소집은 꼭 참석해야 해요. 4~6세 추가 접종도 함께 확인하세요.'],
          ].map(([summary, body], i) => (
            <details key={summary} className="group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-card-title text-ink transition hover:bg-grey-50">
                {summary}
                <span className="text-ink-3 transition group-open:rotate-180">⌄</span>
              </summary>
              <div className="px-5 pb-4 text-body text-ink-2">{body}</div>
            </details>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-5">
          <div className="relative">
            <select className="appearance-none rounded-btn border border-line bg-white py-3 pl-4 pr-10 text-body text-ink transition hover:bg-grey-50 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20">
              <option>전체 지역</option>
              <option>서울</option>
              <option>경기</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3">⌄</span>
          </div>
        </div>
      </Section>
    </main>
  );
}
