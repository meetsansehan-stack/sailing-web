import type { Article, ReservableVenue } from '@parenting-newsletter/shared';

// Event 기사 ↔ ReservableVenue 렌더타임 퍼지매칭 (프로토타입).
//
// ⚠️ 이건 잠정 휴리스틱입니다. 정식 해법 = 파이프라인(curation)이 venue 카탈로그를
//    대조해 Article.venueId를 부여하는 것. API 키(결제) 풀리면 승격.
//    그때 이 파일은 `article.venueId ? getVenueById(...)` 한 줄로 대체됩니다.
//
// 매칭 키 = (article.source | article.title) ↔ (venue.name | venue.reservationChannel)
//   최장 공통 부분문자열(LCS) ≥ MIN_MATCH_LEN 자면 매칭.
//   임계값 6 근거: generic 행정명("서울특별시"=5자)은 자연 배제, distinctive 기관명
//   ("종로문화재단"=6 / "국립아시아문화전당"=9)만 통과. 실데이터 13건으로 검증됨
//   (의도한 6건 매칭, false positive 0).

const MIN_MATCH_LEN = 6;

// 비교용 정규화 — 공백·괄호·구두점 제거, 소문자화. "국립아시아문화전당(ACC)" → "국립아시아문화전당acc"
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // 괄호 내용 제거
    .replace(/[\s·​<>〈〉「」"'"',.\-–—()]/g, '')
    .trim();
}

// 두 문자열의 최장 공통 부분문자열 길이 (DP, O(n·m) — 입력이 짧아 충분).
function longestCommonSubstr(a: string, b: string): number {
  if (!a || !b) return 0;
  const dp = new Array(b.length + 1).fill(0);
  let best = 0;
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev + 1;
        if (dp[j] > best) best = dp[j];
      } else {
        dp[j] = 0;
      }
      prev = tmp;
    }
  }
  return best;
}

// Event 기사에 가장 잘 맞는 venue 1건을 찾음. 없으면 undefined (= 박스는 article 필드로만 degrade).
export function matchVenueForEvent(
  article: Article,
  venues: ReservableVenue[],
): ReservableVenue | undefined {
  if (article.contentType !== 'Event') return undefined;

  const articleKeys = [article.source, article.title].filter(Boolean).map(normalize);

  let best: { venue: ReservableVenue; score: number } | undefined;
  for (const venue of venues) {
    const venueKeys = [venue.name, venue.reservationChannel].filter(Boolean).map(normalize);
    let score = 0;
    for (const ak of articleKeys) {
      for (const vk of venueKeys) {
        score = Math.max(score, longestCommonSubstr(ak, vk));
      }
    }
    if (score >= MIN_MATCH_LEN && (!best || score > best.score)) {
      best = { venue, score };
    }
  }
  return best?.venue;
}
