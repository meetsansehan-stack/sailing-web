'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/src/lib/analytics';

// Sean Ellis 40% 테스트 — 1문항 micro-survey.
// 트리거: 세션 내 3번째 페이지뷰 + 8초 체류. 1기기 1회(localStorage 플래그).
// 응답은 survey_response 이벤트로 적재. PII 0.

const SURVEY_KEY = 'sailing.survey.v1';
const PV_KEY = 'sailing.survey.pv';

const OPTIONS = [
  { value: 'very_disappointed', label: '매우 아쉬울 것 같아요' },
  { value: 'somewhat_disappointed', label: '조금 아쉬울 것 같아요' },
  { value: 'not_disappointed', label: '별로 안 아쉬울 것 같아요' },
  { value: 'has_alternative', label: '이미 비슷한 걸 쓰고 있어요' },
] as const;

export default function MicroSurvey() {
  const pathname = usePathname();
  const pvRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SURVEY_KEY)) return;
    } catch {
      return;
    }

    // 세션 내 페이지뷰 카운터 (sessionStorage — 탭 닫으면 리셋)
    try {
      const prev = Number(sessionStorage.getItem(PV_KEY) ?? '0');
      const next = prev + 1;
      sessionStorage.setItem(PV_KEY, String(next));
      pvRef.current = next;
    } catch {
      pvRef.current += 1;
    }

    if (pvRef.current < 3) return;

    // 3페이지뷰 이상 → 현재 페이지에서 8초 후 표시
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        if (!localStorage.getItem(SURVEY_KEY)) setVisible(true);
      } catch {}
    }, 8000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  const handleAnswer = (value: string) => {
    track('survey_response', { question: 'sean_ellis_v1', answer: value });
    try {
      localStorage.setItem(SURVEY_KEY, value);
    } catch {}
    setDone(true);
    setTimeout(() => setVisible(false), 1800);
  };

  const handleDismiss = () => {
    track('survey_response', { question: 'sean_ellis_v1', answer: 'dismissed' });
    try {
      localStorage.setItem(SURVEY_KEY, 'dismissed');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="짧은 설문"
      className="fixed bottom-6 right-4 z-50 w-72 rounded-card border border-line bg-white shadow-xl sm:right-6 sm:w-80"
    >
      <div className="p-5">
        {done ? (
          <p className="text-center text-body font-semibold text-ink">감사해요! 🧭</p>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-2">
              <p className="text-body font-semibold leading-snug text-ink">
                세일링이 갑자기 없어진다면 어떨 것 같으세요?
              </p>
              <button
                onClick={handleDismiss}
                aria-label="닫기"
                className="mt-0.5 flex-shrink-0 text-ink-3 hover:text-ink"
              >
                ✕
              </button>
            </div>
            <ul className="space-y-2">
              {OPTIONS.map((opt) => (
                <li key={opt.value}>
                  <button
                    onClick={() => handleAnswer(opt.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-left text-small text-ink-2 transition hover:border-blue hover:bg-blue-50 hover:text-ink"
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-small text-ink-3">익명 · 10초면 돼요</p>
          </>
        )}
      </div>
    </div>
  );
}
