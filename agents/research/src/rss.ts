import Parser from 'rss-parser';

// RSS 수집기 — 결정론적(LLM 0). 화이트리스트 피드에서 최신 기사 후보를 대량 수집.
// research가 WebSearch 보강 전에 이 후보 풀을 깔아 수집량을 끌어올린다. (project_source_expansion)

const parser = new Parser({ timeout: 12000 });

export type RssCandidate = {
  title: string;
  url: string;
  /** 원문 발행일 YYYY-MM-DD (RSS pubDate/isoDate 파생). 못 구하면 생략. */
  publishedAt?: string;
  source: string;
  /** 피드 출처의 카테고리 힌트 (큐레이션 분류 보조). */
  feedHint?: string;
};

export type RssFeed = { url: string; source: string; hint?: string };

// 화이트리스트 RSS 피드. 신뢰등급·근거는 [[project_source_expansion]].
// korea.kr = 100% 공공(정책). 베이비뉴스 = 회색(기자기사·정책만, 광고성은 큐레이션이 배제).
export const RSS_FEEDS: RssFeed[] = [
  { url: 'https://www.korea.kr/rss/policy.xml', source: '대한민국 정책브리핑', hint: 'policy' },
  { url: 'https://www.korea.kr/rss/dept_moe.xml', source: '교육부', hint: 'policy' },
  { url: 'https://www.ibabynews.com/rss/allArticle.xml', source: '베이비뉴스', hint: 'parenting' },
];

function toDateOnly(d?: string): string | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString().slice(0, 10);
}

/** 피드들에서 후보 수집. 한 피드 실패는 건너뜀(resilient). URL 중복 제거. */
export async function fetchRssFeeds(feeds: RssFeed[] = RSS_FEEDS): Promise<RssCandidate[]> {
  const collected: RssCandidate[] = [];
  await Promise.all(
    feeds.map(async (f) => {
      try {
        const feed = await parser.parseURL(f.url);
        for (const item of feed.items) {
          if (!item.title || !item.link) continue;
          collected.push({
            title: item.title.trim(),
            url: item.link,
            publishedAt: toDateOnly(item.isoDate ?? item.pubDate),
            source: f.source,
            feedHint: f.hint,
          });
        }
      } catch (err) {
        console.warn(`[rss] '${f.source}' 수집 실패(건너뜀): ${err instanceof Error ? err.message : err}`);
      }
    }),
  );
  // URL 중복 제거 (피드 간 겹침 대비).
  const seen = new Set<string>();
  return collected.filter((c) => (seen.has(c.url) ? false : (seen.add(c.url), true)));
}
