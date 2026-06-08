# 페런트웹 파이프라인 명세 (SPEC)

> **역할 분리**
> - [`CLAUDE.md`](../CLAUDE.md) = **원칙·정책** (무엇을·왜 — 큐레이션 기준, 출처 풀, 콘텐츠 정책, 톤)
> - 이 문서 `SPEC.md` = **기계적 동작** (어떻게 — 에이전트 input/output, DB 상태 전이, 트리거, 실패·롤백)
>
> 두 문서가 충돌하면 정책은 CLAUDE.md, 구현 동작은 SPEC.md가 기준. 코드 변경 시 이 문서를 함께 갱신.
>
> **상태 기준일**: 2026-05-20. 현재 구현된 것은 **research 에이전트 1개**뿐이며, 나머지는 schema만 정의됨. 아래 명세는 \[구현됨] / \[목표] 로 구분 표기.

---

## 0. 한눈에 보기

```
research  스카우트    웹 검색 → 후보 ~40개 (best-effort)        → AgentLog.output (JSON)
curation  데스크      후보 → 8~20개 선별 + 타입 확정 + 승인       → Article draft 행 생성 + IssueArticle  [B1]
writer    기자        brand voice로 카드뉴스 body 집필 (건당)     → Article.body                          [C2]
editor    카피데스크   순서·테마·교열 (이슈당)                    → IssueArticle.customTitle·order / DailyIssue.theme
hooking   소셜PD      이슈 메타 (후킹·SNS 카드)                  → DailyIssue.title·hookingCopy 등
(실시간)  웹사이트     DailyIssue + Article fetch               → apps/web
```

> 실행 순서는 위와 같음. 크론 시각(00/01/02/03 KST 등)은 soft — 순차 의존만 지키면 됨 (§8).
> **에이전트별 직군 매핑** (실제 콘텐츠 큐레이션 뉴스룸 분업 기준): research=리서처/스카우트, curation=데스크 에디터(게이트키핑·발제 승인), writer=기자/스태프 라이터(집필), editor=카피 에디터/교열, hooking=소셜·뉴스레터 프로듀서, qa=편집장(V2).
> **핵심 분업 원칙**: "무엇을 실을지 고르는 자(curation)"와 "그것을 쓰는 자(writer)"는 분리한다. body 보이스가 제품 차별점이므로 writer를 독립 튜닝 단위로 둔다 — §7-C.

V2 후보: **personalization**(구독자 재정렬), **qa**(발행 전 검증). schema는 있으나 MVP 파이프라인 미포함.

---

## 1. 데이터 모델 (현행)

스키마 원본: [`packages/db/prisma/schema.prisma`](../packages/db/prisma/schema.prisma). 타입 동기화 대상: [`packages/shared/src/`](../packages/shared/src/).

| 모델 | 식별자 | 핵심 필드 | 용도 |
|---|---|---|---|
| **DailyIssue** | `issueDate` (unique, KST 자정의 UTC) | **MVP 목표**: `title?` `summary?`(추가) `theme?` / **제거 예정**: `hookingCopy?` `subjectLine?` `previewText?` (§7-D) | 하루치 이슈 메타 |
| **Article** | `id` (cuid) | `title` `summary` `body` `url` `category` `contentType` `source` `publishedAt` `credibilityScore` `issueDate` `eventStartDate?` `deadline?` `mediaType?` `durationMin?` `tags[]` `imageUrl?` | 큐레이션된 기사 (원문 전문 저장 X — URL+자체 요약·본문만, ↓각주) |

> **각주 — 원문 전문 미저장 정책 (저작권 근거)**: 뉴스 기사 전문은 언론사·기관 저작물 → 복제·게시 시 복제권·공중송신권 침해. 반면 **링크는 비침해**(단순 링크는 전송 아님), **짧은 요약·인용**은 정당한 인용(저작권법 §28) 범위. 우리 모델 "원문 링크 + 자체 요약 + 자체 카드뉴스 본문"은 합법 구간(transformative + link)에 위치. 부차 이유: 신선도(소스 정정 시 stale 방지)·저장 위생·"호스트 아닌 큐레이션 레이어" 포지셔닝. → writer는 `url`을 **transient read(WebFetch)** 하되 전문 저장 안 함, body는 **transformative**(§3.3 S2′)여야 함.
| **IssueArticle** | `(issueId, articleId)` unique | `customTitle?` `customDescription?` `order` | 이슈↔기사 조인 + 에디터 오버라이드 |
| **AgentLog** | `id` | `issueId` `agentName` `status` `input(JSON)` `output(JSON)` `errorMessage?` `processingTimeMs?` `articleId?` | 에이전트 실행 추적 |
| **AgentConfig** | `name` (unique) | `version` `prompt` `schema` `isActive` | 프롬프트 버전 관리 (DB 기반 — 현재 미사용, 파일 기반 prompt.md 사용 중) |
| **ReservableVenue** | `id` (`venue-*` slug) | `name` `type` `region` `reservationUrl` `operator` `pricing` `ageRange` `entryMinAge?` … | 공연·전시·시설 예약 정보 |

### issueDate 규칙
KST 일자 = 그 날 KST 자정을 UTC로 환산한 값 (`KST 00:00 = UTC 15:00 전날`). 변환 헬퍼는 [`agents/research/src/index.ts`](../agents/research/src/index.ts) `todayKstMidnightUtc()`. 모든 에이전트·쿼리는 이 키로 하루치를 묶는다.

---

## 1.1 발행·선별 상수 (config) — \[결정 2026-05-20]

발행량 조절의 **단일 손잡이**. 한 곳(권장: [`packages/shared`](../packages/shared/src/) config 모듈)에 두고 research·curation 양쪽이 import → "한 군데만 고치면 전체 반영".

