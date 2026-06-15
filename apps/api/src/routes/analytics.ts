import { Hono } from 'hono';
import { prisma, Prisma } from '@parenting-newsletter/db';

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
app.post('/', async (c) => {
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
  // meta는 JSON 객체만(중첩·문자열 제한 없이 받되, PII 없도록 클라가 책임)
  const meta =
    body.meta && typeof body.meta === 'object' && !Array.isArray(body.meta)
      ? (body.meta as Record<string, unknown>)
      : undefined;

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

export default app;
