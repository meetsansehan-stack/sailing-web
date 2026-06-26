'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RegionMap } from './RegionMap';

// GNB 하단 전폭 배너. collapse/expand.
// 펼침 = 좌측 미니 월 캘린더(이번달/다음달) + 우측 주간 뷰(진행중/마감 칩).
// 칩 클릭 → 해당 기사 페이지로 이동(배너는 layout에 있어 유지되고, 본문 자리에 상세가 뜸).

const MONTH_DOW = ['일', '월', '화', '수', '목', '금', '토'];
const WEEK_DOW = ['월', '화', '수', '목', '금', '토', '일'];

// 진행 중(시작일~마감 전일) = 파랑 / 마감일 = 빨강
type Kind = 'ongoing' | 'deadline';

export type CalDay = {
  day: number; // 0 = 빈 칸(패딩)
  ymd: string;
  isToday: boolean;
  dots: Kind[];
};

export type CalMonth = {
  label: string;
  weeks: CalDay[][];
};

export type EventRow = {
  id: string; // 행 고유 키 (일자별)
  articleId: string;
  kind: Kind;
  title: string;
  source: string;
  categoryLabel: string;
  region: string; // 시·도 (mock — 프로토타입). 지역 필터용
};

export type KeyDateBannerProps = {
  summaryLine: string;
  nextHighlight: string | null;
  todayYmd: string;
  months: CalMonth[];
  eventsByDate: Record<string, EventRow[]>;
  note?: string;
};

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type WeekCol = { ymd: string; dow: string; day: number; isToday: boolean; events: EventRow[] };

function buildWeek(
  selectedYmd: string,
  todayYmd: string,
  eventsByDate: Record<string, EventRow[]>,
): WeekCol[] {
  const sel = parseYmd(selectedYmd);
  const dow = (sel.getDay() + 6) % 7; // Mon=0
  const monday = new Date(sel);
  monday.setDate(sel.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = toYmd(d);
    return {
      ymd: key,
      dow: WEEK_DOW[i],
      day: d.getDate(),
      isToday: key === todayYmd,
      events: eventsByDate[key] ?? [],
    };
  });
}