```ts
PUBLISH_MIN     = 8     // 하루 노출 카드 하한 (이슈 적은 날도 최소 이만큼)
PUBLISH_MAX     = 20    // 하루 노출 카드 상한 (둘러보기 수용, 무한정 X)
SELECTION_FACTOR = 2    // 엄선 강도(불변값). 압축률 ≈ 1/FACTOR ≈ 50%
RESEARCH_TARGET = PUBLISH_MAX × SELECTION_FACTOR = 40   // 파생값
```

**계산 방향 (중요)**: 발행이 *제품 결정값*, 리서치는 *파생값*.
- `RESEARCH_TARGET`은 **단일 상한** (범위 아님). research는 뉴스 적은 날도 그물을 넓게 던져 ~40까지 best-effort 수집.
- `PUBLISH_MIN~MAX`(8~20)는 research×배율이 아니라 **독립 품질 게이트**. curation이 비율로 기계 축소하는 게 아니라 **품질·중요도 컷**으로 줄임. 좋은 게 20 넘으면 20에서 끊고, 8 미만이면 §6.4.

**전부 soft — config 한 곳에서 언제든 재조정 가능. migration·기존 데이터 영향 없음.** `SELECTION_FACTOR`만 올리면(예: ×3=60) 더 엄선, 발행 범위만 바꾸면 research가 자동 추종.

---

## 2. 실행 라이프사이클 (현행 — `runAgent`)

원본: [`packages/agents-core/src/runner.ts`](../packages/agents-core/src/runner.ts).

모든 에이전트는 `runAgent({ agentName, issueDate, input, run })`로 감싸 실행되며 다음 상태 전이를 보장한다:

```
1. DailyIssue upsert (issueDate 기준, 없으면 생성)
2. AgentLog 생성  → status: 'processing', input 기록
3. run() 실행 (Claude 호출 + 후처리)
   ├─ 성공: AgentLog → status:'success', output(JSON)·processingTimeMs 기록 → { output, processingTimeMs, logId } 반환
   └─ 실패: AgentLog → status:'failed', errorMessage(메시지+스택)·processingTimeMs 기록 → 에러 re-throw
```

- **AgentLog는 항상 남는다** (성공·실패 모두). 실패해도 throw 전에 기록.
- `runAgent`는 **DailyIssue와 AgentLog만** 건드린다. **Article·IssueArticle 적재는 각 에이전트의 `run()` 안에서 책임** (현재 research는 적재 안 함 — §3.1 참조).
- Claude 호출은 [`generateStructured`](../packages/agents-core/src/claude.ts): json_schema 모드 + Zod 재검증 + 구조화 실패 시 자동 재시도. 기본 모델 `CLAUDE_MODEL` env (기본 `claude-sonnet-4-6`). `CLAUDE_API_KEY`→`ANTHROPIC_API_KEY` 자동 동기.

---

## 3. 에이전트별 명세

각 에이전트: **책임 경계 / 트리거 / 입력 / 출력 / DB 부수효과 / 실패 정책**. schema 원본은 `agents/{name}/schema.ts`, 프롬프트는 `agents/{name}/prompt.md`.

### 3.1 research \[구현됨]

| 항목 | 내용 |
|---|---|
| **책임** | WebSearch로 국내 육아·교육 뉴스 후보를 **`RESEARCH_TARGET`(≈40)까지 best-effort 수집** (§1.1). 출처 화이트리스트·신뢰도 점수·시기성 윈도우 적용. **선별·편집은 하지 않음** (후보 풀 생성만). |
| **트리거** | 00:00 KST 크론 \[목표] / 수동 `POST /api/agents/research/run` \[구현됨] / CLI `agents/research/src/cli.ts` |
| **입력** | `{ date: ISO, categories: Category[] }` — 기본값 오늘(KST)·전체 카테고리 |
| **출력** | `{ articles: [{ title, url, summary(≤150), category, contentType?, source, publishedAt, credibilityScore(0~1) }], totalCount, processingTimeMs }` |
| **DB 부수효과** | **`AgentLog.output`에 JSON으로만 저장. Article 행은 생성하지 않음.** |
| **실패 정책** | **후보 수 미달은 실패가 아님** (§1.1·§6.4). 화이트리스트가 엄격해 어떤 날은 ~40개가 물리적으로 안 나옴 → 나온 만큼만 success로 기록. AgentLog `failed`는 호출 자체(네트워크·크레딧·구조화 출력) 실패일 때만. |
| **도구** | `WebSearch`만 허용 |

> `articles[].contentType`은 **선택** — research가 추정 가능하면 채우고, 어려우면 curation이 확정.
> output JSON schema(`RESEARCH_TOOL_INPUT_SCHEMA`)는 현재 `minItems:10, maxItems:30` → **상한을 `RESEARCH_TARGET`(40)에 맞춰 상향** 필요. Zod와 수동 동기 유지. `minItems`는 best-effort 정책상 낮게(예: 1) 두거나 제거.

### 3.2 curation \[schema만] — 데스크 에디터

