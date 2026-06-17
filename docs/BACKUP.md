# DB 백업·복구 런북

> CLAUDE.md "데이터 소실 방지 백업 UX" + 베타 readiness(DevOps). 2개 층위로 방어.
> ⚠️ 백업 JSON은 전체 데이터 → `packages/db/backups/`는 **gitignore**(커밋 금지).

## 두 층위

1. **Supabase 플랫폼 백업** (1차, 플랜 의존) — **사용자가 대시보드서 확인·활성화 필요.**
   - Free 플랜 = 자동 백업 없음(또는 제한). Pro = 일일 백업 + PITR(Point-in-Time Recovery).
   - 베타 전 액션: Supabase → Project → Database → Backups에서 상태 확인. 미제공 플랜이면 아래 2차가 유일 방어.
2. **앱 논리 백업** (2차, 이 repo) — pg_dump 불필요(로컬 postgres client 미설치)·서버최소 정합.
   - Prisma → JSON 전체 덤프(9개 모델). 스키마/시퀀스는 못 담음 → 스키마 소스 = `prisma/migrations/`.

## 백업

```bash
pnpm --filter @parenting-newsletter/db db:backup
# → packages/db/backups/full_<ISO타임스탬프>.json  (meta.counts + data.<model>[])
```

9개 모델 전부: article·reservableVenue·book·dailyIssue·issueArticle·agentLog·agentConfig·subscriber·analyticsEvent.

## 복구

```bash
# 1) dry-run (기본) — 읽기·검증·"무엇을 넣을지" 리포트만, 쓰기 0
pnpm --filter @parenting-newsletter/db db:restore backups/full_<…>.json

# 2) 실제 복구 — --commit 필수
pnpm --filter @parenting-newsletter/db db:restore backups/full_<…>.json --commit
```

- FK 안전 순서로 삽입(dailyIssue→article→…→issueArticle 마지막).
- `createMany(skipDuplicates)` = **추가 복구**(기존 행 안 건드림, 누락분만 채움). 전체 교체가 필요하면 대상 테이블을 비운 뒤 실행.
- 전체 재해 복구 = 빈 DB에 **`migrate deploy`(스키마) → `db:restore --commit`(데이터)**.

## 스케줄 (선택)

- 수동: 발행 루틴 전후로 `db:backup` 1회.
- 자동: `docs/SCHEDULING.md`의 launchd 패턴 재사용(일일 백업 plist). 로컬 머신 깨어있어야 함.
- 백업 파일은 로컬 보관 → 중요 시점(대량 정리·마이그레이션 직전)엔 외부(클라우드 드라이브)로 수동 복사 권장.

## 드릴 기록

- **2026-06-17 라운드트립 검증 完**: 백업 생성(253행/9모델) → 안전한 익명 이벤트 삭제 → `--commit` 복구 → 무결성 회복(skipDuplicates가 누락분만 정확히 재삽입). dry-run·--commit 양 경로 동작 확인.
