# 베타 오픈 준비 체크리스트

> 단일 소스. 베타 = "공개 오픈"이 아니라 **단계적 베타**(2026-06-15 확정).
> 상태 범례: ✅ 완료 · 🟡 부분/준비됨 · 🔲 미착수 · ⚠️ 재검토/리스크.
> **2026-06-28 전면 갱신** — 배포 완료 기준으로 Phase B 진입 상태 반영.

## 프레이밍 — 단계적 베타 (3 Phase, 각자 게이트)

| Phase | 무엇 | 목표(잡) | 상태 |
|---|---|---|---|
| **A 로컬 데모** | 배포 0, 로컬에서 지인·인터뷰이 시연 | **제품 검증**(공명 시그널) | ✅ 가능(완료) |
| **B 클로즈드 초대** | 배포 + 소수(10~30) 초대 | **리텐션·공명 실측** | 🟡 **진입 중** — 인프라 완료, 콘텐츠·계정 남음 |
| **C 공개 오픈** | 누구나 + SEO·유통 | **획득** | 🔲 도메인·CWV 후 |

---

## Phase A — 로컬 데모 ✅ 완료

### 콘텐츠·운영
- [x] ✅ 발행 게이트(draft/published) — 미검수 자동공개 0.
- [x] ✅ 매일 발행 루틴 — `pipeline:daily` → 검토 → `pipeline:publish`. Railway 크론(KST 00:00) 내장 + auto-publish.
- [ ] 🟡 아카이브 두께 — 인터뷰·시연 때 "빈 사이트"로 안 보이게 1~2주치 권장. **운영 지속 중**.

### QA·UX
- [x] ✅ 핵심 라우트 200 일괄 점검 — `/`·`/issues`·`/issues/[date]`·`/articles/[id]`·`/radar`·`/reservations`·`/collections` 전부 정상.
- [x] ✅ 모바일 반응형 — mobile-first 그리드, 필터탭·캘린더 확인.
- [x] ✅ 빈/에러 상태 graceful — not-found·error.tsx, 빈 /issues 폴백.

### 측정·검증 설계
- [x] ✅ 핵심 지표 정의 — `docs/METRICS.md`: 북극성·AARRR컷·공명지표·Sean Ellis 40%·kill/learn.
- [x] ✅ 인터뷰 코딩 시트 — `docs/ICP_INTERVIEW.md` §8(The Mom Test·판정 기준).

### 획득(검증) — 인터뷰
- [ ] 🟡 인터뷰 자극물 = 배포 URL + `docs/ICP_INTERVIEW.md`·`ICP_SURVEY.md`.
- [ ] 🔲 지인 밖 5~10명 모집(7세 예비초1 니치 우선).
- [ ] 🔲 서베이 배포(구글폼판) + 핫 ICP 인터뷰.

---

## Phase B — 클로즈드 초대 🟡 진입 중

### 배포·인프라 ✅ 전부 완료
- [x] ✅ Railway(API) 배포 — `https://parenting-newsletterapi-production.up.railway.app` 정상.
- [x] ✅ Vercel(Web) 배포 — `https://sailing-web-web.vercel.app` 정상.
- [x] ✅ GitHub 자동배포 웹훅 — `meetsansehan-stack/sailing-web` 연결, main push → 자동배포 확인(2026-06-28).
- [x] ✅ CORS — `CORS_ALLOWED_ORIGINS=https://sailing-web-web.vercel.app` (Railway), `*` 아님.
- [x] ✅ 웹↔API 연결 — 운영 홈에서 실기사 SSR 렌더링 확인(2026-06-28).
- [x] ✅ PREVIEW_TOKEN / ADMIN_API_TOKEN — 64자 강한 랜덤값(2026-06-28 확인).
- [x] ✅ 백업 — `db:backup`/`db:restore`(Prisma→JSON 9모델, 라운드트립 검증). `docs/BACKUP.md`.
- [ ] 🟡 Supabase 플랫폼 백업(1차) — 대시보드서 사용자가 직접 활성화 필요.
- [ ] 🔲 최소 에러 모니터링(Sentry 또는 Railway 로그 루틴).