| 항목 | 내용 |
|---|---|
| **책임** | research 후보 → 그날 가장 중요한 **`PUBLISH_MIN`~`PUBLISH_MAX`(8~20)개 선별** (비율 아닌 **품질 컷**) + 중복 제거 + 콘텐츠 타입 확정 + 일별 타입 분포(CLAUDE.md 소프트 가이드) 고려. 통과분이 8 미만이면 부실한 날 → §6.4. **글은 쓰지 않음** (집필은 writer). |
| **트리거** | 01:00 KST \[목표]. 직전 research AgentLog(success)의 output을 입력으로 |
| **입력 (목표 schema)** | `{ articles: [{ id, title, url, summary, category, source, publishedAt, credibilityScore }], targetMin: 8, targetMax: 20 }` — `id`는 후보 인덱스/임시 id. `targetCount: min(10).max(30)` → `targetMin/targetMax`로 수정. §1.1·§7-A |
| **출력 (목표 schema)** | `{ selectedArticles: [{ articleId, contentType, relevanceScore(0~1), rationale(≤150) }], totalSelected, processingTimeMs }` |
| **DB 부수효과 \[B1 결정]** | **선별된 후보를 Article draft 행으로 생성** (title·summary·url·category·contentType·source·publishedAt·credibilityScore·issueDate 채움, **`body`는 비움 → writer가 채움**) + **IssueArticle 연결**. 데스크 발제 승인 = CMS draft 생성. 중복 방지 `(issueDate, url)` unique. §7-B |
| **실패 정책** | AgentLog `failed`. 폴백: 수동 큐레이션(§5) 또는 전날 이슈 노출(§6). |

### 3.3 writer \[신설 — C2] — 기자/스태프 라이터

| 항목 | 내용 |
|---|---|
| **책임** | curation이 만든 draft 기사 **건당** 카드뉴스 본문(`body`) 집필. **브랜드 보이스가 핵심 자산** — 단순 요약·기사 모음이 아니라 양육자에게 신뢰 가는 목소리로 전달 (산문 X, `## 헤딩` + `- 불릿`, 명사형 종결, 타입별 헤딩 가이드 — CLAUDE.md). |
| **트리거** | curation 완료 후. **기사 건당** 실행 (8~20회) |
| **입력 (신규 schema)** | `{ articleId, title, summary, url, category, contentType, source }` — 건당 1개. `url`은 **집필 시점에 WebFetch로 읽을 대상**(저장 X, §1 각주). |
| **출력 (신규 schema)** | `{ articleId, body(마크다운), processingTimeMs }` |
| **도구** | **`WebFetch`** — 주어진 canonical `url` **하나만** 읽기. WebSearch 미허용(소스 이탈·드리프트 방지, 단일 출처 그라운딩). |
| **DB 부수효과** | 해당 `Article.body` 갱신. **소스 전문은 저장하지 않음** (transient read). |
| **실패 정책** | 건당 AgentLog. fetch 실패(죽은 링크·페이월) → 요약 기반 보수적 작성 + 수동 플래그. 일부 기사 실패 시 그 기사만 degraded(§6.4-3), 전체 중단 아님. |
| **핵심 자산** | **브랜드 보이스 스타일가이드** (별도 문서 `docs/brand-voice.md` \[목표] 또는 `agents/writer/prompt.md`). writer 프롬프트 이터레이션의 80%가 여기서 발생. editor·hooking과 독립 튜닝. |

#### writer 필수 스킬 (substrate — 브랜드 보이스는 이 위에 얹는 레이어)

브랜드 보이스("어떻게 들리나")보다 먼저 굳혀야 할 직무 역량. 그라운딩·구조 없이 보이스만 얹으면 "예쁘게 틀린 글"이 됨. 실제 콘텐츠 업계 스태프 라이터의 craft에 기반.

| 스킬 | 내용 | 근거 |
|---|---|---|
| **S1 소스 독해** | `url`을 WebFetch로 실제로 읽고 "무슨 일인지" 파악 (≤150자 요약만으론 얕은 글) | 제품 차별점 |
| **S2 사실 그라운딩** | 소스에 없는 숫자·날짜·주장 생성 금지. body는 소스 검증 가능 범위 내 | CLAUDE.md 미확인·루머 금지 |
| **S2′ Transformative** | 사실은 충실히, **표현은 우리 구조·우리 말로**. near-verbatim(소스 거의 그대로 베끼기) 금지 — 그러면 저작권 침해 재발 (§1 각주). 카드뉴스 포맷이 변형적 안전판 | 저작권 |
| **S3 양육자 시사점 추출** | "그래서 양육자에게 무슨 의미인지" — 타입별 헤딩 가이드의 시사점/체크 칸 | CLAUDE.md 헤딩 가이드 |
| **S4 카드뉴스 구조화** | `## 헤딩` + `- 불릿`, 명사형 종결, 3섹션·섹션당 3~5불릿, "키워드: 내용" | CLAUDE.md 본문 스타일 |
| **S5 가독성·평이화** | 0~8세 양육자·교사 눈높이, 전문용어 번역, 한눈에 스캔 | 타깃 독자 |
| **S6 타입별 작법** | Policy/Event/Market/Insight/Guide 헤딩 구성 분기 | CLAUDE.md 타입별 표 |
| **S7 간결성** | 불릿 압축, 분량 규율 | 카드뉴스 형식 |
| **S8 출처·링크 무결성** | 원문 링크 필수 보존, 출처 표기 | CLAUDE.md 원문 링크 필수 |
| **S9 정책 준수** | 공포·불안 카피 금지, 정치 프레이밍·광고성 배제 자기검열 | CLAUDE.md 콘텐츠 정책 |

> **신설 작업**: `agents/writer/` 디렉터리 + schema.ts + prompt.md(S1~S9 + 타입별 헤딩 가이드 내장) + src/. `runAgent`의 `AgentName`에 `'writer'` 추가, DB AgentLog.agentName 허용값·API `VALID_AGENTS`에 추가. writer에 `WebFetch` 도구 권한 부여.

### 3.4 editor \[schema만] — 카피 에디터/교열

