'use client';

import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { track, getAnonId } from '@/src/lib/analytics';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LS_SUBSCRIBED = 'sailing_subscribed';

type Status = 'idle' | 'loading' | 'done' | 'error';

export default function LoginModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 모달 열릴 때 localStorage 확인 + 포커스
  useEffect(() => {
    if (!open) return;
    setAlreadySubscribed(localStorage.getItem(LS_SUBSCRIBED) === '1');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // ESC 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  async function onSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) { setStatus('error'); setErrMsg('이메일 형식을 확인해 주세요.'); return; }
    setStatus('loading');
    track('cta_click', { source: 'login_modal' });
    try {
      const res = await fetch(`${API_BASE}/api/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source: 'login_modal', anonId: getAnonId() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      localStorage.setItem(LS_SUBSCRIBED, '1');
      setStatus('done');
      track('subscribe_success', { source: 'login_modal' });
    } catch {
      setStatus('error');
      setErrMsg('잠시 후 다시 시도해 주세요.');
    }
  }

  return (
    <>
      {/* GNB 트리거 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="ml-2 rounded-full bg-grey-900 px-4 py-1.5 font-semibold text-white transition hover:bg-grey-700"
      >
        로그인
      </button>

      {/* 모달 오버레이 — sticky header 안에서 fixed가 깨지므로 Portal로 body에 마운트 */}
      {mounted && open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
            {/* 닫기 */}
            <button
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="absolute right-4 top-4 text-ink-3 hover:text-ink transition"
            >
              ✕
            </button>

            {/* 헤더 */}
            <div className="text-center">
              <p className="text-3xl">⛵</p>
              <h2 className="mt-2 text-h2 font-bold text-ink">Sailing</h2>
              <p className="mt-1 text-body text-ink-3">매주 화요일, 육아 정보 브리핑</p>
            </div>

            {/* 이미 구독 중 */}
            {alreadySubscribed ? (
              <div className="mt-8 text-center">
                <p className="text-xl">✅</p>
                <p className="mt-2 font-bold text-ink">이미 구독 중이에요</p>
                <p className="mt-1 text-body text-ink-2">매주 화요일 저녁에 도착해요.</p>
                <Link
                  href="/issues"
                  onClick={() => setOpen(false)}
                  className="mt-5 inline-block rounded-btn bg-blue px-5 py-2.5 text-body font-semibold text-white transition hover:bg-blue-600"
                >
                  이번 주 브리핑 보기 →
                </Link>
              </div>
            ) : status === 'done' ? (
              /* 구독 완료 */
              <div className="mt-8 text-center">
                <p className="text-2xl">🎉</p>
                <p className="mt-2 font-bold text-ink">구독 완료!</p>
                <p className="mt-1 text-body text-ink-2">매주 화요일 저녁, 첫 레터가 도착해요.</p>
                <Link
                  href="/issues"
                  onClick={() => setOpen(false)}
                  className="mt-5 inline-block rounded-btn bg-blue px-5 py-2.5 text-body font-semibold text-white transition hover:bg-blue-600"
                >
                  이번 주 브리핑 보기 →
                </Link>
              </div>
            ) : (
              /* 구독 폼 */
              <form onSubmit={onSubmit} className="mt-8 space-y-3">
                <input
                  ref={inputRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                  className="w-full rounded-btn border border-grey-300 px-4 py-3 text-body text-ink outline-none focus:border-blue"
                />
                {status === 'error' && <p className="text-small text-red">{errMsg}</p>}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-btn bg-blue py-3 text-body font-bold text-white transition hover:bg-blue-600 disabled:opacity-60"
                >
                  {status === 'loading' ? '구독 중…' : '레터 구독하기'}
                </button>
                <p className="text-center text-small text-ink-3">
                  구독하면{' '}
                  <Link href="/privacy" onClick={() => setOpen(false)} className="underline underline-offset-2">개인정보처리방침</Link>
                  {' '}및{' '}
                  <Link href="/terms" onClick={() => setOpen(false)} className="underline underline-offset-2">이용약관</Link>
                  에 동의해요.
                </p>
                <p className="text-center text-small text-ink-3 pt-1">
                  소셜 로그인은 준비 중이에요.
                </p>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
