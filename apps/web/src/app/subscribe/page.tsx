import type { Metadata } from 'next';
import SubscribeCTA from '@/src/components/SubscribeCTA';

export const metadata: Metadata = {
  title: '세일링 레터 구독',
  description: '매주 화요일, 우리 아이에게 필요한 육아 정보를 골라 보내드려요.',
};

const WHAT_YOU_GET = [
  {
    icon: '📌',
    title: '이번 주 중요 기사',
    desc: '정책·교육·행사 중 이번 주 꼭 챙겨야 할 것만 5~7개로 압축해요.',
  },
  {
    icon: '📅',
    title: '신청·마감 캘린더',
    desc: '놓치면 아쉬운 늘봄·돌봄 신청, 어린이 행사 예약 일정을 미리 알려드려요.',
  },
  {
    icon: '📚',
    title: '월 1회 그림책 추천',
    desc: '이 달 아이와 함께 읽기 좋은 그림책·도서를 큐레이터가 골라드려요.',
  },
];

export default function SubscribePage() {
  return (
    <article className="mx-auto max-w-2xl py-12 px-4">

      {/* 헤더 */}
      <header className="text-center">
        <p className="text-small font-semibold uppercase tracking-widest text-blue">세일링 레터</p>
        <h1 className="mt-3 text-h1 font-bold text-ink">
          매주 화요일,<br />우리 아이 육아 정보 브리핑
        </h1>
        <p className="mt-4 text-body text-ink-2 leading-relaxed">
          매일 쏟아지는 정책·행사·교육 뉴스 중에서<br className="hidden sm:inline" />
          만 3~9세 부모에게 진짜 필요한 것만 골라 보내드려요.
        </p>
      </header>

      {/* 받는 내용 */}
      <section className="mt-12">
        <h2 className="text-h3 font-bold text-ink text-center mb-6">이런 내용을 받아요</h2>
        <ul className="space-y-4">
          {WHAT_YOU_GET.map((item) => (
            <li key={item.title} className="flex gap-4 rounded-card border border-line p-5">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-body text-ink-2">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 발행 정보 */}
      <section className="mt-8 rounded-card bg-grey-50 p-5 text-body text-ink-2 space-y-1.5">
        <p>📬 <strong>발행</strong> 매주 화요일 저녁</p>
        <p>🔒 <strong>개인정보</strong> 이메일만 수집해요. 아이 정보는 받지 않아요.</p>
        <p>↩️ <strong>해지</strong> 언제든 원클릭 해지 가능해요.</p>
      </section>

      {/* 구독 폼 */}
      <section className="mt-10">
        <SubscribeCTA source="subscribe_page" variant="full" />
      </section>

      {/* 세일링 웹 안내 */}
      <p className="mt-8 text-center text-small text-ink-3">
        레터 없이 바로 읽고 싶다면?{' '}
        <a href="/" className="underline underline-offset-2 hover:text-ink-2">
          세일링 웹에서 무료로 보기 →
        </a>
      </p>
    </article>
  );
}
