'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ADMISSION } from '../data';
import { Timeline } from '../Timeline';

// 입학 준비 상세 — 유치원/초등 두 세그(연령 토글). 선택은 로컬 저장(로컬-퍼스트, 서버 PII 0).
export default function AdmissionPage() {
  const [seg, setSeg] = useState<'kinder' | 'elem'>('kinder');
  const data = ADMISSION[seg];

  useEffect(() => {
    const s = localStorage.getItem('sailing.childStage');
    if (s === 'kinder' || s === 'elem') setSeg(s);
  }, []);
  const choose = (s: 'kinder' | 'elem') => {
    setSeg(s);
    try {
      localStorage.setItem('sailing.childStage', s);
    } catch {
      /* localStorage 비활성 환경 무시 */
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* 헤더 */}
      <Link href="/radar" className="text-small text-ink-3 hover:text-ink-2">
        ← 미리 준비
      </Link>
      <p className="mt-3 text-body font-semibold text-blue">🎒 입학 준비</p>
      <h1 className="mt-2 text-h2 font-bold leading-snug text-ink sm:text-h1">
        내 아이 입학, 놓치면 안 될 것만 미리
      </h1>
      <p className="mt-2 text-body text-ink-3">{data.sub}</p>

      {/* 내 아이 설정 (개인화 진입 · 로컬 저장) */}
      <div className="mt-6 rounded-card border border-grey-200 bg-white p-4">
        <p className="text-body font-semibold text-ink-2">내 아이는 지금</p>
        <div className="mt-3 flex gap-2">
          {(
            [
              { id: 'kinder', emoji: '🐣', label: '유치원 입학 예정' },
              { id: 'elem', emoji: '🎒', label: '초등학교 입학 예정' },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              onClick={() => choose(s.id)}
              className={`flex-1 rounded-card border px-4 py-3 text-body transition ${
                seg === s.id
                  ? 'border-blue-600 bg-blue-600 font-semibold text-white'
                  : 'border-grey-200 bg-white text-ink-2 hover:bg-grey-50'
              }`}
            >
              <span className="mr-1.5">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-small text-ink-3">
          🔒 이 선택은 기기에만 저장돼요 (서버로 보내지 않아요)
        </p>
      </div>

      {/* 상세 타임라인 */}
      <Timeline seg={data} prefix={seg} />

      {/* 알림 (progressive 로그인 CTA) */}
      <section className="mt-10 rounded-card border border-grey-200 bg-white p-6 text-center">
        <p className="text-card-title font-bold text-ink">마감, 놓칠까 걱정되시죠?</p>
        <p className="mt-1 text-body text-ink-3">
          로그인하면 내 아이 마감을 미리 알려드려요. <span className="text-ink-3">(준비중)</span>
        </p>
        <div className="mx-auto mt-4 flex max-w-xs flex-col gap-2">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-card bg-[#FEE500] px-4 py-2.5 text-body font-semibold text-[#3C1E1E] opacity-60"
          >
            카카오로 시작하기
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-card border border-grey-300 px-4 py-2.5 text-body font-semibold text-ink-2 opacity-60"
          >
            Google로 시작하기
          </button>
        </div>
        <p className="mt-3 text-small text-ink-3">
          로그인은 선택이에요 — 안 해도 모든 정보를 볼 수 있어요.
        </p>
      </section>

      {/* 약속 */}
      <div className="mt-8 rounded-card bg-gradient-to-br from-blue-600 to-blue p-6 text-white">
        <p className="text-h3 font-bold">흩어진 신청·마감을 ‘내 아이 일정’ 하나로.</p>
        <p className="mt-2 text-body leading-relaxed text-blue-50">
          정확한 날짜는 보통 가을~겨울에 교육청·학교가 공지해요. Sailing이{' '}
          <b className="font-semibold text-white">내 동네·내 아이 기준</b>으로 미리 챙겨서, 놓치면
          손해 보는 것만 콕 알려드릴게요.
        </p>
      </div>
      <p className="mt-4 text-center text-small text-ink-3">
        ※ 데모 — 일정은 직전 학년도(2026학년도) 실제 기준. 2027학년도 정확 일정은 추후 공지 반영.
      </p>
    </div>
  );
}
