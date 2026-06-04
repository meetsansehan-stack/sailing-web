// 신뢰도 = 점수(%) 대신 "출처 등급" 배지로 표현.
//
// 근거: credibilityScore는 리서치 에이전트가 *출처 풀 tier*를 보고 부여하는 값
//   (agents/research/prompt.md §credibilityScore 산정). 즉 "이 기사가 사실이냐"가 아니라
//   "출처가 어느 등급이냐"의 인코딩. "96%" 식 2자리 정밀도는 실재하지 않는 신호라
//   → 점수를 등급 밴드로 환원해 *정직하게* 표시(가짜 정밀도·과시 제거, 브랜드 톤 정합).
// ⚠️ 점수 밴드가 출처 tier와 1:1은 아님(프롬프트 표의 범위가 겹침) → 코어스 3등급으로.

export type CredibilityTier = { label: string; desc: string };

export function credibilityTier(score: number): CredibilityTier {
  if (score >= 0.9) return { label: '공공기관 공식', desc: '정부·공공기관 공식 발표 기반' };
  if (score >= 0.8)
    return { label: '공신력 있는 출처', desc: '공영방송·검증 전문가·공신력 언론' };
  return { label: '전문 매체', desc: '해당 분야 전문 매체' };
}
