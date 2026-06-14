/**
 * 에이전트별 모델 매핑 (단일 소스).
 *
 * 기준 = 성능·효율(작업 적합도). 품질이 의미 있게 오르는 곳만 Opus, 동급이면 Sonnet(더 빠름).
 *  - 유저가 보는 산출물 라인(고르기·쓰기·다듬기·후킹) = Opus 4.8
 *  - 뒤에서 모으고 확인하는 라인(수집·검증) = Sonnet 4.6 (모델 IQ보다 검색전략·코드가 좌우)
 * 상세 근거: docs/STRATEGY.md / 세션 로그 2026-06-02.
 *
 * 각 모델은 env로 개별 오버라이드 가능 (예: MODEL_WRITER=claude-sonnet-4-6 으로 A/B).
 */
export const MODELS = {
  opus: 'claude-opus-4-8',
  sonnet: 'claude-sonnet-4-6',
} as const;

export const AGENT_MODELS = {
  research: process.env.MODEL_RESEARCH ?? MODELS.sonnet, // 와이드넷 수집(recall), 볼륨·속도
  curation: process.env.MODEL_CURATION ?? MODELS.opus, // 선별 = 제품의 심장(편집 판단·선 긋기 톤)
  writer: process.env.MODEL_WRITER ?? MODELS.sonnet, // 2026-06-14 A/B: Sonnet 품질 동급(이벤트·정책·목록)·비용 ~1/3($0.18/건). 타겟연령 필터는 writer prompt S3′로 보강.
  editor: process.env.MODEL_EDITOR ?? MODELS.opus, // 보이스·테마 일관성 품질 게이트
  hooking: process.env.MODEL_HOOKING ?? MODELS.opus, // 비클릭베이트 후킹 카피(고레버리지)
  qa: process.env.MODEL_QA ?? MODELS.sonnet, // 코드 그라운딩 검증, 바운디드 판단
} as const;
