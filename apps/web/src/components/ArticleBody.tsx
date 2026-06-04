// 상세페이지 본문 렌더 — `## 헤딩` + `- 불릿` 마크다운을 섹션으로 파싱해 표시.
//
// 섹션 역할 분류(렌더타임, 스키마 0): 양육자 so-what 섹션을 일반 섹션과 시각적으로 구분.
//   의미색 체계 = blue(정보) / red(마감) / **green(양육자 액션·나침반 so-what)**.
//   분류 키 = CLAUDE.md "타입별 권장 헤딩" 계약에 박힌 어휘(양육자 *·* 시사점·* 팁).
//   시드 실측: 양육자 체크포인트·방문 팁·양육자 활용 팁·시사점·활용 팁 등 ~55회 = 최빈 역할.

type Section = { heading: string; bullets: string[] };

function parseBody(body: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      current = { heading: line.slice(3).trim(), bullets: [] };
      sections.push(current);
    } else if (line.startsWith('- ') && current) {
      current.bullets.push(line.slice(2).trim());
    }
  }
  return sections;
}

// 양육자 액션/시사점/팁 = "부모가 뭘 하면 되나"의 결론. so-what 콜아웃으로 승격.
// "양육자 체크포인트·활용 팁·시사점·액션" + "방문 팁·활용 팁·예매·관람 팁" 등을 포섭하되,
// "단계 또는 체크리스트"(how-to 단계)는 제외 — 그건 별도 단계 리스트 처리 대상(미구현).
function isParentTakeaway(heading: string): boolean {
  return heading.includes('양육자') || heading.includes('시사점') || heading.endsWith('팁');
}

function BulletList({ bullets, accent }: { bullets: string[]; accent?: boolean }) {
  return (
    <ul className="space-y-3">
      {bullets.map((bullet, idx) => {
        const colonIdx = bullet.indexOf(':');
        const hasKey = colonIdx > 0 && colonIdx < 20;
        const key = hasKey ? bullet.slice(0, colonIdx).trim() : '';
        const value = hasKey ? bullet.slice(colonIdx + 1).trim() : bullet;
        return (
          <li key={idx} className="flex gap-3 text-body leading-relaxed text-ink-2">
            <span
              className={`mt-2.5 inline-block h-1 w-1 shrink-0 rounded-full ${
                accent ? 'bg-green' : 'bg-grey-400'
              }`}
            />
            <span>
              {hasKey && <span className="font-semibold text-ink">{key} · </span>}
              {value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function ArticleBody({ body }: { body: string }) {
  return (
    <article className="mt-12 space-y-10">
      {parseBody(body).map((section, idx) =>
        isParentTakeaway(section.heading) ? (
          // 양육자 so-what 콜아웃 (green = 액션·나침반)
          <section key={idx} className="rounded-card border border-green/20 bg-green/[0.06] p-6">
            <h2 className="mb-4 flex items-center gap-2 text-h3 text-green">
              <span aria-hidden>🧭</span>
              {section.heading}
            </h2>
            <BulletList bullets={section.bullets} accent />
          </section>
        ) : (
          // 일반 섹션 — 박스 없이 리딩 흐름
          <section key={idx}>
            <h2 className="mb-4 flex items-center gap-2.5 text-h3 text-ink">
              <span className="inline-block h-5 w-1 rounded-full bg-blue" />
              {section.heading}
            </h2>
            <BulletList bullets={section.bullets} />
          </section>
        ),
      )}
    </article>
  );
}