| 항목 | 내용 |
|---|---|
| **책임** | 이슈 **단위** 마무리: 기사 **순서**·그날 **테마** 결정 + writer가 쓴 body의 **교열**(톤·일관성·헤딩 규칙 점검). **본문을 처음부터 쓰지 않음** (집필은 writer — §7-C). |
| **트리거** | 02:30 KST \[목표]. writer 완료(전 기사 body 존재) 후 |
| **입력 (목표 schema)** | `{ articles: [{ id, title, summary, body, category, contentType, url }] }` — body 포함 (writer 산출물) |
| **출력 (목표 schema)** | `{ theme?, articles: [{ articleId, customTitle, customDescription(≤180), order, bodyPatch? }], processingTimeMs }` — `bodyPatch`는 교열 수정분(선택) |
| **DB 부수효과 \[목표]** | `IssueArticle.customTitle·customDescription·order` 갱신, `DailyIssue.theme` 갱신, (교열 시) `Article.body` 갱신 |
| **실패 정책** | AgentLog `failed`. 폴백: 교열 생략하고 writer body·기본 순서로 노출 또는 수동(§5). |

### 3.5 hooking \[schema만] — 소셜/뉴스레터 프로듀서

| 항목 | 내용 |
|---|---|
| **책임** | 그날 이슈의 **한 줄 후킹 + 짧은 요약** 생성 (오늘의 이슈 히어로). MVP는 SEO·SNS 미포함 (§7-D). |
| **트리거** | 03:00 KST \[목표]. editor 완료 후 |
| **입력 (목표 schema)** | `{ theme?, articles: [{ id, title, category }] }` |
| **출력 (목표 schema)** | `{ cardHook(≤50), homeCopy(≤100), processingTimeMs }` — `seoHeadline`·`visualTheme` **제거** (§7-D, 기능 착수 시 부활) |
| **DB 부수효과 \[D 결정]** | `DailyIssue.title ← cardHook`, `DailyIssue.summary ← homeCopy`. (`theme`은 editor가 설정) |
| **실패 정책** | AgentLog `failed`. 폴백: 후킹 없이 기사만 노출 (이슈 표시에 치명적이지 않음). |

### 3.6 personalization / qa \[V2 — schema만]

MVP 파이프라인 비포함. `runAgent`의 `AgentName` 타입(현재 `research|curation|editor|hooking`, **+`writer` 추가 필요** §3.3)에도 미포함 → V2에서 타입·DB enum 확장 필요.

- **personalization**: `{ subscriberId, preferredCategories[], articles }` → `{ personalizedArticles:[{articleId,order}], openingLine, closingLine }`. 구독·연령 도입(V2) 이후.
- **qa**: `{ issueId, newsletter{...} }` → `{ status: APPROVED|NEEDS_REVISION|REJECTED, issues[], comments }`. 발행 전 자동 검증 게이트.

---

## 4. 출처 화이트리스트 운영 정책

정책 원본은 CLAUDE.md "출처 풀". 운영 동작:

- **현행**: 화이트리스트는 research **프롬프트 안에 텍스트로** 명시 ([`agents/research/prompt.md`](../agents/research/prompt.md)). 코드 상의 구조화된 allowlist는 없음.
- **추가/제거**: prompt.md 편집 → (선택) AgentConfig에 버전 적재. 프롬프트 하드코딩 금지 원칙(CLAUDE.md)상 코드 내 인라인 금지.
- **신뢰도 매핑**: 카테고리 A 0.85~0.95 / B 0.80~0.90 / C 0.75~0.85. research가 `credibilityScore`로 부여, curation이 선별 시 가중치로 활용.
- **공통 배제**: 개인 블로그·맘카페·자극성 매체·브랜드 마케팅·출처불명 SNS·협찬 콘텐츠.
- **협찬 검증 워크플로**(V2): 인플루언서 화이트리스트화 전 전제 — 미설계.

> \[목표] 화이트리스트를 구조화 데이터(도메인·신뢰도·카테고리)로 분리하면 research 출력 후 **자동 도메인 검증**(화이트리스트 외 URL 자동 탈락)이 가능. 현재는 프롬프트 준수에만 의존.

---

## 5. 수동 개입 포인트 (자동화 신뢰도 낮은 초기)

운영자 1명(`/admin`, Auth/CMS — 별도 작업)이 개입하는 지점:

| 지점 | 동작 | 근거 |
|---|---|---|
| **큐레이션 검수** | research 후보(AgentLog.output) → 운영자가 8~20개 수동 선별 (curation 자동화 fallback) | 초기 선별 신뢰도 낮음 |
| **body 검수** | writer가 집필한 카드뉴스 본문 오타·톤·보이스 수정 (editor 교열 후에도) | 명사형 종결·불릿·브랜드 보이스 점검 |
| **이슈 메타 오버라이드** | hooking 출력 후킹/테마를 수동 덮어쓰기 | 후킹 카피 품질 |
| **Article CRUD** | 오타 수정·긴급 추가·삭제 | — |
| **AgentLog 뷰어** | 실행 이력·실패 사유 확인 → 재실행 트리거 | `GET /api/agents/:name/logs` 기반 |

---

## 6. 에러·롤백·재시도 정책

### 6.1 에이전트 단위
- 실패는 항상 AgentLog `failed`로 기록(메시지+스택). 부분 적재 방지를 위해 DB 쓰기는 **검증 통과 후 한 번에** 수행 \[목표].
- `generateStructured`는 구조화 출력 실패 시 SDK 레벨 자동 재시도. 그 외(네트워크·크레딧) 실패는 상위로 throw.

