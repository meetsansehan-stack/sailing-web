import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 환경 변수명은 legacy(anon/service_role) 명칭 유지하지만, 값은 신규 publishable/secret 키.
// 2026-05-19 rotation에서 legacy 발급 중단됨. [[project-supabase-rotation-pending]]

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireUrl(): string {
  if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return SUPABASE_URL;
}

/**
 * 브라우저·SSR 둘 다에서 안전하게 호출 가능한 클라이언트 (publishable key 사용).
 * RLS 정책으로 보호되는 데이터에만 접근. anon/authenticated 권한.
 */
let _browserClient: SupabaseClient | null = null;
export function getSupabaseBrowserClient(): SupabaseClient {
  if (_browserClient) return _browserClient;
  if (!SUPABASE_PUBLISHABLE) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  _browserClient = createClient(requireUrl(), SUPABASE_PUBLISHABLE);
  return _browserClient;
}

/**
 * 서버 전용 — RLS 우회 (secret key). 라우트 핸들러·서버 액션·에이전트 파이프라인 등 백엔드에서만 사용.
 * 브라우저에 노출되면 안 됨.
 */
let _serverClient: SupabaseClient | null = null;
export function getSupabaseServerClient(): SupabaseClient {
  if (_serverClient) return _serverClient;
  if (!SUPABASE_SECRET) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  _serverClient = createClient(requireUrl(), SUPABASE_SECRET, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _serverClient;
}
