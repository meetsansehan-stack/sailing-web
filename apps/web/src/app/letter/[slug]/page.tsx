import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { marked } from 'marked';

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type LetterItem = {
  id: string;
  order: number;
  category: string;
  title: string;
  subtitle: string | null;
  body: string;
  quote: string | null;
  url: string | null;
};

type Letter = {
  id: string;
  slug: string;
  subject: string;
  previewText: string | null;
  editorNote: string | null;
  sentAt: string;
  items: LetterItem[];
};

async function fetchLetter(slug: string): Promise<Letter | null> {
  try {
    const res = await fetch(`${API_BASE}/api/letters/${slug}`, { next: { revalidate: 3600 } });
    return res.ok ? (await res.json() as Letter) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const letter = await fetchLetter(slug);
  if (!letter) return { title: '레터를 찾을 수 없어요' };
  return {
    title: letter.subject,
    description: letter.previewText ?? '세일링 레터 아카이브',
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });
}

export default async function LetterDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const letter = await fetchLetter(slug);
  if (!letter) notFound();

  const editorHtml = letter.editorNote
    ? await marked(letter.editorNote, { gfm: true, breaks: true })
    : null;

  const itemsHtml = await Promise.all(
    letter.items.map(async (it) => ({
      ...it,
      bodyHtml: await marked(it.body, { gfm: true, breaks: true }),
    }))
  );

  return (
    <article className="mx-auto max-w-2xl py-12 px-4">
      {/* 헤더 */}
      <header className="mb-8 border-b border-line pb-8">
        <Link href="/letter" className="text-small text-ink-3 hover:text-ink">
          ← 레터 아카이브
        </Link>
        <p className="mt-4 text-small text-ink-3">{formatDate(letter.sentAt)}</p>
        <h1 className="mt-1 text-h2 font-bold text-ink sm:text-h1">{letter.subject}</h1>
        {letter.previewText && (
          <p className="mt-3 text-body text-ink-2">{letter.previewText}</p>
        )}
      </header>

      {/* 에디터 노트 */}
      {editorHtml && (
        <div className="mb-10 rounded-card bg-grey-50 p-5">
          <div className="prose-korean" dangerouslySetInnerHTML={{ __html: editorHtml }} />
        </div>
      )}

      {/* 아티클 목록 */}
      <div className="space-y-10">
        {itemsHtml.map((it) => (
          <section key={it.id} className="border-b border-line pb-10 last:border-0">
            {/* 섹션명 */}
            <p className="text-small font-semibold uppercase tracking-widest text-blue mb-2">
              {it.category}
            </p>
            {/* 대제목 */}
            <h2 className="text-h3 font-bold text-ink">{it.title}</h2>
            {/* 소제목 */}
            {it.subtitle && (
              <p className="mt-1.5 text-body text-ink-2">{it.subtitle}</p>
            )}
            {/* 본문 */}
            <div className="prose-korean mt-4" dangerouslySetInnerHTML={{ __html: it.bodyHtml }} />
            {/* 핵심 인용구 */}
            {it.quote && (
              <blockquote className="mt-5 border-l-4 border-blue pl-4 text-body italic text-ink-2">
                {it.quote}
              </blockquote>
            )}
            {/* 원문 링크 */}
            {it.url && (
              <a href={it.url} target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-block text-small text-blue hover:underline">
                원문 보기 →
              </a>
            )}
          </section>
        ))}
      </div>

      {/* 하단 CTA */}
      <footer className="mt-12 border-t border-line pt-8 text-center">
        <p className="text-body text-ink-2">매주 화요일, 이런 레터를 이메일로 받아보세요.</p>
        <Link href="/subscribe"
          className="mt-4 inline-block rounded-btn bg-blue px-6 py-3 text-body font-semibold text-white transition hover:bg-blue-600">
          세일링 레터 구독하기 →
        </Link>
        <p className="mt-3 text-small text-ink-3">
          <Link href="/letter" className="underline underline-offset-2 hover:text-ink">
            다른 레터 보기
          </Link>
        </p>
      </footer>
    </article>
  );
}