### 6.2 그날 이슈 처리 (에이전트 실패 시)
우선순위 폴백:
1. **research 실패** → 그날 후보 없음 → **전날 이슈를 메인에 유지** + 운영자 알림 \[목표]. 빈 이슈 노출 금지.
2. **curation 실패** → 후보는 있음 → **수동 큐레이션**(§5)로 진행 또는 전날 이슈 유지.
3. **writer 실패 (건당)** → 그 기사만 `summary`를 임시 body로 노출 또는 수동 집필. 나머지 기사·파이프라인은 계속.
4. **editor 실패** → 기사·body 있음 → 교열 생략, writer body·기본 순서로 노출 또는 수동(§5).
5. **hooking 실패** → 후킹 없이 기사만 노출 (degradation, 치명적 아님).

### 6.3 멱등성
- DailyIssue는 `issueDate` upsert → 같은 날 재실행 안전.
- ⚠️ Article·IssueArticle 재적재 시 중복 방지 키 필요 — §7-B에서 결정. (예: `(issueDate, url)` unique)
- AgentLog는 실행마다 새 행 → 재실행 이력 누적(의도된 동작).

### 6.4 부실한 날 (후보·통과분 부족 — 실패 아님)
화이트리스트가 엄격해 좋은 후보가 적은 날이 정상적으로 발생. **이는 에러가 아니라 degraded 발행**:
- research 후보가 `RESEARCH_TARGET`(40)에 못 미쳐도 success. 나온 만큼 AgentLog.output 기록.
- curation 품질 통과분이 `PUBLISH_MIN`(8) 미만이면 → ① 통과분만으로 발행(소량) 또는 ② **전날 이슈 유지** + 운영자 알림 \[목표]. 억지로 8개를 채우려 품질 낮은 후보 끌어올리지 않음 (CLAUDE.md: "약한 타입은 비워둠").
- 정책 우선순위: **품질 > 수량**. 하한 8은 목표치이지 하드 쿼터가 아님.

---

## 7. 설계 결정 로그 (A~F 전부 ✅ 결정됨 2026-05-20)

> 현재 코드의 모순·공백을 **다음 에이전트 구현 전** 확정한 항목. A~F 모두 결정 완료. 각 항목에 결정·근거·후속작업 기록. (이후 변경 시 날짜와 함께 갱신.)

### A. 발행·선별 카드 수 ✅ 결정됨 (2026-05-20)
**발행 8~20개, 선별배율 ×2 → research 목표 ~40 (best-effort).** 상세는 §1.1. 카테고리 수와 무관한 "하루 노출 카드 총량"이며 전부 soft·config 재조정 가능.
- 후속작업: ① `curation/schema.ts` `targetCount min(10)max(30)` → `targetMin 8 / targetMax 20` ② research output schema 상한 30 → 40, minItems 완화 ③ 발행·선별 상수를 `packages/shared` config로 분리 ④ CLAUDE.md 발행 정책 "5~7개" → "8~20개" + 캐치업 잡에 "둘러보기" 레이어 반영 ⑤ category enum에 `others` 추가 + 카테고리 데이터 기반 리팩터(가변 대비, min 5)
- V2 연동: 온보딩 세그먼트(나이대/생년/관심사=서브카테고리) → 유저별 필터 + "더보기"로 그날 전체 노출.

### B. 후보 → Article 행 적재 주체·시점 ✅ 결정됨 (2026-05-20)
**curation이 선별(발제 승인) 시점에 Article draft 행 생성** + IssueArticle 연결 (B1). 실제 CMS 워크플로(데스크 승인=draft 생성)와 일치. curation 입력 `id`=후보 인덱스/임시 id, 출력으로 실제 행 생성. `body`는 비워두고 writer가 채움.
- 후속작업: curation src 구현 시 행 생성 로직 + `(issueDate, url)` unique 제약 추가(migration).

### C. 카드뉴스 `body` 생성 주체 ✅ 결정됨 (2026-05-20) — writer 분리 (C2)
**body 집필 전담 `writer` 에이전트 신설** (§3.3). curation(선별)·editor(교열)와 분리 = 실제 뉴스룸 분업(데스크/기자/카피에디터). 근거: ① body 보이스가 제품 핵심 차별점 → 독립 튜닝 ② 집필=건당 / 교열·순서=이슈당 으로 작업 단위가 다름 ③ greenfield(미구현)라 지금 분리 비용이 낮고 나중 분리 비용·관성이 큼.
- 후속작업: `agents/writer/`(schema·prompt·src) 신설, `AgentName`·`VALID_AGENTS`·AgentLog 허용값에 `writer` 추가, editor schema에서 body 집필 제거→교열(`bodyPatch`)로, **`docs/brand-voice.md`(브랜드 보이스 스타일가이드) 작성** \[목표].

### D. hooking 출력 ↔ DailyIssue 매핑 + 미사용 필드 처리 ✅ 결정됨 (2026-05-20) — 단순화(YAGNI)
**매핑**: `DailyIssue.title ← cardHook`, `DailyIssue.summary ← homeCopy`, `theme ← editor`.
**스키마 단순화**: 미래 필요가 불확실 + 재추가(nullable add)가 저렴 → 지금 쓰는 것만 남김.
- **추가**: `DailyIssue.summary`(웹·shared가 실제 사용하는 확정 필드, migration).
- **제거**: `DailyIssue.hookingCopy·subjectLine·previewText`(이메일 V2 불확실, shared 타입에도 없음 → 제거 시 드리프트 해소). hooking 출력에서 `seoHeadline·visualTheme` 제거.
- **MVP DailyIssue 컬럼** = `issueDate · title · summary · theme` + 관계.
- 후속작업: migration(`summary` add, 미사용 3컬럼 drop), hooking schema 슬림화.

