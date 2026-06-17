import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 서버 전용 — RLS 우회(secret key). 라우트 핸들러·서버 액션·백엔드에서만 사용. 브라우저 노출 금지.
// 환경 변수명은 legacy(service_role) 명칭 유지하되 값은 신규 secret 키 (2026-05-19 rotation).
//
// footgun 가드: 이 모듈이 클라이언트 번들에 끌려오면 즉시 throw. SUPABASE_SERVICE_ROLE_KEY는
// non-NEXT_PUBLIC이라 브라우저에선 어차피 undefined지만, 실수로 import하는 순간 명확히 실패시켜
// secret 의존 코드가 클라로 새는 걸 빌드/런타임에서 잡는다. (server-only 패키지 미설치라 런타임 가드)
if (typeof window !== 'undefined') {
  throw new Error('supabase.server는 서버 전용입니다. 클라이언트에서는 supabase.browser를 쓰세요.');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _serverClient: SupabaseClient | null = null;
export function getSupabaseServerClient(): SupabaseClient {
  if (_serverClient) return _serverClient;
  if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!SUPABASE_SECRET) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  _serverClient = createClient(SUPABASE_URL, SUPABASE_SECRET, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _serverClient;
}
