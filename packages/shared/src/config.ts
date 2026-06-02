// 발행·선별 상수 — 발행량 조절의 단일 손잡이.
// research·curation 양쪽이 이 값을 참조 → "한 군데만 고치면 전체 반영".
// 전부 soft: 언제든 재조정 가능 (migration·데이터 영향 없음). SPEC §1.1 참조.

/** 하루 노출 카드 하한 (이슈 적은 날도 최소 이만큼 목표 — 하드 쿼터 아님). */
export const PUBLISH_MIN = 8;

/** 하루 노출 카드 상한 (둘러보기 수용, 무한정 X). */
export const PUBLISH_MAX = 20;

/**
 * 엄선 강도(불변값). 압축률 ≈ 1/FACTOR.
 * 키우면 더 엄선(예: ×3 → 60개에서 20개 추림), 줄이면 느슨.
 */
export const SELECTION_FACTOR = 2;

/**
 * research 후보 목표 (파생값 = PUBLISH_MAX × SELECTION_FACTOR).
 * 단일 상한 — research는 뉴스 적은 날도 그물을 넓게 던져 이 수까지 best-effort 수집.
 * 미달은 실패가 아님 (화이트리스트 엄격 → 물리적으로 안 나오는 날 정상).
 */
export const RESEARCH_TARGET = PUBLISH_MAX * SELECTION_FACTOR;
