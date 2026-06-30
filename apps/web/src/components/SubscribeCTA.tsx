'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { track, getAnonId } from '@/src/lib/analytics';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LS_KEY = 'sailing_subscribed';

type Status = 'idle' | 'loading' | 'done' | 'error';

// compact: 홈 하단 간략 버전 (뭘 받는지 힌트 + 폼 + 자세히 보기)
// full: /subscribe 페이지에서 쓰는 폼만 버전
export default function SubscribeCTA({
  source = 'home_cta',
  variant = 'compact',
}: {
  source?: string;
  variant?: 'compact' | 'full';
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const seen = useRef(false);

  useEffect(() => {
    // localStorage 구독 여부 확인 (SSR 후 클라이언트에서만)
    if (localStorage.getItem(LS_KEY) === '1') {
      setAlreadySubscribed(true);
      return;
    }
    if (seen.current) return;
    seen.current = true;
    track('cta_impression', { source });
  }, [source]);

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setStatus('error');
      setMessage('이메일 형식을 확인해 주세요.');
      return;
    }
    setStatus('loading');
    track('cta_click', { source });

    try {
      const res = await fetch(`${API_BASE}/api/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source, anonId: getAnonId() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      localStorage.setItem(LS_KEY, '1');
      setStatus('done');
      track('subscribe_success', { source });
    } catch {
      setStatus('error');
      setMessage('잠시 후 다시 시도해 주세요.');
    }
  }

  // 이미 구독한 기기에서 재방문
  if (alreadySubscribed) {
    const inner = (
      <div className="text-center">
        <p className="text-xl">✅</p>
        <p className="mt-2 text-card-title font-bold text-ink">세일링 레터를 구독 중이에요</p>
        <p className="mt-1.5 text-body text-ink-2">매주 화요일 저녁에 도착해요.</p>
        <Link
          href="/issues"
          className="mt-4 inline-block rounded-btn bg-blue px-5 py-2.5 text-body font-semibold text-white transition hover:bg-blue-600"
        >
          이번 주 브리핑 보기 →
        </Link>
      </div>
    );

    if (variant === 'full') return <div className="mx-auto max-w-md">{inner}</div>;

    return (
      <section className="mt-16 rounded-card border border-blue-200 bg-blue-50 p-8 sm:p-10">
        {inner}
      </section>
    );
  }

  // 구독 완료 직후
  if (status === 'done') {
    const inner = (
      <div className="text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-3 text-card-title font-bold text-ink">세일링 레터 구독 완료!</p>
        <p className="mt-1.5 text-body text-ink-2">매주 화요일 저녁, 첫 번째 레터가 도착해요.</p>
        <Link
          href="/issues"
          className="mt-5 inline-block rounded-btn bg-blue px-5 py-2.5 text-body font-semibold text-white transition hover:bg-blue-600"
        >
          이번 주 브리핑 보기 →
        </Link>
      </div>
    );

    if (variant === 'full') return <div className="mx-auto max-w-md">{inner}</div>;

    return (
      <section className="mt-16 rounded-card border border-blue-200 bg-blue-50 p-8 sm:p-10">
        {inner}
      </section>
    );
  }

  const form = (
    <>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          aria-label="이메일 주소"
          className="flex-1 rounded-btn border border-grey-300 bg-white px-4 py-3 text-card-title text-ink outline-none focus:border-blue"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-btn bg-blue px-6 py-3 text-card-title font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
        >
          {status === 'loading' ? '구독 중…' : '구독하기'}
        </button>
      </form>
      {status === 'error' && <p className="mt-3 text-meta text-red">{message}</p>}
      <p className="mt-3 text-small text-ink-3">
        언제든 해지할 수 있어요. 아이 정보는 받지 않아요.
      </p>
      <p className="mt-1.5 text-small text-ink-3">
        구독하면{' '}
        <a href="/privacy" className="underline underline-offset-2 hover:text-ink-2">
          개인정보처리방침
        </a>{' '}
        및{' '}
        <a href="/terms" className="underline underline-offset-2 hover:text-ink-2">
          이용약관
        </a>
        에 동의하는 것으로 간주돼요. 만 14세 이상만 구독할 수 있어요.
      </p>
    </>
  );

  if (variant === 'full') {
    return <div className="mx-auto max-w-md">{form}</div>;
  }

  // compact — 홈 하단
  return (
    <section className="mt-16 rounded-card border border-line bg-grey-50 p-8 sm:p-10">
      <div className="mx-auto max-w-md text-center">
        <p className="text-small font-semibold uppercase tracking-widest text-blue">세일링 레터</p>
        <h2 className="mt-2 text-h3 font-bold text-ink">매주 화요일, 이런 내용을 보내드려요</h2>
        <ul className="mt-4 space-y-1.5 text-body text-ink-2">
          <li>📌 이번 주 중요 기사 5~7개 큐레이션</li>
          <li>📅 놓치면 아쉬운 신청·마감 캘린더</li>
          <li>📚 월 1회 그림책·도서 추천</li>
        </ul>
        {form}
        <Link
          href="/subscribe"
          className="mt-4 inline-block text-small text-ink-3 underline underline-offset-2 hover:text-ink-2"
        >
          세일링 레터 자세히 보기 →
        </Link>
      </div>
    </section>
  );
}
