# 배포 런북 — Sailing Web + API

> 배포 순서: **Railway(API) 먼저 → Vercel(Web)** — 웹 빌드 시 API를 호출하므로 순서가 중요합니다.

---

## 1. Railway — API 서버

### 1-A. 서비스 생성
1. [Railway 대시보드](https://railway.app) → "New Project" → "Deploy from GitHub repo"
2. 저장소: `meetsansehan-stack/sailing-web`
3. **Root Directory**: `apps/api`
4. 빌드/시작 커맨드: `railway.json`·`nixpacks.toml`이 자동 감지됨

### 1-B. 환경변수 설정
Railway 대시보드 → Variables 탭에서 아래를 모두 설정:

```
# DB (Supabase)
DATABASE_URL=postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# API 설정
PORT=3001                             # Railway가 자동 주입; 없어도 됨 (src/index.ts 이미 처리)
CORS_ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app  # 웹 배포 후 업데이트
PREVIEW_TOKEN=<강한 랜덤값>
ADMIN_API_TOKEN=<강한 랜덤값>

# Claude (파이프라인용)
CLAUDE_CODE_OAUTH_TOKEN=<oauth 토큰>  # 또는 CLAUDE_API_KEY

# 기타
NAVER_AD_CUSTOMER_ID=...
NAVER_AD_API_KEY=...
NAVER_AD_SECRET_KEY=...
NAVER_DATALAB_CLIENT_ID=...
NAVER_DATALAB_CLIENT_SECRET=...
```

### 1-C. 배포 확인
```bash
# Health check
curl https://your-railway-domain.railway.app/health
# → {"status":"ok",...}

# CORS 확인 (웹 도메인 설정 후)
curl -H "Origin: https://your-vercel-domain.vercel.app" \
  -I https://your-railway-domain.railway.app/health
# → Access-Control-Allow-Origin: https://your-vercel-domain.vercel.app
```

---

## 2. Vercel — 웹 (Next.js)

### 2-A. 프로젝트 생성
1. [Vercel 대시보드](https://vercel.com) → "New Project" → Import `meetsansehan-stack/sailing-web`
2. **Framework Preset**: Next.js (자동 감지)
3. **Root Directory**: `apps/web`
4. Build/Install Command: `vercel.json`이 자동 감지됨

### 2-B. 환경변수 설정

```
# API URL (Railway 배포 후 실제 URL로)
NEXT_PUBLIC_API_URL=https://your-railway-domain.railway.app

# 사이트 URL (Vercel 배포 후 실제 URL로 — 또는 커스텀 도메인)
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app

# Supabase (public key만 — SERVICE_ROLE은 API에만)
NEXT_PUBLIC_SUPABASE_URL=https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 운영 대시보드 게이트 (ADMIN_API_TOKEN과 동일)
ADMIN_API_TOKEN=<Railway와 동일한 값>
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY`는 **웹에 넣지 않습니다**. API 전용.

### 2-C. 배포 확인
```bash
# 홈 200
curl -I https://your-vercel-domain.vercel.app/
# → HTTP/2 200

# 사이트맵
curl https://your-vercel-domain.vercel.app/sitemap.xml | head -20

# OG 태그 (기사 한 건)
curl -s "https://your-vercel-domain.vercel.app/articles/some-id" | grep "og:title"
```

---

## 3. Railway CORS 업데이트

Vercel URL 확정 후 Railway에서:
```
CORS_ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
# 커스텀 도메인 있으면 콤마 구분으로 추가
# CORS_ALLOWED_ORIGINS=https://sailing.kr,https://your-vercel-domain.vercel.app
```

→ Railway 자동 재배포 (변수 변경 시 트리거됨).

---

## 4. 커스텀 도메인 (선택, 공개 오픈 시)

### Vercel 도메인
1. Vercel → Settings → Domains → 도메인 추가
2. DNS: CNAME `www` → `cname.vercel-dns.com`  /  A `@` → `76.76.21.21`

### Railway 도메인 (필요 시)
- Railway → Settings → Networking → Custom Domain

---

## 5. Supabase 플랫폼 백업 확인

앱 논리 백업(`db:backup`/`db:restore`)은 완료됨. 플랫폼 백업은 **Supabase 대시보드에서 수동 확인 필요**:
- Settings → Database → Backups → Point-in-Time Recovery 활성화 여부 확인 (플랜 의존)

---

## 6. 배포 후 체크리스트

- [ ] Railway `/health` 200
- [ ] Vercel 홈 200
- [ ] CORS: 웹에서 API 호출 정상 (구독 CTA 동작)
- [ ] 분석 이벤트 적재 (`/dashboard?key=...` 확인)
- [ ] SEO: `/sitemap.xml` · `/robots.txt` 200
- [ ] OG 태그: [카카오 공유 미리보기](https://developers.kakao.com/tool/clear/og) 확인
- [ ] Google Search Console 등록 + sitemap 제출
- [ ] `NEXT_PUBLIC_SITE_URL` 실도메인으로 업데이트 후 재배포

---

## 환경변수 랜덤값 생성

```bash
# PREVIEW_TOKEN / ADMIN_API_TOKEN 생성 (32바이트 hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
