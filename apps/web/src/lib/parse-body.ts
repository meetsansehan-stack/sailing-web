// 상세 본문(`## 헤딩` + `- 불릿`/산문 단락) 파서 — ArticleBody·EventInfoBox 공용.

export type Block = { type: 'p'; text: string } | { type: 'bullets'; items: string[] };
export type Section = { heading: string; blocks: Block[] };

export function parseBody(body: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) {
      current = { heading: line.slice(3).trim(), blocks: [] };
      sections.push(current);
    } else if (!current) {
      continue;
    } else if (line.startsWith('- ')) {
      const last = current.blocks[current.blocks.length - 1];
      if (last?.type === 'bullets') last.items.push(line.slice(2).trim());
      else current.blocks.push({ type: 'bullets', items: [line.slice(2).trim()] });
    } else {
      current.blocks.push({ type: 'p', text: line });
    }
  }
  return sections;
}

// 첫 "* 개요" 섹션의 불릿만 추출 (Event 상단 박스의 요약 불릿용). 없으면 [].
// Event 본문에선 개요를 스킵(ArticleBody)하고, 대신 상단 EventInfoBox가 이 불릿을 요약으로 표시.
export function overviewBullets(body: string): string[] {
  const section = parseBody(body).find((s) => s.heading.endsWith('개요'));
  if (!section) return [];
  return section.blocks.flatMap((b) => (b.type === 'bullets' ? b.items : []));
}
