# 페런트웹 아키텍처 방향

> 작성일: 2026-05-13 · 현재 상태는 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) 참고. 이 문서는 **미래 확장(모바일·뉴스레터·학습 콘텐츠 등)을 위한 의사결정 누적용**.

## 목적

- 현재 코드는 사용자 데이터·로그인 도입 **이전 단계** → retrofit 비용이 가장 낮은 시점
- 다중 플랫폼(모바일 포함)·다중 도메인 확장 시 필요한 변경사항을 미리 정리
- 새로운 의사결정(인증 공급자, API 컨트랙트 등) 발생 시 본 문서에 누적

---

## 1. 모바일 앱을 지금 추가하려면 무엇을 바꿔야 하는가

모바일은 `apps/web`의 TS 모듈을 import할 수 없습니다(Next.js 번들 산출물이고 publishable package가 아님). **반드시 HTTP API를 거쳐야** 데이터를 가져올 수 있으므로, 현재 정적 import 구조가 가장 큰 장벽입니다.

### 필수 작업 (없으면 모바일 앱 불가)

| # | 작업 | 어디 |
|---|---|---|
| 1 | PostgreSQL 인스턴스 실 운영 + `prisma migrate dev` 최초 실행 | `packages/db/prisma/` |
| 2 | `apps/web/src/data/*.ts` 3개 파일을 **seed 스크립트로 DB에 이관** | `packages/db/prisma/seed.ts` (현재 비어있음) |
| 3 | `apps/api` 라우트 본문 완성 — 현재 articles만 Prisma 호출, issues/agents/subscribers는 TODO | `apps/api/src/routes/*.ts` |
| 4 | `apps/api`에 **CORS 미들웨어** 추가 (Hono `cors`) | `apps/api/src/index.ts` |
| 5 | `apps/web` 정적 import 걷어내고 `fetch(API_URL)` 호출로 교체 | `apps/web/src/app/**/page.tsx` |
| 6 | `ReservableVenue` Prisma 모델 추가 (현재 schema에 없음) | `packages/db/prisma/schema.prisma` |

### 사용자 시스템·인증을 모바일에서 쓰려면

| # | 작업 |
|---|---|
| 7 | JWT 또는 토큰 기반 인증 도입 (NextAuth.js는 웹 전용이라 모바일 호환 X → **Clerk·Auth0·Supabase Auth** 같은 토큰 발행 가능한 솔루션이 적합) |
| 8 | API에 인증 미들웨어 추가, 보호 라우트 분리 |
| 9 | `encryptEmail` 호출 활성화 (현재 stub) |

### 모바일 앱 자체

| 선택 | 의미 |
|---|---|
| **React Native (Expo) 권장** | 기존 React/TS 자산 재사용, 타입·유틸·일부 컴포넌트 로직 공유 가능 |
| Flutter / 네이티브 | 가능하지만 코드 공유 0, 별도 팀 운영 부담 |
| PWA | 가장 저비용 (Next.js PWA 매니페스트 추가). 단, 앱스토어 진입·푸시·오프라인 제한 |

---

## 2. 처음부터 다중 플랫폼을 고려했다면 — 그리고 지금 무엇을 retrofit할 수 있나

### 핵심 원칙

1. **DB가 단일 진실 소스(SSOT)** — 클라이언트는 절대 데이터 owner가 아님
2. **API-first** — REST 또는 GraphQL. 웹·모바일이 동일한 엔드포인트 소비
3. **타입·스키마 공유 패키지** — `packages/shared`에 `Article`, `Issue`, `ReservableVenue` 타입과 Zod 스키마 두기
4. **토큰 기반 인증** — 웹·모바일·서드파티 모두 동일 흐름 (JWT or session token)
5. **클라이언트 데이터 페칭은 react-query / tanstack-query** — 캐싱·재시도·낙관적 업데이트 공통화. React Native에서도 동일 라이브러리 사용 가능
6. **모노레포 구조에 `apps/mobile` 자리** 미리 둠 (Expo)

### 이상적 모노레포 구조

