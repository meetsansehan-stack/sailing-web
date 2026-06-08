'use client';

import { useState } from 'react';
import type { Seg } from './data';

// 미리 준비 상세 공용 렌더 — highlight(가장 먼저 챙길 것) + 전체 일정 아코디언.
// 입학(/radar/admission)·여름(/radar/summer) 상세에서 공유.
export function Timeline({ seg, prefix }: { seg: Seg; prefix: string }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const highlight = seg.items[0]; // 지금 가장 먼저 챙길 것
  const hasAction = seg.items.some((it) => it.type === 'action');
  const hasAuto = seg.items.some((it) => it.type === 'auto');

  return (
    <>
      {/* 지금 가장 먼저 챙길 것 (긴급 강조) */}
      {highlight && (
        <section className="mt-8">
          <h2 className="mb-3 text-card-title font-bold text-ink">🔔 지금 가장 먼저 챙길 것</h2>
          <div className="rounded-card border-2 border-red bg-red-bg/60 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-red px-2.5 py-0.5 text-micro font-bold text-white">
                {highlight.when.replace(/\n/g, ' ')}
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-micro font-semibold text-red">
                가장 먼저
              </span>
            </div>
            <h3 className="mt-3 text-h3 font-bold text-ink">{highlight.title}</h3>
            <p className="mt-1 text-body text-ink-2">{highlight.teaser}</p>
            {highlight.sections[0] && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                {highlight.sections[0].b.map((b, bi) => (
                  <li
                    key={bi}
                    className="text-body text-ink-2 [&_b]:font-semibold [&_b]:text-ink"
                    dangerouslySetInnerHTML={{ __html: b }}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* 전체 일정 */}
      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-card-title font-bold text-ink">전체 일정</h2>
        <div className="flex gap-3 text-small text-ink-3">
          {hasAction && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-red" /> 직접 신청
            </span>
          )}
          {hasAuto && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-blue" /> 자동
            </span>
          )}
        </div>
      </div>

      {/* 타임라인 */}
      <div className="space-y-3">
        {seg.items.map((it, i) => {
          const key = `${prefix}-${i}`;
          const open = openKey === key;
          return (
            <div
              key={key}
              className="overflow-hidden rounded-card border border-grey-200 bg-white shadow-card"
            >
              <button
                onClick={() => setOpenKey(open ? null : key)}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
                <div className="w-14 shrink-0 whitespace-pre-line pt-0.5 text-small font-bold leading-tight text-blue-600">
                  {it.when}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-micro font-semibold ${
                      it.type === 'action' ? 'bg-red-bg text-red' : 'bg-blue-50 text-blue'
                    }`}
                  >
                    {it.type === 'action' ? '직접 신청' : '자동'}
                  </span>
                  <h3 className="mt-2 text-card-title font-bold text-ink">{it.title}</h3>
                  <p className="mt-1 text-body text-ink-3">{it.teaser}</p>
                </div>
                <span
                  className={`shrink-0 pt-1 text-ink-3 transition ${open ? 'rotate-180' : ''}`}
                >
                  ▼
                </span>
              </button>

              {open && (
                <div className="border-t border-dashed border-grey-200 px-5 pb-5 pl-[4.75rem]">
                  {it.sections.map((s) => (
                    <div key={s.h}>
                      <h4 className="mt-4 text-body font-bold text-blue">{s.h}</h4>
                      <ul className="mt-1.5 list-disc space-y-1.5 pl-4">
                        {s.b.map((bullet, bi) => (
                          <li
                            key={bi}
                            className="text-body text-ink-2 [&_b]:font-semibold [&_b]:text-ink"
                            dangerouslySetInnerHTML={{ __html: bullet }}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="mt-4 border-t border-grey-100 pt-3 text-small text-ink-3">
                    <p className="mb-1.5 font-semibold text-blue">📎 출처 (직접 확인 가능)</p>
                    {it.src.map((s) => (
                      <a
                        key={s.u}
                        href={s.u}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block break-all text-blue-500 hover:underline"
                      >
                        {s.l} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
