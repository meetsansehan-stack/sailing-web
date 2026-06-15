// 익명 제품 분석 클라이언트 — PII 0, 익명 기기 난수(anonId)만.
// 서버 /api/analytics로 fire-and-forget 전송. 실패해도 제품 흐름 안 막음.
// [[mvp-account-data-architecture]]: 익명 분석 day1·계정 무관.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const ANON_KEY = 'sailing.anonId';

export type AnalyticsType =
  | 'page_view'
  | 'cta_impression'
  | 'cta_click'
  | 'cta_dismiss'
  | 'subscribe_success'
  | 'article_open'
  | 'outbound_click';

// 익명 기기 식별자 — localStorage 1회 생성. 개인정보 아님(난수). SSR 안전(window 가드).
export function getAnonId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `a_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return ''; // localStorage 차단 환경(사파리 프라이빗 등) — 추적 포기, 흐름은 유지
  }
}

// 이벤트 전송 — sendBeacon 우선(언로드 안전), 폴백 fetch keepalive. await 불필요.
export function track(type: AnalyticsType, meta?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  const anonId = getAnonId();
  if (!anonId) return;

  const payload = JSON.stringify({
    type,
    anonId,
    path: window.location.pathname,
    meta,
  });
  const url = `${API_BASE}/api/analytics`;

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  // 폴백
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
