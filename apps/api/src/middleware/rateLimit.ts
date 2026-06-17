import type { MiddlewareHandler } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';

// in-memory 고정창(fixed-window) rate limiter.
// 공개·무인증 POST(구독·분석)의 스팸·enumeration 폭주 방어 — closed 베타엔 후순위였으나 공개 오픈 전 필수.
//
// ⚠️ 단일 인스턴스 전제(현 Railway 단일 프로세스 배포). 카운터가 프로세스 메모리에 있어
//    가로 확장(다중 인스턴스)하면 인스턴스별로 독립 카운트 → 실효 한도가 N배가 됨.
//    그때는 Redis 등 공유 저장소로 교체. MVP/단일 인스턴스엔 충분.

type Bucket = { count: number; resetAt: number };

function clientIp(headerVal: string | undefined, fallback: () => string): string {
  // 프록시(Railway·Vercel) 뒤에선 connection IP가 프록시라 X-Forwarded-For 첫 홉을 신뢰.
  // 로컬·프록시 없음이면 conninfo의 remote address로 폴백.
  if (headerVal) {
    const first = headerVal.split(',')[0]?.trim();
    if (first) return first;
  }
  return fallback();
}

export function rateLimit(opts: { windowMs: number; max: number; name: string }): MiddlewareHandler {
  const { windowMs, max, name } = opts;
  const buckets = new Map<string, Bucket>();
  let lastSweep = 0;

  return async (c, next) => {
    const now = Date.now();

    // 주기적 청소(만료 버킷 제거) — 무한 IP 누적으로 인한 메모리 누수 방지
    if (now - lastSweep > windowMs) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      lastSweep = now;
    }

    const ip = clientIp(c.req.header('x-forwarded-for'), () => {
      try {
        return getConnInfo(c).remote.address ?? 'unknown';
      } catch {
        return 'unknown';
      }
    });

    const key = `${name}:${ip}`;
    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count++;

    if (b.count > max) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({ error: 'Too many requests' }, 429);
    }

    await next();
  };
}
