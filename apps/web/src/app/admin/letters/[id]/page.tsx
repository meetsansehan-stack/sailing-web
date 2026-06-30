import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LetterEditor from '@/src/components/admin/LetterEditor';

export const metadata: Metadata = {
  title: '레터 편집',
  robots: { index: false, follow: false },
};

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Letter = {
  id: string;
  slug: string;
  subject: string;
  previewText: string | null;
  editorNote: string | null;
  sentAt: string | null;
  items: Array<{
    id: string;
    order: number;
    category: string;
    title: string;
    subtitle: string | null;
    body: string;
    quote: string | null;
    url: string | null;
    articleId: string | null;
  }>;
};

async function fetchLetter(id: string, token: string): Promise<Letter | null> {
  try {
    const res = await fetch(`${API_BASE}/api/letters/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return res.ok ? (await res.json() as Letter) : null;
  } catch {
    return null;
  }
}

export default async function EditLetterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ key?: string }>;
}) {
  const token = process.env.ADMIN_API_TOKEN;
  const sp = await searchParams;
  if (!token || sp?.key !== token) {
    return (
      <div className="mx-auto max-w-md py-20 text-center text-ink-3">
        접근 키가 필요해요. ?key=… 를 확인해 주세요.
      </div>
    );
  }

  const { id } = await params;
  const letter = await fetchLetter(id, token);
  if (!letter) notFound();

  return <LetterEditor token={token} initial={letter} />;
}
