import Link from 'next/link';
import {
  AGE_GROUPS,
  AGE_GROUP_LABEL,
  OPERATOR_LABEL,
  PRICING_LABEL,
  VENUE_TYPES,
  VENUE_TYPE_LABEL,
  type AgeGroup,
  type Pricing,
  type ReservableVenue,
  type VenueType,
} from '@parenting-newsletter/shared';
import {
  filterVenues,
  getAllVenues,
  getVenueCountByRegion,
} from '@/src/data/venues';
import { RegionDropdown } from '@/src/components/RegionDropdown';

type SearchParams = {
  type?: string;
  pricing?: string;
  age?: string;
  region?: string;
};

const PRICING_FILTER_OPTIONS: { value: Pricing; label: string }[] = [
  { value: 'free', label: '무료' },
  { value: 'paid', label: '유료' },
];

export default async function ReservationsPage({ searchParams }: { searchParams?: SearchParams }) {
  const filterType = searchParams?.type as VenueType | undefined;
  const filterPricing = searchParams?.pricing as Pricing | undefined;
  const filterAge = searchParams?.age as AgeGroup | undefined;
  const filterRegion = searchParams?.region;

  const [allVenues, venueCountByRegion, filtered] = await Promise.all([
    getAllVenues(),
    getVenueCountByRegion(),
    filterVenues({
      type: filterType,
      pricing: filterPricing,
      age: filterAge,
      region: filterRegion,
    }),
  ]);

  const buildHref = (override: Partial<SearchParams>) => {
    const merged: Record<string, string | undefined> = {
      type: filterType,
      pricing: filterPricing,
      age: filterAge,
      region: filterRegion,
      ...override,
    };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join('&');
    return qs ? `/reservations?${qs}` : '/reservations';
  };

  const hasFilter = !!(filterType || filterPricing || filterAge || filterRegion);

  return (
    <div>
      <header className="mx-auto max-w-6xl pb-8">
        <p className="text-small font-medium text-blue-600 mb-2 tracking-wider">예약</p>
        <h1 className="text-h1 font-bold text-ink mb-3">예약 가능한 곳</h1>
        <p className="text-body text-ink-2 leading-7">
          공영·공공기관·자치구가 운영하는 어린이 시설·프로그램 {allVenues.length}곳
        </p>
        <p className="text-small text-ink-3 mt-2">
          ⓘ 예약 채널·운영 일정은 시설 사이트 기준이며 회차별 매진 가능. 클릭 시 외부 사이트로 이동합니다.
        </p>
      </header>

      <div className="mx-auto max-w-6xl border-b border-grey-200 pb-5 space-y-3">
        <FilterRow label="유형" current={filterType ?? null} buildHref={buildHref} field="type">
          {VENUE_TYPES.map((t) => ({ value: t, label: VENUE_TYPE_LABEL[t] }))}
        </FilterRow>

        <FilterRow label="연령" current={filterAge ?? null} buildHref={buildHref} field="age">
          {AGE_GROUPS.map((a) => ({ value: a, label: AGE_GROUP_LABEL[a] }))}
        </FilterRow>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 w-10 flex-shrink-0 text-small font-semibold text-ink-3">지역</span>
          <RegionDropdown venueCountByRegion={venueCountByRegion} />
        </div>

        <FilterRow
          label="가격"
          current={filterPricing ?? null}
          buildHref={buildHref}
          field="pricing"
        >
          {PRICING_FILTER_OPTIONS}
        </FilterRow>

        {hasFilter && (
          <div className="pt-1">
            <Link
              href="/reservations"
              className="inline-flex items-center gap-1 text-small font-medium text-ink-3 hover:text-ink-2"
            >
              ← 필터 초기화
            </Link>
          </div>
        )}
      </div>

      <section className="mx-auto max-w-6xl mt-6">
        <p className="text-small text-ink-3 mb-4">
          {hasFilter
            ? `필터 결과 ${filtered.length}곳 (총 ${allVenues.length}곳)`
            : `${allVenues.length}곳`}
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-card border border-dashed border-grey-300 bg-white p-10 text-center text-body text-ink-3">
            조건에 맞는 시설이 없습니다. 필터를 줄여보세요.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  current,
  buildHref,
  field,
  children,
}: {
  label: string;
  current: T | null;
  buildHref: (override: Partial<SearchParams>) => string;
  field: keyof SearchParams;
  children: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 w-10 flex-shrink-0 text-small font-semibold text-ink-3">{label}</span>
      <Link
        href={buildHref({ [field]: undefined } as Partial<SearchParams>)}
        className={chipClass(current === null)}
      >
        전체
      </Link>
      {children.map((opt) => (
        <Link
          key={opt.value}
          href={buildHref({ [field]: opt.value } as Partial<SearchParams>)}
          className={chipClass(current === opt.value)}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}

function chipClass(active: boolean) {
  return `px-3 py-1 rounded-full text-small font-medium transition ${
    active ? 'bg-ink text-white' : 'bg-grey-100 text-ink-2 hover:bg-grey-200'
  }`;
}

function VenueCard({ venue }: { venue: ReservableVenue }) {
  const pricingChip =
    venue.pricing === 'free'
      ? 'bg-green/10 text-green'
      : venue.pricing === 'paid'
        ? 'bg-blue-50 text-blue'
        : 'bg-grey-100 text-ink-2';

  return (
    <div className="group flex flex-col h-full overflow-hidden rounded-card border border-grey-200 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-small font-semibold text-blue">
          {VENUE_TYPE_LABEL[venue.type]}
        </span>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-small font-semibold ${pricingChip}`}>
          {PRICING_LABEL[venue.pricing]}
        </span>
      </div>

      <h3 className="text-h3 font-semibold text-ink mb-2 line-clamp-2">{venue.name}</h3>
      <p className="text-body leading-6 text-ink-2 line-clamp-2">{venue.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 text-small">
        <div>
          <p className="text-micro uppercase tracking-wider text-ink-3">지역</p>
          <p className="font-medium text-ink">{venue.region}</p>
        </div>
        <div>
          <p className="text-micro uppercase tracking-wider text-ink-3">권장 연령</p>
          <p className="font-medium text-ink">만 {venue.ageRange}세</p>
        </div>
      </div>

      {venue.schedule && (
        <p className="mt-3 text-small text-ink-3 line-clamp-2">
          <span className="font-medium text-ink-2">운영</span> · {venue.schedule}
        </p>
      )}

      <div className="mt-auto pt-5">
        {/* secondary 기본 → 카드 hover 시 primary(blue)로 전환 (group-hover) */}
        <a
          href={venue.reservationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 rounded-full border border-line bg-white px-4 py-2.5 text-body font-semibold text-ink transition group-hover:border-blue group-hover:bg-blue group-hover:text-white"
        >
          예약하러 가기 ↗
        </a>
        <p className="mt-2 text-center text-micro text-ink-3">
          {venue.reservationChannel} · {OPERATOR_LABEL[venue.operator]}
        </p>
      </div>
    </div>
  );
}
