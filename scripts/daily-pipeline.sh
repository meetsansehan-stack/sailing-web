#!/bin/bash
# 일일 파이프라인 스케줄 래퍼 (로컬 launchd 전용).
#
# ★ 약관·정책 경계 (docs/SCHEDULING.md):
#   - 자기 머신 + 자기 구독 OAuth로 도는 '내부 자동화' = 약관 OK (무인 클라우드 CI = 회색지대라 배제).
#   - cli-daily는 draft만 생성한다 — 발행(published)은 사람이 preview 검토 후 별도(책임 해자, §10.1).
#     즉 이 스케줄러는 "매일 초안까지만 자동", 공개는 여전히 수동 게이트.
#
# launchd가 비대화형으로 부르므로 PATH에 node/pnpm이 없다 → nvm bin을 동적으로 prepend.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

# nvm 설치본 중 최신 node bin을 PATH 앞에 (버전 업그레이드에 견고 — 경로 하드코딩 회피).
NODE_BIN="$(ls -d "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | sort -V | tail -1 || true)"
if [ -n "$NODE_BIN" ]; then export PATH="$NODE_BIN:$PATH"; fi

mkdir -p "$REPO_DIR/logs"
LOG="$REPO_DIR/logs/daily-pipeline.log"
STAMP="$(date '+%Y-%m-%d %H:%M:%S %Z')"

{
  echo ""
  echo "======== $STAMP — daily pipeline 시작 ========"
} >>"$LOG"

# pipeline:daily = runFullPipeline → 오늘자 draft 생성(발행 안 함). 출력·에러 전부 로그로.
if pnpm pipeline:daily >>"$LOG" 2>&1; then
  echo "======== $(date '+%H:%M:%S %Z') — 완료 (draft 생성, 검토 후 pnpm pipeline:publish) ========" >>"$LOG"
else
  code=$?
  echo "======== $(date '+%H:%M:%S %Z') — 실패 (exit $code). 401이면 OAuth 토큰 만료 → claude setup-token ========" >>"$LOG"
  exit "$code"
fi
