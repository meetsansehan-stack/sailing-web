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

// 장기 행사(전시 수개월 등)는 매일 칠하면 캘린더가 카펫처럼 덮인다 → 이 일수를 넘기면
// 양 끝(개막·종료/마감)만 표시. 진짜 "이번 주 챙길 거"는 시작·끝 시점이라 정보 손실 없음.
const MAX_PAINT_DAYS = 21;

// ⚠️ 프로토타입 잔재: Article엔 region 필드가 없어 지역 필터 시연용 mock 지역(수도권 위주).
//    region 스키마가 생기면 이 mock만 교체(span은 이제 실데이터).
const MOCK_REGIONS = ['서울', '경기', '인천', '부산'];

function parseYmd(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// 한 기사 → 칠할 (날짜, kind) 목록. 실 필드(eventStartDate/eventEndDate/deadline)로:
//   - redDay(빨강 ⏰) = deadline(신청 마감) 우선, 없으면 eventEndDate(행사 종료=놓치면 끝).
//   - start = eventStartDate 우선, 없으면 deadline(마감만 있는 항목 = 그날 점).
//   - start … redDay-1 = ongoing(파랑), redDay = deadline. redDay 없으면(단일 개장일) 전부 ongoing.
function paintDays(a: Article): Array<{ ymd: string; kind: Kind }> {
  const es = parseYmd(a.eventStartDate);
  const ee = parseYmd(a.eventEndDate);
  const dl = parseYmd(a.deadline);
  const redDay = dl ?? ee; // 놓치면 끝나는 날 (없을 수 있음)
  const start = es ?? dl; // 시작점
  if (!start) return [];
  const last = redDay ?? es ?? start; // 마지막으로 칠할 날
  const redYmd = redDay ? ymd(redDay) : null;

  // 장기 = 양 끝만(개막 + 종료/마감), 그 외 = 매일 칠함.
  if (daysBetween(start, last) > MAX_PAINT_DAYS) {
    const out = [{ ymd: ymd(start), kind: 'ongoing' as Kind }];
    if (redYmd && redYmd !== ymd(start)) out.push({ ymd: redYmd, kind: 'deadline' });
    return out;
  }
  const out: Array<{ ymd: string; kind: Kind }> = [];
  for (let d = new Date(start); d <= last; d = addDays(d, 1)) {
    const key = ymd(d);
    out.push({ ymd: key, kind: key === redYmd ? 'deadline' : 'ongoing' });
  }
  return out;
}

// 서버 컴포넌트: GNB 하단 배너 데이터. (실데이터 span — eventStartDate/eventEndDate/deadline)
export async function WeeklyHero({ today = new Date() }: { today?: Date }) {
  const todayYmd = ymd(today);
  const year = today.getFullYear();
  const month = today.getMonth();

  // 날짜성(이벤트/마감) 실데이터 기사만. API 비가용 시 배너만 조용히 생략(다른 페이지 영향 없음).
  let all: Article[];
  try {
    all = await getAllArticles();
  } catch {
    return null;
  }
  const dated = all.filter((a) => a.eventStartDate || a.deadline);

  // 실 필드로 일자별 펼침: [시작 … 마감전일]=ongoing, 마감/종료일=deadline. 장기는 양 끝만.
  const dotMap = new Map<string, Kind[]>();
  const eventsByDate: Record<string, EventRow[]> = {};
  dated.forEach((article, i) => {
    for (const { ymd: key, kind } of paintDays(article)) {
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
      note="지역 라벨은 시연용 (기사에 지역 데이터가 아직 없음)"
    />
  );
}
