import type { Metadata } from 'next';
import LetterEditor from '@/src/components/admin/LetterEditor';

export const metadata: Metadata = {
  title: '새 레터 작성',
  robots: { index: false, follow: false },
};

export default async function NewLetterPage({
  searchParams,
}: {
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

  return <LetterEditor token={token} />;
}
