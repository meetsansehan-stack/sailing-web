import type { Metadata } from 'next';

// 운영자 전용 분석 대시보드 (익명 집계). 서버 컴포넌트라 ADMIN_API_TOKEN은 브라우저에 안 나감.
// 접근 게이트: ?key=<ADMIN_API_TOKEN> 일치해야 데이터 노출(PREVIEW_TOKEN과 같은 결, 베타 약식).
// 정식 운영자 인증(소셜 로그인)은 후속. robots는 색인 제외(robots.ts에서 /dashboard disallow).

export const metadata: Metadata = { title: '운영 대시보드', robots: { index: false, follow: false } };

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001';

type Summary = {
  generatedAt: string;
  windowDays: number;
  subscribers: { total: number; last7d: number; last30d: number };
  events: { total: number; uniqueVisitors: number; byType: Record<string, number> };
  sessions: { count: number; pageViewsPerSession: number; avgDwellMs: number | null; dwellSamples: number; avgScrollPct: number | null };
  funnel: { impressions: number; clicks: number; subscribes: number; clickRate: number; subscribeRate: number };
  dailyPageViews: Array<{ date: string; count: number }>;
  topPaths: Array<{ path: string; count: number }>;
  survey: { total: number; byAnswer: Array<{ answer: string; count: number; pct: number }>; seanEllisPct: number | null };
  retentionCohorts: Array<{
    cohortWeek: string;
    cohortSize: number;
    weeks: Array<{ weekNum: number; retained: number; pct: number }>;
  }>;
};

async function fetchSummary(token: string): Promise<Summary | null> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/summary?days=30`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return res.ok ? ((await res.json()) as Summary) : null;
  } catch {
    return null;
  }
}

const SURVEY_LABELS: Record<string, string> = {
  very_disappointed: '매우 아쉬울 것 같아요',
  somewhat_disappointed: '조금 아쉬울 것 같아요',
  not_disappointed: '별로 안 아쉬울 것 같아요',
  has_alternative: '이미 비슷한 걸 쓰고 있어요',
  dismissed: '설문 닫음',
};

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const num = (n: number) => n.toLocaleString('ko-KR');
const dwell = (ms: number | null) => {
  if (ms === null) return '-';
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}분 ${s % 60}초` : `${s}초`;
};