> **Deferred (의도 보존 — 죽은 컬럼 대신 문서로 증언)**: 이메일 뉴스레터(V2) 착수 시 `subjectLine`(받은편지함 제목)·`previewText`(프리헤더)·`hookingCopy`(본문 도입 훅) 추가. SNS 카드/썸네일 기능 착수 시 hooking 출력에 `visualTheme{colorPalette,imageType,suggestedEmojis}`·`seoHeadline` 부활. 전부 nullable add라 비파괴적.

### E. 파이프라인 오케스트레이터 ✅ 결정됨 (2026-05-20) — 구현
`packages/agents-core`에 `runPipeline(issueDate)` 추가. research→curation→writer(건당 fan-out)→editor→hooking 순차. 각 단계는 직전 단계 AgentLog(success).output을 입력으로. `pnpm pipeline:run`이 이를 호출.
- **실패 정책 = 의존성 종류로 분기**: research·curation 실패 → **파이프라인 중단**(후보·선별 없이 진행 불가, §6.2-1·2 폴백). writer·editor·hooking 실패 → **degrade 후 계속**(§6.2-3·4·5, 부분 산출로 발행).
- **멱등**: issueDate upsert + `(issueDate,url)` unique → 재실행 안전. AgentLog는 실행마다 누적.
- **dry-run** (`pnpm pipeline:dry-run`): 에이전트 실행·AgentLog 기록은 하되 발행성 쓰기(Article/IssueArticle/DailyIssue 표시 필드)는 커밋 안 함 → 미리보기·프롬프트 검증용.
- writer fan-out은 병렬 가능(건당 독립).

### F. AgentConfig (DB 프롬프트 버전 관리) ✅ 결정됨 (2026-05-20) — V2 보류
프롬프트는 파일(`prompt.md`) + git 버전관리로 충분(하드코딩 금지 원칙 충족). AgentConfig 테이블은 **MVP 미사용으로 보존**(이메일 필드와 동일 — 운영 중 무중단 프롬프트 교체가 실제 필요해지는 V2에 활성화). 그때까지 코드는 파일 로드만 사용.

---

## 8. 트리거·실행 레퍼런스

| 방법 | 명령 | 상태 |
|---|---|---|
| 수동 API | `POST /api/agents/research/run` `{date?, categories?}` → `{logId, processingTimeMs, candidateCount}` | \[구현됨] |
| 로그 조회 | `GET /api/agents/:name/logs?status=&issueDate=&limit=` | \[구현됨] |
| CLI | `agents/research/src/cli.ts` | \[구현됨] |
| 전체 파이프라인 | `pnpm pipeline:run` | \[목표 — §7-E] |
| 드라이런 | `pnpm pipeline:dry-run` | \[목표] |
| 크론 (research→curation→writer→editor→hooking 순차, 시각 soft) | 미등록 | \[목표] |

### 실행 환경 메모
- env 로딩: `node --env-file=../../.env --import tsx src/index.ts` (apps/api·agents/research dev)
- API 키 검증: Max Agent SDK 자동 흡수 2026-06-15 시작. 그 전 research 실 호출 검증은 별도 크레딧 필요.

## 9. 아카이브 라이프사이클 (보존·노출·색인) — \[기획 확정 2026-06-02, 미구현]

> 근거·전략 = STRATEGY §11.3. 원칙 = **저장(무기한)·노출(타입별 은퇴)·색인(에버그린만)을 분리.** 저장 비용은 무시(요약만 저장, 10년 ~250MB ≪ Supabase 한도).

### 9.1 3계층 분리
| 계층 | 정책 | 구현 |
|---|---|---|
| **저장(DB)** | 무기한 보관 (삭제·TTL 없음) | 변경 없음 — 기본값 |
| **노출(웹 아카이브)** | 콘텐츠타입별 "은퇴" 시 목록에서 제외 | 쿼리 필터 (아래 9.2) |
| **색인(SEO)** | 만료 콘텐츠 `noindex` (삭제 아님), 에버그린 유지 | 페이지 메타 robots (아래 9.3) |

### 9.2 노출 은퇴 규칙 (기존 필드로 계산, 새 컬럼 불필요)
- **Event**: `eventEndDate`(없으면 `eventStartDate`) + 버퍼(예: 7일) 경과 시 아카이브 목록 제외. (홈/캐치업엔 이미 시의성 윈도우로 안 뜸.)
- **Policy**: 무기한 노출(대체 점검은 수동/후속). 
- **Market·Insight**: `publishedAt` 기준 N개월(예: 6) 후 점진 강등(노출은 유지하되 색인 9.3).
- **Guide**: 무기한 노출(에버그린).
- 구현 위치 = 아카이브 데이터 레이어(`getRecentArticles`/`/issues`) 필터. soft 규칙(상수는 shared config).

### 9.3 색인(SEO) 규칙
- **에버그린(Guide·유효 Policy)** → 색인 유지(롱테일·도메인 권위).
- **만료(지난 Event·대체 Policy·노후 Market/Insight)** → 해당 상세 페이지 `<meta robots="noindex">`. 삭제·301 아님(URL·신뢰 보존).
- 동적 sitemap에서 noindex 대상 제외.
- 점검 주기 = 3~6개월(업계 표준 content pruning).

### 9.4 링크 로트 연계 (STRATEGY §11.2)
- 아카이브 노출 기사 중 원문 링크 죽은 것 = `factcheck.ts` 확장 링크 헬스체크로 플래그 → 상세에서 "원문 사이트에서 읽기" 버튼 제거 + 안내 문구(graceful degradation). 낡은 아카이브가 깨진 링크 안 보이게 = 브랜드 보호. (자체 body가 durable artifact라 콘텐츠는 생존.)

