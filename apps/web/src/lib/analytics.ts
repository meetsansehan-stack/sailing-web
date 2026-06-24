// 익명 제품 분석 클라이언트 — PII 0, 익명 기기 난수(anonId)만.
// 서버 /api/analytics로 fire-and-forget 전송. 실패해도 제품 흐름 안 막음.
// [[mvp-account-data-architecture]]: 익명 분석 day1·계정 무관.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const ANON_KEY = 'sailing.anonId';
const SESSION_KEY = 'sailing.session';
const SESSION_TTL = 30 * 60 * 1000; // 30분 비활성 → 새 세션 (GA식 세션 정의)

export type AnalyticsType =
  | 'page_view'
  | 'page_exit' // 페이지 이탈 — 체류시간(durationMs) + scrollDepthPct 동반
  | 'cta_impression'
  | 'cta_click'
  | 'cta_dismiss'
  | 'subscribe_success'
  | 'article_open'
  | 'outbound_click'
  | 'survey_response'; // Sean Ellis / WTP micro-survey 응답

function randomId(prefix: string): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

// 익명 기기 식별자 — localStorage 1회 생성. 개인정보 아님(난수). SSR 안전(window 가드).
export function getAnonId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id = randomId('a');
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return ''; // localStorage 차단 환경(사파리 프라이빗 등) — 추적 포기, 흐름은 유지
  }
}

// 세션 식별자 — 30분 비활성마다 갱신. 세션화(세션 수·세션당 PV·이탈)용. 익명 난수.
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const now = Date.now();
    const raw = window.localStorage.getItem(SESSION_KEY);
    let id = '';
    let last = 0;
    if (raw) {
      const p = JSON.parse(raw) as { id?: string; last?: number };
      id = p.id ?? '';
      last = p.last ?? 0;
    }
    if (!id || now - last > SESSION_TTL) id = randomId('s');
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: now }));
    return id;
  } catch {
    return '';
  }
}

// 이벤트 전송 — sendBeacon 우선(언로드 안전), 폴백 fetch keepalive. await 불필요.
// opts.path = 경로 override(이탈 시 진입 경로 보존), opts.durationMs = 체류시간(page_exit).
export function track(
  type: AnalyticsType,
  meta?: Record<string, unknown>,
  opts?: { path?: string; durationMs?: number },
): void {
  if (typeof window === 'undefined') return;
  const anonId = getAnonId();
  if (!anonId) return;

  const payload = JSON.stringify({
    type,
    anonId,
    sessionId: getSessionId(),
    path: opts?.path ?? window.location.pathname,
    meta,
    ...(typeof opts?.durationMs === 'number' ? { durationMs: opts.durationMs } : {}),
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