export default async function Dashboard({ searchParams }: { searchParams?: { key?: string } }) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token || searchParams?.key !== token) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-h3 font-bold text-ink">운영자 전용</p>
        <p className="mt-2 text-body text-ink-3">
          {token ? '접근 키가 필요해요. ?key=… 를 확인해 주세요.' : 'ADMIN_API_TOKEN이 설정되지 않았어요.'}
        </p>
      </div>
    );
  }

  const d = await fetchSummary(token);
  if (!d) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-h3 font-bold text-ink">집계를 불러오지 못했어요</p>
        <p className="mt-2 text-body text-ink-3">API 서버 상태를 확인해 주세요.</p>
      </div>
    );
  }

  const pageViews = d.events.byType['page_view'] ?? 0;
  const maxDaily = Math.max(1, ...d.dailyPageViews.map((x) => x.count));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-h2 font-bold text-ink">운영 대시보드</h1>
        <p className="text-small text-ink-3">최근 {d.windowDays}일 · 익명 집계 · PII 0</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="총 구독자" value={num(d.subscribers.total)} sub={`최근 7일 +${num(d.subscribers.last7d)}`} />
        <Stat label="고유 방문자" value={num(d.events.uniqueVisitors)} sub={`${d.windowDays}일`} />
        <Stat label="페이지뷰" value={num(pageViews)} sub={`이벤트 ${num(d.events.total)}건`} />
        <Stat
          label="노출→구독 전환"
          value={pct(d.funnel.impressions ? d.funnel.subscribes / d.funnel.impressions : 0)}
          sub={`구독 ${num(d.funnel.subscribes)}`}
        />
      </div>

      <section className="rounded-card border border-line bg-white p-6">
        <h2 className="mb-4 text-card-title font-bold text-ink">세션·몰입</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="세션 수" value={num(d.sessions.count)} sub={`최근 ${d.windowDays}일`} />
          <Stat label="세션당 페이지뷰" value={d.sessions.pageViewsPerSession.toFixed(1)} sub="둘러보기 깊이" />
          <Stat
            label="평균 체류시간"
            value={dwell(d.sessions.avgDwellMs)}
            sub={`표본 ${num(d.sessions.dwellSamples)}`}
          />
          <Stat
            label="평균 스크롤 깊이"
            value={d.sessions.avgScrollPct !== null ? `${d.sessions.avgScrollPct}%` : '-'}
            sub="page_exit 기준"
          />
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-6">
        <h2 className="mb-4 text-card-title font-bold text-ink">구독 퍼널</h2>
        <div className="flex flex-wrap items-center gap-3 text-body">
          <FunnelStep label="CTA 노출" value={d.funnel.impressions} />
          <Arrow rate={pct(d.funnel.clickRate)} />
          <FunnelStep label="클릭" value={d.funnel.clicks} />
          <Arrow rate={pct(d.funnel.subscribeRate)} />
          <FunnelStep label="구독 완료" value={d.funnel.subscribes} highlight />
        </div>
      </section>

      <section className="rounded-card border border-line bg-white p-6">
        <h2 className="mb-4 text-card-title font-bold text-ink">일별 페이지뷰 (최근 14일)</h2>
        {d.dailyPageViews.length === 0 ? (
          <p className="text-body text-ink-3">아직 데이터가 없어요.</p>
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {d.dailyPageViews.map((x) => (
              <div key={x.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-small text-ink-3">{x.count}</span>
                <div className="w-full rounded-t bg-blue" style={{ height: `${(x.count / maxDaily) * 100}%` }} />
                <span className="text-small text-ink-3">{x.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard title="인기 경로" rows={d.topPaths.map((p) => [p.path, num(p.count)])} empty="방문 기록 없음" />
        <ListCard
          title="이벤트 타입별"
          rows={Object.entries(d.events.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([t, c]) => [t, num(c)])}
          empty="이벤트 없음"
        />
      </div>

      {/* Sean Ellis micro-survey 결과 */}
      <section className="rounded-card border border-line bg-white p-6">
        <h2 className="mb-1 text-card-title font-bold text-ink">PMF 설문 (Sean Ellis)</h2>
        <p className="mb-4 text-small text-ink-3">
          응답 {num(d.survey.total)}건
          {d.survey.seanEllisPct !== null && (
            <> · <span className={d.survey.seanEllisPct >= 40 ? 'font-semibold text-green-600' : 'font-semibold text-red-500'}>
              매우 아쉬움 {d.survey.seanEllisPct}%
            </span> (목표 ≥ 40%)</>
          )}
        </p>
        {d.survey.total === 0 ? (
          <p className="text-body text-ink-3">아직 응답이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {d.survey.byAnswer.map((r) => (
              <li key={r.answer} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-small text-ink-2">{SURVEY_LABELS[r.answer] ?? r.answer}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-grey-100">
                  <div className="h-full rounded-full bg-blue" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="w-16 text-right text-small font-semibold text-ink">{r.pct}% ({r.count})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 주간 리텐션 코호트 */}
      <section className="rounded-card border border-line bg-white p-6">
        <h2 className="mb-1 text-card-title font-bold text-ink">주간 리텐션 코호트</h2>
        <p className="mb-4 text-small text-ink-3">첫 방문 주(코호트) 기준 후속 주 재방문률 — 최근 8주</p>
        {d.retentionCohorts.length === 0 ? (
          <p className="text-body text-ink-3">아직 데이터가 없어요.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-line">
                  <th className="pb-2 pr-4 text-left font-semibold text-ink-3">코호트</th>
                  <th className="pb-2 pr-3 text-right font-semibold text-ink-3">크기</th>
                  {Array.from({ length: Math.max(...d.retentionCohorts.map((c) => c.weeks.length)) }, (_, i) => (
                    <th key={i} className="pb-2 px-2 text-center font-semibold text-ink-3">W{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.retentionCohorts.map((cohort) => (
                  <tr key={cohort.cohortWeek} className="border-b border-line/50">
                    <td className="py-2 pr-4 text-ink-2">{cohort.cohortWeek.slice(5)}</td>
                    <td className="py-2 pr-3 text-right text-ink">{cohort.cohortSize}</td>
                    {cohort.weeks.map((w) => (
                      <td key={w.weekNum} className="px-2 py-2 text-center">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-small font-semibold ${
                          w.weekNum === 0 ? 'bg-blue-100 text-blue-700'
                          : w.pct >= 30 ? 'bg-green-100 text-green-700'
                          : w.pct > 0 ? 'bg-grey-100 text-ink-2'
                          : 'text-ink-3'
                        }`}>
                          {w.pct > 0 ? `${w.pct}%` : '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-small text-ink-3">생성 {new Date(d.generatedAt).toLocaleString('ko-KR')}</p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-5">
      <p className="text-meta font-semibold text-ink-3">{label}</p>
      <p className="mt-1 text-h1 font-bold text-ink">{value}</p>
      <p className="mt-1 text-small text-ink-3">{sub}</p>
    </div>
  );
}

function FunnelStep({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-card px-4 py-3 text-center ${highlight ? 'bg-blue-50' : 'bg-grey-50'}`}>
      <p className="text-h3 font-bold text-ink">{num(value)}</p>
      <p className="text-small text-ink-3">{label}</p>
    </div>
  );
}

function Arrow({ rate }: { rate: string }) {
  return <span className="text-small font-medium text-ink-3">→ {rate}</span>;
}

function ListCard({ title, rows, empty }: { title: string; rows: Array<[string, string]>; empty: string }) {
  return (
    <section className="rounded-card border border-line bg-white p-6">
      <h2 className="mb-3 text-card-title font-bold text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-body text-ink-3">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-4 text-body">
              <span className="truncate text-ink-2">{k}</span>
              <span className="font-semibold text-ink">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