### 9.5 미구현 — 후속 작업 단위
- ⓐ shared config에 타입별 노출/색인 호라이즌 상수 ⓑ 아카이브 쿼리 필터(9.2) ⓒ 상세 robots 메타(9.3) ⓓ 링크 헬스체크 + graceful degradation(9.4) ⓔ sitemap 연계. SEO 근육 단계(STRATEGY/메모리 "SEO 골격 vs 근육")와 함께.

---

## 10. 상세페이지 골격 (contentType별 구조화) — \[설계 확정 2026-06-04, Event만 프로토타입]

> 트리거 = "카테고리별로 상세페이지 주요 정보 포맷이 다를 수 있는데 어떻게 구조화?". 실데이터 61건 분석으로 결론.

### 10.1 핵심 결론 — 포맷을 결정하는 축은 category 아니라 contentType
- **category(8) × contentType(5)는 직교이며 1:1이 아님** (실측: books는 Guide/Event/Insight로 흩어지고, play는 Event/Guide/Market로 흩어짐). → **category로 구조를 짜면 모순** (`books × Event`=도서관 프로그램을 "도서"로 렌더하면 날짜·예약이 빠지고, "행사"로 렌더하면 서지가 빠짐).
- contentType은 애초에 "포맷 다양성"용 직교 축이고, CLAUDE.md가 이미 타입별 본문 헤딩 가이드를 정의 + 메타박스(이벤트·마감)도 이미 contentType 조건부. **포맷 정보는 contentType에 실려 있음.**

### 10.2 3-레이어 모델 (한 페이지를 3축이 각자 담당)
| 레이어 | 구동 축 | 역할 |
|---|---|---|
| **① 골격(Scaffold)** | **contentType** | 메타박스 + 본문 헤딩 스켈레톤 |
| **② 도메인 보강** | **category** | 타입이 못 담는 분야 정보 (books→저자·출판사 / shows·play→예약 / academy→선긋기·통계 / policy→대상·신청채널) |
| **③ 미디어 렌더** | **mediaType** | video·podcast→`durationMin` 배지+임베드(실측 7건) / book→표지·서지 |

`books × Event` 모순도 이 모델에서 해소 = **골격은 Event(날짜·예약), 보강은 books(도서 풍미)** = 충돌 아닌 합성.

### 10.3 구조를 *어디에* 두나 (A/B/C) — 검증 전 빌딩 회피
| 방식 | 내용 | 채택 |
|---|---|---|
| **A. 렌더타임 처리** | 페이지가 기존 typed 필드+body 읽고 조건부 chrome | 기본 |
| **B. 엔티티 링크** | Event→`venueId`로 기존 venue 메타 끌어옴 | Event 채택(아래 10.5) |
| **C. 구조화 필드 신설** | 에이전트가 메타를 JSON으로 채움 | **보류** (스키마+5에이전트+환각, 파이프라인 검증 후) |
> 원칙 = A+B 활용, C(스키마·프로덕션 마이그레이션 동반)는 파이프라인 실호출 검증 뒤로. body 컨벤션(writer가 타입별 표준 헤딩 방출, CLAUDE.md)에 기댐.

### 10.4 타입별 골격 스펙 (메타박스 + 본문 헤딩)
| 타입 | 메타박스 (상단) | 본문 헤딩 (writer 산출) | 메타박스 필드 현실 |
|---|---|---|---|
| **Event** | 연파랑 박스에 행(일시·장소·대상·입장) + **개요(summary) prose 통합** + 예약 CTA(10.5) | ~~행사 개요~~ **폐지**(박스가 대체) / 핵심 콘텐츠(볼거리·프로그램) / 방문 팁 | eventStart 13/13. venue 매칭 6/13(10.5) |
| **Policy** | (현행 deadline 박스가 전부) | 시행 개요 / 달라지는 점 / **양육자 체크**(callout 승격 후보) | **구조화 필드 거의 없음**(deadline 1/11, eventStart 0) → 차별화 전부 body |
| **Guide** | (없음) | 핵심 한 줄(callout) / 체크리스트 / 활용 팁 | 체크리스트 = 체크박스 UI 후보 |
| **Insight** | (없음) | 분석 핵심 / 근거·데이터 / 양육자 시사점 | 근거 数 시각화 후보(선긋기: academy는 통계 비주얼) |
| **Market** | (없음) | 시장 지표 / 핵심 트렌드 / 양육자 시사점 | 지표 강조 후보 |
> ★ **정정(2026-06-04)**: 기존 "시드 body=0이라 깜깜이"는 **오류** — 시드 `data/articles.ts`에 실 body가 풍부(184개 헤딩)하고 CLAUDE.md 타입별 헤딩 계약을 그대로 따름. 따라서 본문 처리도 *지금 시드로 검증 가능*. **✅ 양육자 so-what 콜아웃 구현됨**(10.7). 남은 본문 처리(단계 리스트·지표 강조·리드 TL;DR)는 우선순위 따라 후속(10.6).

### 10.5 Event 골격 — 구현됨 \[프로토타입 2026-06-04]
- **결정 ①=B (venue 링크)** 채택하되 **커버리지 = Event의 ~40-50%만** (실측 6/13). 구조적 이유: `article.source`가 venue일 때도 언론사·티켓팅(뉴스핌·인터파크)일 때도 있음 + ReservableVenue(24건)는 "반복 예약 장소" 카탈로그지 모든 행사장 아님(일회성 축제·뮤지컬은 영원히 미포함). → **Article↔Venue는 본질적 부분(partial) 관계.**
- **해법 = degradation-first**: 일시(article 필드)는 **항상** 렌더, 장소·대상·입장·예약은 **venue 매칭 시만** 행 보강. 빈 박스 문제 소멸.
- **★ 통합 결정(2026-06-04, 사용자 확정)**: 박스(`행사 정보`)와 별도 `한눈에 보는 핵심`(summary)이 **같은 사실을 분산**(박스 "입장:유료" vs prose "어른1.5만"). 문제는 "나눠진 것" 자체 → **한 박스에 통합**하면 해소(약한 enum 칩 + 정확 prose가 *같은 박스* 안). → **연파랑(blue-50) 박스 + 구조화 행(일시·장소·대상·입장) + 개요(summary) prose + 예약 CTA**. 구조화 행=빠른 스캔, prose=정확 요금·대상연령·예매 일시. 상세페이지의 별도 "한눈에 보는 핵심" 박스는 **Event에선 미표시**(EventInfoBox가 summary 보유). 중복 해소.
  > venue `ageRange`/`pricing`은 공연장 전체값이라 generic(venue "3-12" vs 공연 "만5~10세")이지만, 정확값은 같은 박스 prose에 함께 있어 보완됨 — 칩=스캔, prose=정확.
