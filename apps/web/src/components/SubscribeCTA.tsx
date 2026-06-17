'use client';

import { useEffect, useRef, useState } from 'react';
import { track, getAnonId } from '@/src/lib/analytics';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = 'idle' | 'loading' | 'done' | 'error';

// 이메일 구독 CTA — 라이트 계정·메일 토대(뉴닉형). 익명 읽기 안 막고, 가치교환 순간에 권유.
// source='home_cta'로 유입 지점 태깅. 노출/클릭/성공 익명 분석.
export default function SubscribeCTA({ source = 'home_cta' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const seen = useRef(false);

  // 노출 1회 측정
  useEffect(() => {
    if (seen.current) return;
    seen.current = true;
    track('cta_impression', { source });
  }, [source]);

  async function onSubmit(e: React.FormEvent) {
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
      const data = (await res.json()) as { alreadySubscribed?: boolean };
      setStatus('done');
      setMessage(
        data.alreadySubscribed
          ? '이미 구독 중이에요. 새 소식으로 다시 찾아올게요.'
          : '구독 완료! 매일의 좌표를 메일로 보내드릴게요.',
      );
      track('subscribe_success', { source });
    } catch {
      setStatus('error');
      setMessage('잠시 후 다시 시도해 주세요.');
    }
  }

  if (status === 'done') {
    return (
      <section className="mt-16 rounded-card border border-line bg-blue-50 p-8 text-center">
        <p className="text-card-title font-semibold text-ink">{message}</p>
      </section>
    );
  }

  return (
    <section className="mt-16 rounded-card border border-line bg-grey-50 p-8 sm:p-10">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-h3 font-bold text-ink">매일의 좌표를 메일로</h2>
        <p className="mt-2 text-meta text-ink-3">
          오늘 챙겨야 할 정책·신청·행사를, 놓치지 않게 하루 한 번 정리해 보내드려요.
        </p>
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
          </a>
          {' '}및{' '}
          <a href="/terms" className="underline underline-offset-2 hover:text-ink-2">
            이용약관
          </a>
          에 동의하는 것으로 간주돼요. 만 14세 이상만 구독할 수 있어요.
        </p>
      </div>
    </section>
  );
}
