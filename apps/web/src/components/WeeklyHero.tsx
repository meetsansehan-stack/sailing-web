import { CATEGORY_LABEL, type Article } from '@parenting-newsletter/shared';
import { getAllArticles } from '@/src/data/articles';
import { KeyDateBanner, type CalMonth, type CalDay, type EventRow } from './KeyDateBanner';

type Kind = 'ongoing' | 'deadline';

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function md(s: string): string {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

// 한 달치 캘린더 그리드 생성 (일요일 시작).
function buildMonth(
  year: number,
  month: number, // 0-based
  dotMap: Map<string, Kind[]>,
  todayYmd: string,
): CalMonth {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun

  const cells: CalDay[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ day: 0, ymd: '', isToday: false, dots: [] });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = ymd(new Date(year, month, d));
    cells.push({ day: d, ymd: key, isToday: key === todayYmd, dots: dotMap.get(key) ?? [] });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: 0, ymd: '', isToday: false, dots: [] });
  }

  const weeks: CalDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return { label: `${month + 1}월`, weeks };
}

// ⚠️ 프로토타입: 실데이터엔 (시작+마감) 쌍을 가진 항목이 0건이라 진행 중(span)을 못 그림.
//    그래서 실제 기사 5건에 오늘 기준 가상 기간을 씌워 시각화. 클릭 시 실제 기사 상세로 이동.
//    실제론 파이프라인이 (시작일, 마감일) 쌍을 채운 뒤 이 부분을 실데이터로 교체.
const SPAN_OFFSETS: Array<{ start: number; end: number }> = [
  { start: -3, end: 4 },
  { start: -7, end: 0 },
  { start: 0, end: 6 },
  { start: -5, end: -2 },
  { start: 1, end: 9 },
];

// ⚠️ 프로토타입: Article엔 region 필드가 없어 지역 필터 시연용 mock 지역(수도권 위주).
const MOCK_REGIONS = ['서울', '경기', '인천', '부산', '서울'];

// 서버 컴포넌트: GNB 하단 배너 데이터. (프로토타입: 진행 중 span 모델 시각화)
export async function WeeklyHero({ today = new Date() }: { today?: Date }) {
  const todayYmd = ymd(today);
  const year = today.getFullYear();
  const month = today.getMonth();

  // 가상 기간을 입힐 실제 기사 — 이벤트(날짜성) 우선, 모자라면 최신순 보충.
  // API 비가용 시 배너만 조용히 생략(다른 페이지 영향 없음).
  let all: Article[];
  try {
    all = await getAllArticles();
  } catch {
    return null;
  }
  const events = all.filter((a) => a.eventStartDate);
  const pool: Article[] = [...events, ...all.filter((a) => !a.eventStartDate)].slice(
    0,
    SPAN_OFFSETS.length,
  );

  // 각 기사에 가상 기간을 일자별로 펼침: [시작 … 마감-1]=ongoing, 마감일=deadline
  const dotMap = new Map<string, Kind[]>();
  const eventsByDate: Record<string, EventRow[]> = {};
  pool.forEach((article, i) => {
    const off = SPAN_OFFSETS[i];
    const start = addDays(today, off.start);
    const end = addDays(today, off.end);
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      const key = ymd(d);
      const kind: Kind = key === ymd(end) ? 'deadline' : 'ongoing';
      if (!dotMap.has(key)) dotMap.set(key, []);
      dotMap.get(key)!.push(kind);
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push({
        id: `${article.id}-${key}`,
        articleId: article.id,
        kind,
        title: article.title,
        source: article.source,
        categoryLabel: CATEGORY_LABEL[article.category],
        region: MOCK_REGIONS[i % MOCK_REGIONS.length],
      });
    }
  });

  const months: CalMonth[] = [
    buildMonth(year, month, dotMap, todayYmd),
    buildMonth(year, month + 1, dotMap, todayYmd),
  ];

  // 토글 띠 요약 — 이번 주(월~일)에 활성인 항목 수
  const dow = (today.getDay() + 6) % 7;
  const weekStart = ymd(addDays(today, -dow));
  const weekEnd = ymd(addDays(today, 6 - dow));
  const activeThisWeek = new Set<string>();
  for (const [key, rows] of Object.entries(eventsByDate)) {
    if (key >= weekStart && key <= weekEnd) rows.forEach((r) => activeThisWeek.add(r.articleId));
  }
  const summaryLine =
    activeThisWeek.size > 0 ? `이번 주 진행 중 ${activeThisWeek.size}건` : '이번 주 일정 없음';

  // 다음 마감 하이라이트
  const deadlines = Object.entries(eventsByDate)
    .filter(([key, rows]) => key >= todayYmd && rows.some((r) => r.kind === 'deadline'))
    .map(([key, rows]) => ({ key, row: rows.find((r) => r.kind === 'deadline')! }))
    .sort((a, b) => (a.key < b.key ? -1 : 1));
  const nextHighlight =
    deadlines.length > 0
      ? `${deadlines[0].row.title.slice(0, 16)} 마감 (${md(deadlines[0].key)})`
      : null;

  return (
    <KeyDateBanner
      summaryLine={summaryLine}
      nextHighlight={nextHighlight}
      todayYmd={todayYmd}
      months={months}
      eventsByDate={eventsByDate}
      note="프로토타입: 가상 기간 (실데이터엔 시작+마감 쌍이 아직 없음)"
    />
  );
}