- **구현**: `apps/web/src/lib/event-venue.ts`(LCS≥6 퍼지매처, 임계값 6이 generic 행정명 자연배제) + `components/EventInfoBox.tsx`(연파랑 박스: 행+개요 prose+예약 CTA 통합) + `articles/[id]/page.tsx`(Event일 때 standalone summary 박스 배타 처리). 렌더타임만, 스키마·마이그레이션 0.
- **⚠️ 퍼지매처 = 잠정**. 정식 = 파이프라인(curation)이 venue 카탈로그 대조해 `Article.venueId` 부여 → 퍼지매처를 `getVenueById(article.venueId)` 한 줄로 대체. API 키(결제) 풀리면 승격.

### 10.7 양육자 so-what 콜아웃 — 구현됨 \[프로토타입 2026-06-04]
- **결정 = A(렌더타임)**. 본문 섹션을 역할 분류해 "양육자 액션 결론"을 콜아웃으로 승격. 시드 실측 = **양육자 so-what이 최빈 역할(~55회)**: 양육자 체크포인트(17)·방문 팁(11)·양육자 활용 팁(10)·시사점(8)·활용 팁(8) 등.
- **의미색 체계 정리** = blue(정보: summary·Event 박스) / red(마감) / **green(양육자 액션·🧭 나침반 so-what)**. CLAUDE.md "부모의 나침반 so-what" 보이스를 시각화.
- **분류 키**(`isParentTakeaway`) = 헤딩에 `양육자` 포함 OR `시사점` 포함 OR `팁`으로 끝남. CLAUDE.md 타입별 헤딩 계약 어휘에 붙음(투기 아님). "단계 또는 체크리스트"(how-to 단계)는 **제외** — 단계 리스트는 별도 미구현(10.6 ⓑ).
- **구현**: `components/ArticleBody.tsx`(본문 파싱+역할 분류+렌더, page.tsx에서 추출) + `articles/[id]/page.tsx`는 `<ArticleBody body={...} />` 한 줄. 렌더타임만, 스키마·마이그레이션 0.
- **검증**: type-check 클린 / 로컬 렌더에서 green 콜아웃·일반 섹션 분리, so-what이 본문 맨끝 결론으로 배치, Tailwind가 green 투명도(rgb 2 147 89 / .06·.2) 실제 색 컴파일 확인.

### 10.8 구현 현황 (2026-06-04 세션b) — ✅ 라이브(시드+렌더)
- **본문 처리 전부 구현**(10.4): 양육자 so-what 콜아웃(10.7) / 단계 리스트("N단계:"→번호배지) / 지표 stat(지표·단가·현황·근거데이터→라벨+수치, 숫자 파랑) / 산문 단락 지원 / 핵심 콘텐츠 이미지 placeholder(16:9, 소싱 보류).
- **한눈에 보는 핵심 = TL;DR 불릿**(비Event): 본문 "## 한눈에 보는 핵심" 3불릿 → 상단 박스(스캔), 본문에선 스킵. 박스=스캔/본문=읽기 기능 분리. (`keyPointBullets`)
- **Event 상단 박스**: 행 + 개요 요약 불릿(서술형 아닌 불릿) + CTA. 본문 개요 스킵. "행사 개요" 폐지(ⓑ′) 반영 완료.
- **신뢰도 % → 출처 등급 배지**(`lib/credibility.ts`): 공공기관 공식/공신력 있는 출처/전문 매체. 가짜 정밀도·과시 제거(§10.1 방어).
- **전 기사 세일링 문체 재작성**(61건, 멀티에이전트): 서술=산문 / 한눈에=불릿 / 지표=수치불릿 / 단계=번호 / 콜아웃=so-what. 헤딩 보존·신규숫자0 검증.
- **★ 영구화**: 위 렌더 계약(헤딩 이름·섹션 형식)을 `agents/writer/prompt.md`·CLAUDE.md "본문 작성 스타일"에 반영 → 파이프라인 산출물도 동일 구조. (결제 풀려 writer 실호출 시 효력.)

### 10.6 미구현 / 보류 — 후속 작업 단위
- ⓐ **예매 오픈일 필드**(②, Event) = 진통제 트리거 핵심이나 스키마+프로덕션 마이그레이션 동반 → 파이프라인 첫 실호출과 함께.
- ⓒ **`venueId` 정식 링크**(10.5) = 파이프라인 매칭(현재 렌더타임 퍼지매처).
- ⓓ **category 보강**: books 도서 treatment·academy 선긋기 가드·mediaType 임베드 = 우선순위 낮음.
- ⓔ **이미지 소싱 결정**(핵심 콘텐츠 슬롯): og:image 렌더타임 vs imageUrl 스키마. 현재 placeholder.
- ⓕ **체크박스 UI**(Guide 체크리스트), **지표 차트/비주얼**(현재 stat 행) = 향후.