function MiniMonth({
  month,
  selectedYmd,
  onPick,
}: {
  month: CalMonth;
  selectedYmd: string;
  onPick: (ymd: string) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-y-0.5 text-center">
      {MONTH_DOW.map((d, i) => (
        <span
          key={d}
          className={`text-micro font-medium ${
            i === 0 ? 'text-red' : i === 6 ? 'text-blue-400' : 'text-ink-3'
          }`}
        >
          {d}
        </span>
      ))}
      {month.weeks.flat().map((cell, idx) =>
        cell.day === 0 ? (
          <span key={idx} className="h-8" />
        ) : (
          <button
            key={idx}
            type="button"
            onClick={() => onPick(cell.ymd)}
            className="flex h-8 flex-col items-center justify-start gap-0.5"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-micro ${
                cell.isToday
                  ? 'bg-blue-600 font-bold text-white'
                  : cell.ymd === selectedYmd
                    ? 'bg-blue-100 font-bold text-blue'
                    : 'text-ink-2 hover:bg-grey-100'
              }`}
            >
              {cell.day}
            </span>
            <span className="flex h-1.5 items-center justify-center gap-0.5">
              {Array.from(new Set(cell.dots)).map((k) => (
                <span
                  key={k}
                  className={`block h-1 w-1 rounded-full ${
                    k === 'deadline' ? 'bg-red' : 'bg-blue-500'
                  }`}
                />
              ))}
            </span>
          </button>
        ),
      )}
    </div>
  );
}

export function KeyDateBanner({
  summaryLine,
  nextHighlight,
  todayYmd,
  months,
  eventsByDate,
  note,
}: KeyDateBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedYmd, setSelectedYmd] = useState(todayYmd);
  const [activeMonth, setActiveMonth] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionModalOpen, setRegionModalOpen] = useState(false);

  const week = buildWeek(selectedYmd, todayYmd, eventsByDate);
  const month = months[activeMonth];

  // 콘텐츠가 있는 지역 (지도에서 활성화)
  const activeRegions = new Set<string>();
  Object.values(eventsByDate).forEach((rows) => rows.forEach((r) => activeRegions.add(r.region)));

  return (
    <div className="border-b border-grey-200 bg-white">
      <div className="mx-auto max-w-container px-5 sm:px-6">
        {/* 토글 띠 */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
          aria-expanded={expanded}
        >
          <span className="flex min-w-0 items-center gap-2 text-body">
            <span className="font-bold text-ink">📅 이번 주 챙길 거</span>
            <span className="truncate text-ink-3">
              · {summaryLine}
              {!expanded && nextHighlight && ` · 다음: ${nextHighlight}`}
            </span>
          </span>
          <span className="flex flex-shrink-0 items-center gap-1 text-small font-medium text-ink-3">
            {expanded ? '접기' : '자세히'}
            <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden>
              ▾
            </span>
          </span>
        </button>

        {/* 펼침 패널 */}
        {expanded && (
          <div className="flex flex-col gap-5 pb-5 lg:flex-row lg:gap-6">
            {/* 좌측: 지역 선택 트리거 + 미니 월 캘린더 */}
            <div className="flex-shrink-0 lg:w-56">
              {/* 지역 선택 진입점 → 클릭 시 지도 모달 */}
              <button
                type="button"
                onClick={() => setRegionModalOpen(true)}
                className={`mb-2 flex w-full items-center justify-between rounded-btn border px-3 py-1.5 text-small font-medium transition ${
                  selectedRegion
                    ? 'border-blue-300 bg-blue-50 text-blue'
                    : 'border-grey-200 text-ink-3 hover:border-grey-300'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  📍 {selectedRegion ?? '지역 선택'}
                </span>
                {selectedRegion ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRegion(null);
                    }}
                    className="text-ink-3 hover:text-ink-2"
                    aria-label="지역 해제"
                  >
                    ✕
                  </span>
                ) : (
                  <span className="text-ink-3">›</span>
                )}
              </button>

              <div className="mb-2 flex items-center gap-1">
                {months.map((m, i) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setActiveMonth(i)}
                    className={`rounded-full px-2.5 py-1 text-micro font-medium transition ${
                      activeMonth === i
                        ? 'bg-grey-900 text-white'
                        : 'bg-grey-100 text-ink-2 hover:bg-grey-200'
                    }`}
                  >
                    {i === 0 ? '이번 달' : '다음 달'} ({m.label})
                  </button>
                ))}
              </div>
              <MiniMonth month={month} selectedYmd={selectedYmd} onPick={setSelectedYmd} />
              <div className="mt-2 flex items-center gap-3 text-micro text-ink-3">
                <span className="inline-flex items-center gap-1">
                  <span className="block h-1.5 w-1.5 rounded-full bg-blue-500" /> 진행 중
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="block h-1.5 w-1.5 rounded-full bg-red" /> 마감
                </span>
              </div>
              {note && <p className="mt-1.5 text-micro text-blue">⚠ {note}</p>}
            </div>

            {/* 우측: 주간 뷰 */}
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="grid min-w-[560px] grid-cols-7 rounded-card border border-grey-100">
                {week.map((col, i) => (
                  <div
                    key={col.ymd}
                    className={`min-h-[112px] ${i !== 0 ? 'border-l border-grey-100' : ''} ${
                      col.isToday ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* 칼럼 헤더 */}
                    <div className="flex flex-col items-center gap-0.5 border-b border-grey-100 py-1.5">
                      <span
                        className={`text-micro font-medium ${i >= 5 ? 'text-red' : 'text-ink-3'}`}
                      >
                        {col.dow}
                      </span>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-small font-bold ${
                          col.isToday ? 'bg-blue-600 text-white' : 'text-ink-2'
                        }`}
                      >
                        {col.day}
                      </span>
                    </div>
                    {/* 진행중/마감 칩 — 클릭 시 본문에 기사 상세 */}
                    <div className="flex flex-col gap-1 p-1">
                      {col.events
                        .filter((e) => !selectedRegion || e.region === selectedRegion)
                        .map((e) => {
                        const isDeadline = e.kind === 'deadline';
                        return (
                          <Link
                            key={e.id}
                            href={`/articles/${encodeURIComponent(e.articleId)}`}
                            title={`${e.title} · ${e.source}`}
                            className={`block rounded-md px-1.5 py-1 text-left text-micro font-medium leading-tight transition hover:opacity-80 ${
                              isDeadline ? 'bg-red-bg text-red' : 'bg-blue-100 text-blue'
                            }`}
                          >
                            <span className="line-clamp-2">
                              {isDeadline && <span className="font-bold">⏰마감 </span>}
                              {e.title}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 지역 선택 모달 */}
      {regionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setRegionModalOpen(false)}
        >
          <div
            className="relative max-h-[88vh] w-full max-w-md overflow-auto rounded-card bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-body font-bold text-ink">지역 선택</h3>
              <button
                type="button"
                onClick={() => setRegionModalOpen(false)}
                className="rounded-full px-2 py-1 text-body text-ink-3 hover:bg-grey-100"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-micro text-ink-3">
              색칠된 지역에 콘텐츠가 있어요. 지역을 누르면 해당 지역 일정만 보여요.
            </p>
            <RegionMap
              selected={selectedRegion}
              onSelect={(r) => {
                setSelectedRegion(r);
                setRegionModalOpen(false);
              }}
              activeRegions={activeRegions}
            />
            <button
              type="button"
              onClick={() => {
                setSelectedRegion(null);
                setRegionModalOpen(false);
              }}
              className="mt-4 w-full rounded-full border border-grey-200 py-2 text-small font-medium text-ink-2 hover:bg-grey-50"
            >
              전체 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
