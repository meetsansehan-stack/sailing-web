import { Hono } from 'hono';
import { prisma, Prisma } from '@parenting-newsletter/db';
import { rateLimit } from '../middleware/rateLimit';
import { adminAuth } from '../middleware/admin';

// 익명 제품 분석 — 출시 1일차, 계정 무관 ([[mvp-account-data-architecture]]).
// PII 0: 익명 기기 난수(anonId)만. 퍼널·전환·CTA 측정용. 식별 데이터 절대 금지.

const app = new Hono();

// 화이트리스트 — 임의 type 폭주 방지(스키마 없는 자유 텍스트라 enum 대신 코드 가드)
const ALLOWED_TYPES = new Set([
  'page_view',
  'cta_impression',
  'cta_click',
  'cta_dismiss',
  'subscribe_success',
  'article_open',
  'outbound_click',
]);

// POST /api/analytics — 익명 이벤트 적재(fire-and-forget, 실패해도 클라 흐름 안 막음)
// rate limit: page_view·cta·outbound 등 한 세션이 수십 건 → 100건/분이면 사람 활동엔 넉넉, 봇 플러딩만 차단.
app.post('/', rateLimit({ name: 'analytics', windowMs: 60 * 1000, max: 100 }), async (c) => {
  let body: { type?: unknown; anonId?: unknown; path?: unknown; meta?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const type = typeof body.type === 'string' ? body.type : '';
  const anonId = typeof body.anonId === 'string' ? body.anonId.trim() : '';
  if (!ALLOWED_TYPES.has(type) || !anonId || anonId.length > 64) {
    return c.json({ error: 'Invalid event' }, 400);
  }

  const path = typeof body.path === 'string' ? body.path.slice(0, 256) : null;
  // meta는 JSON 객체만(작은 부가정보 — cta 위치 등). PII 없도록 클라가 책임.
  // 무제한 적재 = 저장 DoS라 직렬화 크기 2KB 상한(초과 시 meta 버림, 이벤트는 적재).
  let meta: Record<string, unknown> | undefined;
  if (body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)) {
    const candidate = body.meta as Record<string, unknown>;
    if (JSON.stringify(candidate).length <= 2048) meta = candidate;
  }

  try {
    await prisma.analyticsEvent.create({
      data: { type, anonId, path, meta: (meta ?? Prisma.JsonNull) as Prisma.InputJsonValue },
    });
  } catch (err) {
    // 분석 적재 실패는 조용히 삼킴 — 제품 흐름보다 우선순위 낮음
    console.error('[analytics] create failed', err);
  }
  // 항상 204 — 클라는 응답 본문 안 봄(sendBeacon)
  return c.body(null, 204);
});

// GET /api/analytics/summary — 운영자 대시보드용 집계(admin 전용). 익명 집계만 반환(PII 0).
// ?days=N(기본 30, 1~90)으로 이벤트 윈도 조정. 구독자는 전체·7일·30일.
app.get('/summary', adminAuth, async (c) => {
  const days = Math.min(Math.max(Number(c.req.query('days')) || 30, 1), 90);
  const now = Date.now();
  const windowStart = new Date(now - days * 86_400_000);
  const d7 = new Date(now - 7 * 86_400_000);
  const d30 = new Date(now - 30 * 86_400_000);
  const dailyStart = new Date(now - 14 * 86_400_000); // 추이 차트는 최근 14일 고정

  try {
    const [
      subTotal,
      sub7,
      sub30,
      typeGroups,
      distinctVisitors,
      pathGroups,
      daily,
    ] = await Promise.all([
      prisma.subscriber.count(),
      prisma.subscriber.count({ where: { createdAt: { gte: d7 } } }),
      prisma.subscriber.count({ where: { createdAt: { gte: d30 } } }),
      prisma.analyticsEvent.groupBy({
        by: ['type'],
        where: { createdAt: { gte: windowStart } },
        _count: { _all: true },
      }),
      prisma.analyticsEvent.findMany({
        where: { createdAt: { gte: windowStart } },
        distinct: ['anonId'],
        select: { anonId: true },
      }),
      prisma.analyticsEvent.groupBy({
        by: ['path'],
        where: { type: 'page_view', createdAt: { gte: windowStart }, path: { not: null } },
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 8,
      }),
      // 일별 페이지뷰 추이 (KST 기준 날짜 버킷)
      prisma.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT to_char(date_trunc('day', "createdAt" AT TIME ZONE 'Asia/Seoul'), 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS count
        FROM "AnalyticsEvent"
        WHERE type = 'page_view' AND "createdAt" >= ${dailyStart}
        GROUP BY date ORDER BY date ASC
      `,
    ]);

    const byType: Record<string, number> = {};
    for (const g of typeGroups) byType[g.type] = g._count._all;

    const impressions = byType['cta_impression'] ?? 0;
    const clicks = byType['cta_click'] ?? 0;
    const subscribes = byType['subscribe_success'] ?? 0;

    return c.json({
      generatedAt: new Date(now).toISOString(),
      windowDays: days,
      subscribers: { total: subTotal, last7d: sub7, last30d: sub30 },
      events: {
        total: Object.values(byType).reduce((a, b) => a + b, 0),
        uniqueVisitors: distinctVisitors.length,
        byType,
      },
      funnel: {
        impressions,
        clicks,
        subscribes,
        clickRate: impressions ? clicks / impressions : 0,
        subscribeRate: clicks ? subscribes / clicks : 0,
      },
      dailyPageViews: daily.map((d) => ({ date: d.date, count: Number(d.count) })),
      topPaths: pathGroups.map((g) => ({ path: g.path as string, count: g._count.path })),
    });
  } catch (err) {
    console.error('[analytics] summary failed', err);
    return c.json({ error: 'Internal error' }, 500);
  }
});

export default app;
