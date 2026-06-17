-- 보안: 전 테이블 Row Level Security ENABLE (정책 0개 = deny-all).
--
-- 배경: Prisma migrate로 만든 테이블은 RLS가 기본 OFF다. Supabase 프로젝트는
-- PostgREST Data API를 공개 anon(publishable) 키로 노출하므로, RLS가 OFF면
-- 누구나 anon 키(웹 번들에 공개)로 https://<proj>.supabase.co/rest/v1/<table>
-- 에 직접 접근해 Subscriber(이메일) 등 모든 데이터를 읽고/쓸 수 있다.
--
-- 본 앱의 데이터 경로는 Prisma → DATABASE_URL(테이블 owner 자격 직접 연결)뿐이라
-- RLS를 켜도 영향 없음(owner 는 RLS 우회. FORCE 는 쓰지 않음). 정책을 0개로 두면
-- PostgREST의 anon/authenticated 롤은 전부 거부된다 = Data API 차단.
--
-- 향후 클라이언트가 Supabase를 직접 써야 하면(예: 소셜 로그인 후 본인 데이터),
-- 그때 해당 테이블에 한정 정책(예: authUserId = auth.uid())을 추가한다.

ALTER TABLE "Article" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReservableVenue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Book" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyIssue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IssueArticle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
