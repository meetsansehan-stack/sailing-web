import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// 브라우저·SSR 둘 다에서 안전한 클라이언트 (publishable key). RLS 정책으로 보호되는 데이터만 접근.
// 환경 변수명은 legacy(anon) 명칭 유지하되 값은 신규 publishable 키 (2026-05-19 rotation). [[project-supabase-rotation-pending]]
// ⚠️ 서버 전용 secret 클라이언트는 ./supabase.server 에 분리 — 같은 파일에 두지 말 것(secret 번들 footgun).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _browserClient: SupabaseClient | null = null;
export function getSupabaseBrowserClient(): SupabaseClient {
  if (_browserClient) return _browserClient;
  if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!SUPABASE_PUBLISHABLE) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  _browserClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE);
  return _browserClient;
}
