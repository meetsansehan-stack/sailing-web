import type { Context, Next } from 'hono';
import { timingSafeEqual } from 'node:crypto';

// 운영·뮤테이션(파이프라인·에이전트·QA·구독 삭제 등) 엔드포인트 보호.
// 인증 토큰(ADMIN_API_TOKEN) Bearer 헤더 검증.
//   - fail-closed: ADMIN_API_TOKEN 미설정이면 전부 거부(503) — 실수로 무인증 노출되는 일 방지.
//   - 비용 DoS 차단: research/pipeline 트리거는 회당 LLM 토큰 비용이 큼.
// 공개 엔드포인트(GET articles/issues/venues/books, POST subscribers/analytics)에는 적용 안 함.

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  // 길이가 다르면 timingSafeEqual이 throw → 먼저 거른다(길이 노출은 무시 가능 수준).
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function adminAuth(c: Context, next: Next): Promise<Response | void> {
  const expected = process.env.ADMIN_API_TOKEN;
  if (!expected) {
    return c.json({ error: 'Admin API not configured' }, 503);
  }

  const header = c.req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !safeEqual(token, expected)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
}
