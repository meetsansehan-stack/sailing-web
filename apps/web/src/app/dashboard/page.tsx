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
  funnel: { impressions: number; clicks: number; subscribes: number; clickRate: number; subscribeRate: number };
  dailyPageViews: Array<{ date: string; count: number }>;
  topPaths: Array<{ path: string; count: number }>;
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

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const num = (n: number) => n.toLocaleString('ko-KR');

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
