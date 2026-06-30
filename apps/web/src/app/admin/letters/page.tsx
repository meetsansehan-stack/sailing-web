import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '레터 관리',
  robots: { index: false, follow: false },
};

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type LetterRow = {
  id: string;
  slug: string;
  subject: string;
  previewText: string | null;
  sentAt: string | null;
  sentCount: number;
  createdAt: string;
};

async function fetchAll(token: string): Promise<LetterRow[]> {
  try {
    const res = await fetch(`${API_BASE}/api/letters/admin`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return res.ok ? (await res.json() as LetterRow[]) : [];
  } catch {
    return [];
  }
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default async function AdminLettersPage({
  searchParams,
}: {
  searchParams?: Promise<{ key?: string }>;
}) {
  const token = process.env.ADMIN_API_TOKEN;
  const sp = await searchParams;
  if (!token || sp?.key !== token) {
    return (
      <div className="mx-auto max-w-md py-20 text-center text-ink-3">
        {token ? '접근 키가 필요해요. ?key=… 를 확인해 주세요.' : 'ADMIN_API_TOKEN이 설정되지 않았어요.'}
      </div>
    );
  }

  const letters = await fetchAll(token);
  const keyParam = `?key=${token}`;

  return (
    <div className="mx-auto max-w-3xl py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-h2 font-bold text-ink">세일링 레터 관리</h1>
        <Link
          href={`/admin/letters/new${keyParam}`}
          className="rounded-btn bg-blue px-5 py-2.5 text-body font-semibold text-white transition hover:bg-blue-600"
        >
          + 새 레터
        </Link>
      </div>

      {letters.length === 0 ? (
        <div className="rounded-card border border-line bg-grey-50 py-16 text-center text-ink-3">
          레터가 없어요. 새 레터를 작성해 보세요.
        </div>
      ) : (
        <div className="overflow-hidden rounded-card border border-line">
          <table className="w-full text-body">
            <thead className="bg-grey-50 text-small text-ink-3">
              <tr>
                <th className="px-4 py-3 text-left font-medium">제목</th>
                <th className="px-4 py-3 text-left font-medium w-28">상태</th>
                <th className="px-4 py-3 text-left font-medium w-28">발송일</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {letters.map((l) => (
                <tr key={l.id} className="hover:bg-grey-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{l.subject}</p>
                    {l.previewText && (
                      <p className="mt-0.5 text-small text-ink-3 line-clamp-1">{l.previewText}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {l.sentAt ? (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-small text-green-700">발송 완료</span>
                    ) : (
                      <span className="inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-small text-yellow-700">초안</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-small text-ink-3">{fmt(l.sentAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/letters/${l.id}${keyParam}`}
                      className="text-small text-blue hover:underline"
                    >
                      편집
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-right">
        <Link href="/letter" className="text-small text-ink-3 hover:text-ink underline underline-offset-2">
          공개 아카이브 보기 →
        </Link>
      </div>
    </div>
  );
}
