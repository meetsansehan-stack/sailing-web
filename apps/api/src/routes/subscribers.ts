import { Hono } from 'hono';
import { prisma } from '@parenting-newsletter/db';
import { adminAuth } from '../middleware/admin';

// 이메일 구독 — 라이트 계정(오디언스·메일 토대)의 첫 조각.
// 서버엔 부모 신원(이메일·동의)만, 아동 PII 0 (docs/PRIVACY, [[mvp-account-data-architecture]]).
// 소셜 로그인은 후속 — email = 첫 로그인 시 authUserId 연결 다리.

const app = new Hono();

// 가벼운 이메일 형식 검증 (RFC 완전 준수 아님 — 명백한 오타·빈값 거르기 목적)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/subscribers — 구독(멱등: 같은 이메일 재구독 시 동의·메타 갱신)
app.post('/', async (c) => {
  let body: { email?: unknown; source?: unknown; anonId?: unknown; consent?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return c.json({ error: 'Invalid email' }, 400);
  }

  // 동의는 기본 true (구독 행위 자체가 동의), 명시 false면 거부
  const consent = body.consent === false ? false : true;
  if (!consent) {
    return c.json({ error: 'Consent required' }, 400);
  }

  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : null;
  const anonId = typeof body.anonId === 'string' ? body.anonId.slice(0, 64) : null;

  try {
    const existing = await prisma.subscriber.findUnique({ where: { email }, select: { id: true } });
    const sub = await prisma.subscriber.upsert({
      where: { email },
      create: { email, consent, consentAt: new Date(), source, anonId },
      // 재구독: 동의 시각·유입·익명연결만 갱신 (이메일은 키라 불변)
      update: { consent, consentAt: new Date(), source: source ?? undefined, anonId: anonId ?? undefined },
    });
    return c.json({ ok: true, id: sub.id, alreadySubscribed: existing !== null }, 200);
  } catch (err) {
    console.error('[subscribers] upsert failed', err);
    return c.json({ error: 'Internal error' }, 500);
  }
});

// DELETE /api/subscribers/:id — 구독 해지 (수신거부 토대). 무단 삭제 차단 위해 admin 인증.
// (유저향 1-클릭 수신거부는 V2에서 서명 토큰 방식으로 별도 구현.)
app.delete('/:id', adminAuth, async (c) => {
  const id = c.req.param('id');
  try {
    await prisma.subscriber.delete({ where: { id } });
    return c.json({ ok: true }, 200);
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }
});

export default app;
