# 📚 육아 뉴스레터 (Parenting Newsletter)

매일 자동으로 수집·큐레이션한 육아 관련 뉴스를
웹사이트에서 한눈에 볼 수 있는 큐레이션 플랫폼입니다.

## 🎯 프로젝트 목표

- 만 3~9세 (어린이집·유치원~초등 저학년) 자녀를 둔 부모에게 신뢰할 수 있는 육아 정보 제공
- 어린이집·유치원·초등학교 저학년 교사 및 교육자의 업무에 도움이 되는 뉴스 큐레이션
- AI 기반 자동화로 일관된 품질의 콘텐츠 제공

## 📋 커버리지 카테고리

- **공교육**: 교육정책, 입시제도, 학교 뉴스
- **사교육**: 학원, EdTech, 온라인 교육
- **놀이**: 놀이터, 장난감, 키즈 체험
- **문화**: 전시회, 공연, 도서, 미디어
- **산업**: 육아용품 시장, 스타트업, 정책

## 🏗️ 기술 스택

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State**: React Hooks

### Backend
- **Runtime**: Node.js
- **Framework**: Hono
- **Language**: TypeScript

### Database
- **DB**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis

### AI & Email
- **LLM**: Claude API (claude-sonnet-4-20250514)

### Deployment
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Railway PostgreSQL

## 📦 모노레포 구조

```
parenting-newsletter/
├── apps/
│   ├── web/                (Next.js 웹 애플리케이션)
│   └── api/                (Hono API 서버)
├── packages/
│   ├── db/                 (Prisma ORM + 데이터 계층)
│   └── ui/                 (공유 React 컴포넌트)
├── agents/                 (AI 에이전트들)
│   ├── research/           (① 리서치 에이전트)
│   ├── curation/           (④ 큐레이션 에이전트)
│   ├── editor/             (② 에디터 에이전트)
│   ├── hooking/            (③ 후킹/썸네일 에이전트)
│   ├── personalization/    (⑤ 개인화 에이전트)
│   └── qa/                 (⑥ QA/발행 에이전트)
├── .env.example            (환경변수 템플릿)
├── pnpm-workspace.yaml     (모노레포 설정)
├── package.json            (루트 스크립트)
└── CLAUDE.md               (프로젝트 지침)
```

## 🤖 에이전트 파이프라인

매일 00:00 ~ 04:00 (KST)에 다음 순서로 자동 실행됩니다:

| 시간 | 에이전트 | 역할 |
|------|--------|------|
| 00:00 | **리서치** | 육아 관련 최신 뉴스 검색 & 신뢰도 판정 |
| 01:00 | **큐레이션** | 리서치 결과 검증 & 15~20개 기사 선별 |
| 02:00 | **에디터** | 선별된 기사 편집 & 제목/설명 다듬기 |
| 03:00 | **후킹** | 뉴스레터 제목/설명/썸네일 작성 |

각 에이전트는:
- `agents/{name}/prompt.md`: Claude API용 시스템 프롬프트
- `agents/{name}/schema.ts`: Zod로 정의된 입출력 스키마
- 모든 실행은 `AgentLog`에 기록

## 🔧 설치 및 실행

### 사전 요구사항
- Node.js 18+
- pnpm
- PostgreSQL 13+
- Redis (선택사항)

### 설치

```bash
# 저장소 클론
git clone <repo-url>
cd parenting-newsletter

# 의존성 설치
pnpm install

# 환경변수 설정
cp .env.example .env.local

# Prisma 마이그레이션
cd packages/db
pnpm migrate:dev
```

### 개발 모드 실행

```bash
# 모든 서비스 동시 실행
pnpm --recursive run dev

# 또는 개별 실행:
# Frontend
cd apps/web && pnpm dev   # http://localhost:3000

# Backend
cd apps/api && pnpm dev   # http://localhost:3001
```

### 파이프라인 명령어

```bash
# 전체 파이프라인 실행
pnpm pipeline:run

# 개별 에이전트 테스트
pnpm agent:test {agent-name}

# 드라이런 (발송 없음)
pnpm pipeline:dry-run
```

## 📝 코딩 규칙

- ✅ 모든 파일은 **TypeScript strict mode** 필수
- ✅ 에이전트 프롬프트는 `agents/{name}/prompt.md`에서 관리
- ✅ 에이전트 입출력은 `agents/{name}/schema.ts`에 Zod 스키마로 정의
- ✅ 환경변수는 `.env.example`에 항상 문서화
- ✅ 컴포넌트는 **150줄 이하**로 유지
- ✅ 기사 전문은 DB에 저장하지 않음 (URL + 요약만)

## 🚫 금지사항

- ❌ production DB 직접 쿼리 금지
- ❌ 프롬프트를 코드 안에 하드코딩 금지
- ❌ `prisma/migrations/` 직접 수정 금지
- ❌ 새 패키지 설치 시 응답에 명시 필수

## 📋 콘텐츠 정책

### 포함
- ✅ 신뢰할 수 있는 출처의 검증된 정보
- ✅ 부모/교육자에게 실제 도움이 되는 뉴스
- ✅ 모든 기사에 원문 링크 필수

### 제외
- ❌ 미확인 정보, 루머성 콘텐츠
- ❌ 특정 정치 성향 프레이밍
- ❌ 광고성 기사
- ❌ 공포·불안 자극 제목/카피

## 🔐 데이터 보안

### 이메일 암호화
```typescript
// packages/db/src/encryption.ts 참고
const encryptedEmail = encryptEmail('user@example.com');
const decryptedEmail = decryptEmail(encryptedEmail);
```

### 환경변수 (필수)
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `CLAUDE_API_KEY`: Claude API 키

## 📊 데이터 모델

### 주요 테이블
- **Article**: 기사 (URL + 요약)
- **DailyIssue**: 일일 뉴스레터 이슈
- **IssueArticle**: 이슈에 포함된 기사들 (에디터 커스터마이징)
- **AgentLog**: 에이전트 실행 로그 (추적/디버깅)
- **AgentConfig**: 에이전트 설정 & 프롬프트 버전 관리

자세한 스키마는 `packages/db/prisma/schema.prisma` 참고

## 🛠️ API 엔드포인트

```
GET    /health                     - 헬스 체크
GET    /api/articles               - 기사 목록
GET    /api/issues                 - 이슈 목록
GET    /api/issues/:id             - 이슈 상세
GET    /api/agents/:name/logs      - 에이전트 로그
```

## 🤝 기여 가이드

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 LICENSE 파일 참고

## 📞 연락처

질문이나 피드백이 있으시면 [이슈 등록](issues)해 주세요.

---

**Happy Parenting! 🎉**
