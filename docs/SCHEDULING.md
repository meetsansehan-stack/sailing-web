# 일일 파이프라인 스케줄링 (로컬 launchd)

매일 KST 00:05에 파이프라인을 자동 실행해 **오늘자 이슈 draft를 생성**한다.
발행(공개)은 자동화하지 않는다 — 사람이 preview로 검토 후 `pnpm pipeline:publish`로 별도.

## 왜 로컬 launchd인가 (약관·정책 경계)

- **무인 클라우드 CI = 회색지대라 배제.** OAuth 토큰(`CLAUDE_CODE_OAUTH_TOKEN`)을
  headless CI/서드파티 자동화에서 쓰는 건 2026-02 약관 개정상 위반 소지. 반면
  **자기 머신 + 자기 구독으로 도는 '내부 자동화'는 허용**되는 케이스로 확인됨.
- **draft-only = 책임 해자 유지.** `cli-daily`는 published로 올리지 않는다(SPEC §10.1).
  미검수 AI 콘텐츠가 자동 공개되지 않으므로, "틀린 마감일" 류 사고를 사람이 거른다.
- 따라서 이 스케줄러 = "매일 초안까지만 자동, 공개는 수동 게이트". 솔로 운영 원칙과 정합.

## 전제·한계 (꼭 읽기)

- **Mac이 켜져 있고 깨어 있어야 한다.** 00:05에 잠자기/종료면 실행 안 됨(launchd가
  깨우지 않음). 데일리로 돌릴 거면 `caffeinate` 또는 전원·잠자기 설정 조정 필요.
  → 안정적 무인 운영은 결국 API 키(종량) + 상주 서버가 정석. 이건 그 전 단계의 로컬 자동화.
- **Mac 타임존 = Asia/Seoul** 가정(현재 그러함). 다르면 plist의 Hour가 KST와 어긋남.
- **사용량**: 풀런 1회 ≈ writer Sonnet 기준 ~$3, ~20분. 2026-06-15부터 Pro에 월 $20
  Agent SDK 크레딧이 별도로 붙어 데일리 여유가 생김(그 전엔 Pro 평소 사용량 차감).
- **OAuth 토큰 만료 시** 401로 실패 → `claude setup-token`으로 갱신 후 `.env` 교체.
  실패는 `logs/daily-pipeline.log`에 남는다.

## 설치

```sh
# 1) plist를 LaunchAgents로 복사
cp scripts/com.sailing.daily-pipeline.plist ~/Library/LaunchAgents/

# 2) 등록 (로그인 세션에 로드)
launchctl load ~/Library/LaunchAgents/com.sailing.daily-pipeline.plist

# 3) 등록 확인
launchctl list | grep com.sailing.daily-pipeline
```

## 즉시 테스트 (스케줄 안 기다리고 한 번 돌려보기)

```sh
launchctl start com.sailing.daily-pipeline
tail -f logs/daily-pipeline.log
```

또는 launchd 없이 래퍼만 직접:

```sh
bash scripts/daily-pipeline.sh && tail -n 40 logs/daily-pipeline.log
```

## 해제 / 갱신

```sh
# 해제
launchctl unload ~/Library/LaunchAgents/com.sailing.daily-pipeline.plist
rm ~/Library/LaunchAgents/com.sailing.daily-pipeline.plist

# 시간·경로 수정 후 다시 적용 = unload → 파일 교체 → load
```

## 검토·발행 흐름 (스케줄 실행 후 사람이 하는 일)

1. 아침에 `logs/daily-pipeline.log` 확인(단계 결과·qa 경고·비용).
2. preview로 톤·정확성 검토: `http://localhost:3000/issues/<날짜>?preview=<PREVIEW_TOKEN>`
   (웹 dev 서버가 떠 있어야 함).
3. 문제 없으면 발행: `pnpm pipeline:publish <날짜>`.

> 로그·산출물 정리: `logs/*.log`는 gitignore됨. 파이프라인이 draft를 멱등 생성하므로
> 같은 날 재실행해도 안전(curation upsert).
