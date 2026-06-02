# 페런트웹 프로젝트 구조

> 작성일: 2026-05-13 · 코드 실독 기반 (CLAUDE.md·README의 "기술 스택"은 계획이며, 본 문서는 **실제 동작·구현 상태**를 정리)
>
> 향후 확장 방향(모바일·다중 플랫폼 등)은 [ARCHITECTURE_DIRECTION.md](ARCHITECTURE_DIRECTION.md) 참고.

## 한 줄 요약

- **작동하는 것**: Next.js 14 웹 앱 1개 (정적 TS 데이터 기반)
- **골격만 있는 것**: Hono API, Prisma DB 스키마, 6개 에이전트 명세, 이메일 암호화
- **없는 것**: DB 인스턴스·migration, 인증, 크롤러, 에이전트 실행 코드, 배포 설정, 외부 API 호출(Claude 1회 mock 제외)

---

## 1. 사용한 기술 스택

| 영역 | 라이브러리·도구 | 상태 |
|---|---|---|
| Web 프레임워크 | **Next.js 14.2.35** (App Router) | ✅ 실행 중 |
| UI | **React 18.2**, **Tailwind CSS 3.3** | ✅ 동작 |
| 언어 | **TypeScript 5.3**, JavaScript (scripts) | ✅ |
| API 프레임워크 | **Hono 4.0** (`apps/api`) | ⚠️ 라우트 4개 정의, 실행되는지 미확인 |
| DB ORM | **Prisma 5.0** | ⚠️ schema만 정의, migration 없음 |
| AI SDK | **@anthropic-ai/sdk** (`scripts/agent-test.js`) | ⚠️ 단일 mock 호출 코드만 존재 |
| 검증 | **Zod 3.22** (agent 스키마) | ⚠️ 스키마 파일만 있음 |
| 패키지 매니저 | **pnpm workspaces** (apps/* · packages/* · agents/*) | ✅ |
| 빌드 | Next.js 자체 (SWC), tsx (API 개발) | ✅ |

### 모노레포 구성

```
apps/
  web/   ← 작동 (Next.js 14)
  api/   ← Hono 라우트 4개만 정의, 실제로 띄우지 않음
packages/
  db/    ← Prisma 스키마 + PrismaClient 래퍼 + 이메일 암호화 유틸
  ui/    ← 비어있음 (package.json 외 소스 0개)
agents/  ← 6개 디렉토리. 각각 prompt.md + schema.ts만 존재, src/ 없음
scripts/ ← pipeline.js, agent-test.js, pipeline-dry-run.js
```

---

## 2. 데이터 저장 방식

### 현재 실제 사용

| 위치 | 내용 | 특징 |
|---|---|---|
| `apps/web/src/data/articles.ts` | 기사 ~62건, 헬퍼 18개 export | **정적 TS 파일** |
| `apps/web/src/data/issues.ts` | 이슈 9건 | 정적 |
| `apps/web/src/data/venues.ts` | venue 24곳 | 정적 |

웹 앱 코드를 `grep`해보니 **`fetch`·`axios`·`prisma` import 0건**. 즉 모든 데이터가 빌드 시점에 TS 모듈로 import되며, runtime fetching이 없습니다. 새 기사를 추가하려면 코드 수정 + 재배포가 필요한 구조.

### 설계되었지만 미사용

- **PostgreSQL via Prisma** — `packages/db/prisma/schema.prisma`에 5개 모델 정의(`Article`, `DailyIssue`, `IssueArticle`, `AgentLog`, `AgentConfig`)
- **migration 적용 흔적 없음** — `packages/db/prisma/migrations/` 디렉토리 자체 없음 → DB가 한 번도 띄워진 적 없음
- **Redis** — `.env.example`에 `REDIS_URL` 있으나 **코드 내 사용처 0건**

### 이메일 암호화 (정의만 됨)

`packages/db/src/encryption.ts`에 `encryptEmail`/`decryptEmail` (AES-256-CBC) 함수. 호출처는 `apps/api/src/routes/subscribers.ts`에 **`// TODO: encryptEmail 사용` 주석으로만** 남아있음.

### 데이터 흐름 (현재)

```
[apps/web/src/data/*.ts]  ←─ 빌드 시 import
        │
        ▼
[Next.js Server Component] ─→ 정적 렌더 → HTML
        │
        ▼
[브라우저]
```

### 데이터 흐름 (설계상, 미구현)

```
[리서치 에이전트] → [큐레이션] → [에디터] → [후킹]
     │                                          │
     └─────────── PostgreSQL (Prisma) ──────────┘
                       │
                       ▼
                [Hono API: /api/articles, /api/issues]
                       │
                       ▼
                [Next.js Web]
```

### 백엔드 API와 웹의 관계

**구조적으로는 분리, 기능적으로는 미사용.**

- `apps/web`(Next.js)과 `apps/api`(Hono)가 별도 패키지로 분리되어 있고, `.env.example`에 `NEXT_PUBLIC_API_URL`도 정의 — 분리 의도 명확
- 하지만 `apps/web` 코드에 `fetch`·`axios` 호출 **0건** (`grep -r "fetch\|axios" apps/web/src`로 확인). 웹은 정적 TS 모듈만 import하고 API를 우회함
- `apps/api`는 dev/start 스크립트는 있으나 실 운영 흔적 없고, DB 연결도 없음
- 결과적으로 현재 웹은 **Next.js 단독 풀스택**처럼 동작 (서버 컴포넌트가 정적 TS를 직접 import)
- Next.js의 또 다른 옵션인 Route Handlers(`apps/web/src/app/api/*`)도 존재하지 않음

이 상태에서 모바일·다른 클라이언트를 추가하려면 API를 실제로 활성화해야 함 → [ARCHITECTURE_DIRECTION.md §1](ARCHITECTURE_DIRECTION.md#1-모바일-앱을-지금-추가하려면-무엇을-바꿔야-하는가) 참고.

---

## 3. 사용자 인증 시스템

**없음.** 인증 관련 파일·미들웨어 검색 결과 0건. NextAuth, JWT, session, cookie 처리 코드 모두 부재.

`apps/api/src/routes/subscribers.ts`에 POST/DELETE/PATCH 엔드포인트가 있으나 본문이 `// TODO: prisma에서 ...` 주석으로 비어있고 인증 검사도 없음.

---

## 4. 외부 API 또는 크롤링

### 실제 호출되는 외부 API

- **웹 앱**: 0건. 정적 데이터만 사용
- **`scripts/agent-test.js`**: Claude API (`anthropic.messages.create`) 1회 호출 코드. 모델은 `CLAUDE_MODEL` 환경변수 또는 `claude-sonnet-4-20250514` 기본값. 입력은 하드코딩된 mock (`{ date, categories: [...] }`)

### 크롤링·뉴스 수집

**구현 없음.** CLAUDE.md의 출처 풀(EBS, korea.kr, 매경 등)은 정책 문서이고, 실제 크롤러/스크래퍼 코드는 존재하지 않습니다. 리서치 에이전트(`agents/research/`)도 `prompt.md` + `schema.ts`만 있고 src/ 디렉토리가 없음.

### 호출 빈도·방식

- `.env.example`에 `PIPELINE_RESEARCH_TIME="00:00"` 등 KST 시간 4개 정의
- `scripts/pipeline.js`가 cron-like orchestration을 의도하지만 단순 `execSync('pnpm agent:test ${agent}')` 4회 순차 실행 — 실제 cron 스케줄러는 외부에서 걸어야 함 (cron, GitHub Actions, Railway Cron 등 어디에도 설정 없음)

### Venue 외부 링크

`venues.ts`의 `reservationUrl`은 사용자가 클릭 시 새 탭으로 외부 이동(`<a target="_blank">`). **fetch는 안 함**, 단순 링크.

---

## 5. 배포 환경

### 의도된 배포 (README 기준)

| | 의도 |
|---|---|
| Frontend | Vercel |
| Backend (API) | Railway |
| Database | Railway PostgreSQL |

### 실제 배포 설정 파일

**전부 없음.** `vercel.json`, `railway.json/toml`, `Dockerfile`, GitHub Actions 워크플로 — 모두 부재.

### 현재 실행 방식

```bash
# 로컬 dev 서버만 운영 중
cd apps/web
node node_modules/next/dist/bin/next dev   # pnpm dev는 allowBuilds 정책 때문에 실패
```

`pnpm-workspace.yaml`의 `allowBuilds` 섹션에 `@prisma/client`, `prisma`, `esbuild`, `unrs-resolver` 4개가 모두 `"set this to true or false"` 문자열로 남아있어 pnpm install 시 빌드 스크립트 정책 충돌. 우회로 next 바이너리 직접 실행 중.

### 빌드·실행 명령 (정의된 것)

- `pnpm pipeline:run` → `node scripts/pipeline.js`
- `pnpm agent:test {agent-name}` → `node scripts/agent-test.js`
- `pnpm pipeline:dry-run` → `node scripts/pipeline-dry-run.js`
- 앱별: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm type-check`

---

## 6. 향후 확장 시 필요한 변경사항

### (a) 사용자 시스템 추가하려면

처음부터 구현 필요. 권장 단계:

1. **인증 라이브러리 선택**: NextAuth.js (App Router 지원) 또는 Clerk
2. **사용자 모델 추가**: `packages/db/prisma/schema.prisma`에 `User`, `Session`, `Account` 모델 추가
3. **DB 연결 활성화**: `packages/db/prisma/migrations/` 생성, Railway PostgreSQL 인스턴스 띄우고 `migrate deploy`
4. **API 인증 미들웨어**: `apps/api/src/index.ts`에 Hono의 JWT 미들웨어 추가, 보호 라우트 분리
5. **이메일 암호화 연결**: 이미 있는 `encryptEmail`를 `subscribers.ts`의 TODO 자리에 호출
6. **사용자 상태 → 웹 앱 전파**: 현재는 정적 데이터라 사용자별 분기 불가 → (b)와 함께 처리

### (b) 데이터 영구 저장 추가하려면

현재 가장 큰 갭. 필요 작업:

1. **PostgreSQL 인스턴스 실제 띄우기** (Railway, Supabase, Neon 중 택1)
2. **`packages/db`에서 `prisma migrate dev`** 최초 실행 → migrations 폴더 생성 + 테이블 적용
3. **`apps/api` 라우트 본문 구현** — 현재 `articles.ts`만 Prisma 호출하고 `subscribers.ts`는 TODO. issues/agents 라우트 본문 확인 후 보강
4. **`apps/web`에서 정적 import 걷어내기** — `src/data/*.ts` 3개를 fetch 호출로 교체. App Router의 server component에서 `await fetch(NEXT_PUBLIC_API_URL/api/articles)` 형태
5. **씨드 마이그레이션 스크립트** — 현재 정적 파일의 데이터를 DB로 옮기는 일회성 스크립트 (`packages/db/prisma/seed.ts` 자리 비어있음)
6. **venue도 DB 모델 추가** — 현재 Prisma 스키마에 `ReservableVenue` 없음, 더하기 필요

### (c) 뉴스레터·학습 콘텐츠 등 통합하려면

**이메일 뉴스레터**:
- 발송 서비스 선택 (Resend, SendGrid, AWS SES). README는 미정
- `apps/api`에 `/api/newsletter/send` 라우트 추가, 일일 cron 트리거 필요 → Railway Cron 또는 별도 worker
- 구독자 관리 로직 완성 (현재 stub) + 옵트아웃 토큰 생성기 추가
- 이메일 템플릿 (HTML + 텍스트) — `packages/` 하위에 `emails` 같은 새 패키지 필요할 듯

**학습 콘텐츠 등 다른 도메인**:
- 현재 Prisma 스키마는 `Article` + `Issue` 2축으로만 모델링 — 학습 콘텐츠는 별도 모델 필요 (`Course`, `Lesson`, `Progress` 등)
- venue 도입처럼 `apps/web/src/data/`에 정적으로 시작 → 패턴 익숙해진 뒤 DB로 이관
- 새 도메인마다 `/reservations`처럼 별도 라우트 + nav 진입점 추가

**리서치·큐레이션 에이전트 실 구동**:
- 6개 에이전트 디렉토리(`agents/*/`)에 `src/index.ts` **현재 없음**. 각 에이전트의 실행 코드를 작성해야 함
- `scripts/agent-test.js`가 단일 mock 입력으로 Claude API를 한 번 부르는 수준 — 실제 파이프라인은 에이전트 간 입출력 연결, DB 쓰기, 에러 재시도, 비용 추적 등이 필요
- 크롤러 미구현 → 리서치 에이전트가 어디서 후보 15~25개를 가져올지 결정 필요 (RSS, 검색 API, Anthropic의 web search tool 등)