### 법무·프라이버시·보안 ✅ 대부분 완료
- [x] ✅ 개인정보처리방침 `/privacy` — 실 수집 데이터 기반, 사업자정보·보호책임자·위탁업체 실값 기입 완료.
- [x] ✅ 동의 UX — SubscribeCTA 처리방침·약관 동의 간주 + 만 14세 이상 문구.
- [x] ✅ 이용약관 `/terms` — 정보제공 면책·지식재산권·준거법.
- [x] ✅ 아동 PII 0 — Subscriber=부모 이메일·동의만, AnalyticsEvent=익명 anonId·meta만. 생일·발달·진단 서버 0.
- [x] ✅ 익명 재식별 불가 — anonId=클라 생성 난수, meta 2KB 상한.
- [x] ✅ 보안 검토 1차 (2026-06-17) — adminAuth fail-closed, rate limit(subscribe 5회/10분·analytics 100회/분), enumeration 제거, supabase.ts 분리.
- [x] ✅ Supabase RLS — 운영 DB 전 10개 테이블 rowsecurity=ON 확인(2026-06-28).
- [x] ✅ Next.js 15 — SSRF/DoS 취약점 패치 버전(15.5.19) 적용.
- [x] ✅ hono 4.12.25 — CORS 취약점 패치.
- [ ] ⚠️ 이미지 저작권 — 원문 og:image 핫링킹. Phase C 전 결론 필요.
- [ ] ⚠️ 출시 전 법무 검토 1회 — CLAUDE.md 의무사항.

### 계정·온보딩
- [x] ✅ 익명 읽기 먼저(획득 안 막음) — 기본 동작.
- [ ] 🔲 라이트 소셜 로그인(카카오·구글) — 현 `/login` 스텁. 구독·저장 시점 유도. (보류 중 — 배포 후 redirect URL 확정 후 착수)
- [ ] 🔲 연령·지역 개인화 = **로컬(클라)** — V1 핵심, 서버 PII 0. MVP 출시 후로 미룸.
- [ ] 🔲 가벼운 온보딩 — 강한 온보딩 동결(검증 우선).

### 분석 적재 ✅ 전부 완료
- [x] ✅ 익명 분석 day1 — page_view·cta 퍼널·outbound_click·page_exit. PII 0.
- [x] ✅ 세션화 + 체류시간(durationMs) + 스크롤 깊이(scrollDepthPct) — METRICS §7.
- [x] ✅ in-app micro-survey — Sean Ellis 40% 1문항(세션 3PV+8초, 1기기 1회).
- [x] ✅ 리텐션 코호트 — 주간 재방문률, 대시보드 8주 테이블.
- [x] ✅ 운영 대시보드 `/dashboard?key=` — 구독 퍼널·일별 추이·세션·인기 경로·survey 결과·코호트.

### 브랜드·고객 접점 ✅ 완료
- [x] ✅ 파비콘(돛단배 SVG)·OG 카드(1200×630)·PWA manifest.
- [x] ✅ About 실콘텐츠, Footer 문의메일·사업자.
- [x] ✅ 전용 이메일 `with.sailing@gmail.com` 배선.

---

## Phase C — 공개 오픈 🔲 준비 중

### SEO 골격 ✅ 완료
- [x] ✅ `sitemap.ts` — 정적 9페이지 + 발행 이슈·기사 동적(2026-06-17).
- [x] ✅ `robots.ts` — /dashboard·/style·/login disallow + sitemap 링크.
- [x] ✅ per-page generateMetadata + OG·twitter 카드 — 기사·이슈 상세, 카카오 공유(2026-06-17).
- [ ] 🔲 구글 서치콘솔 등록.
- [ ] 🔲 네이버 서치어드바이저 등록.
- [ ] 🔲 JSON-LD(Article·Event)·CWV 튜닝·내부 링크(후속).

### 유통·시즌
- [x] ✅ 캘린더 배너 실데이터 배선 — eventStartDate·eventEndDate·deadline span 모델.
- [x] ✅ /radar 미리 준비 허브 — live 2개(summer·admission) + soon 예고편.
- [ ] 🔲 시즌 앵커 콘텐츠 — 여름 무료 물놀이 → 9월 처음학교로 "미리 준비" 전환.
- [ ] 🔲 초대 → 공개 확장 채널 문구.

### 도메인·브랜드
- [ ] 🔲 도메인 구매(Cloudflare/.com 또는 가비아/.co.kr) + DNS.
- [ ] 🔲 CORS 도메인 추가(`CORS_ALLOWED_ORIGINS`에 실 도메인 append).

### 성능·신뢰
- [ ] 🔲 CWV 기본 통과.
- [x] ✅ 출처 등급 배지 — `credibility.ts` 구현·노출.
- [ ] 🔲 접근성 기본(aria) 점검.