```
apps/
  web/       ← Next.js
  api/       ← Hono (CORS·JWT 적용)
  mobile/    ← Expo React Native (지금은 placeholder 폴더만이라도)
packages/
  db/        ← Prisma + seed
  shared/    ← 타입·Zod·상수 (CATEGORY_LABEL 등) — 웹·모바일·API 모두 의존
  ui-web/    ← 웹 전용 컴포넌트
  ui-native/ ← 모바일 전용 컴포넌트
  emails/    ← 이메일 템플릿 (V2)
```

### 지금 시점에서 retrofit 가능한 것 — 비용·효과 순서

가장 가치 있는 retrofit 3가지를 먼저, 그 다음 무거운 것:

| 우선순위 | 작업 | 비용 | 효과 |
|---|---|---|---|
| 🟢 즉시 | **`packages/shared` 생성** — `Article`·`Issue`·`ReservableVenue` 타입 + `CATEGORY_LABEL`·`VENUE_TYPE_LABEL` 같은 상수를 옮김 | 0.5일 | 향후 모바일·API가 같은 타입 import. 큰 비용 없이 미래 통합 비용 절감 |
| 🟢 즉시 | **CORS 미들웨어를 `apps/api`에 미리 추가** | 30분 | 모바일 도입 시점에 잊지 않고 박혀있음 |
| 🟢 즉시 | **데이터 fetch 추상화 계층** 도입 — 웹의 `getRecentArticles()` 같은 함수를 정적 import 대신 `await dataSource.articles.recent()` 같은 인터페이스로 감쌈. 지금은 정적 모듈 호출이지만 추후 fetch로 교체 시 인터페이스 동일 | 1~2일 | 데이터 출처 교체 시 호출처 수정 안 해도 됨 |
| 🟡 중기 | **Prisma migration 실 운영 + 정적 데이터 → DB seed 이관** | 2~3일 | 모바일 추가 시 필수. 이걸 미리 끝내두면 모바일 도입은 단순 API 소비자 추가 |
| 🟡 중기 | **인증 솔루션 결정·도입** (Clerk 권장 — 웹·모바일 동시 지원 + 무료 티어 넉넉) | 3일 | 사용자 기능 (찜·푸시·개인화) 일체의 전제조건 |
| 🔴 큰 결정 | **데이터 페칭을 react-query로 통일** | 1주 | 웹 page.tsx의 패턴이 server component 위주라 큰 리팩토링 발생 — 모바일 도입 직전에 같이 처리하는 게 효율적 |

### 지금 못 바꾸는 것 vs 늦어도 시작 전에 결정해야 할 것

**못 바꾸는 거 없음**. 사용자 데이터·실 운영 트래픽이 없어 모든 구조 변경이 비파괴적입니다.

**모바일 도입 직전에 반드시 결정**:

1. **인증 공급자** — NextAuth(웹 전용) 쓰면 모바일 도입 시 모두 갈아엎어야 함 → 처음부터 Clerk·Auth0·Supabase 권장
2. **API 컨트랙트** — REST vs GraphQL. 단순 CRUD라면 REST + Zod 검증으로 충분
3. **푸시 알림 채널** — 새 이슈 발행 알림을 모바일에 푸시할지. Expo Push 또는 직접 FCM/APNs

---

## 한 줄 요약

지금이 retrofit 비용이 가장 낮은 시점입니다 — 사용자 데이터·로그인이 없어 DB 이관·API 활성화·shared 패키지 추출이 큰 마찰 없이 가능. 한 명이라도 가입하기 전에 다음 3가지를 끝내면 모바일은 "또 다른 클라이언트"가 되고 큰 구조 변경 없이 추가됩니다:

1. `packages/shared` 추출
2. 정적 데이터 → DB 이관
3. 인증 공급자 결정

---

## 의사결정 로그

| 일자 | 결정 | 사유 |
|---|---|---|
| 2026-05-13 | 본 문서 신설, `PROJECT_STRUCTURE.md`와 분리 | 현재 상태(snapshot)와 미래 결정(strategy)이 변경 빈도·목적이 달라 분리 |
