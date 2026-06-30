import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '세일링 레터',
  description: '매주 화요일, 만 3~9세 부모를 위한 육아 정보 브리핑.',
};

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type LetterMeta = {
  slug: string;
  subject: string;
  previewText: string | null;
  sentAt: string;
  sentCount: number;
};

async function fetchLetters(): Promise<LetterMeta[]> {
  try {
    const res = await fetch(`${API_BASE}/api/letters`, { next: { revalidate: 300 } });
    return res.ok ? (await res.json() as LetterMeta[]) : [];
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default async function LetterPage() {
  const letters = await fetchLetters();

  return (
    <div className="mx-auto max-w-2xl py-12 px-4">
      <header className="mb-10">
        <p className="text-small font-semibold uppercase tracking-widest text-blue">세일링 레터</p>
        <h1 className="mt-2 text-h1 font-bold text-ink">레터 아카이브</h1>
        <p className="mt-3 text-body text-ink-2">
          매주 화요일, 만 3~9세 부모에게 꼭 필요한 정보만 골라 보내드려요.
        </p>
        <Link
          href="/subscribe"
          className="mt-4 inline-block rounded-btn bg-blue px-5 py-2.5 text-body font-semibold text-white transition hover:bg-blue-600"
        >
          레터 구독하기 →
        </Link>
      </header>

      {letters.length === 0 ? (
        <div className="rounded-card border border-line bg-grey-50 py-16 text-center text-ink-3">
          아직 발행된 레터가 없어요.
        </div>
      ) : (
        <ul className="space-y-4">
          {letters.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/letter/${l.slug}`}
                className="group block rounded-card border border-line bg-white p-6 transition hover:border-blue hover:shadow-sm"
              >
                <p className="text-small text-ink-3">{formatDate(l.sentAt)}</p>
                <h2 className="mt-1 text-card-title font-bold text-ink group-hover:text-blue">
                  {l.subject}
                </h2>
                {l.previewText && (
                  <p className="mt-1.5 text-body text-ink-2 line-clamp-2">{l.previewText}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
