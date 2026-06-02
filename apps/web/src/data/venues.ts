import { cache } from 'react';
import {
  ageGroupMatchesVenue,
  type AgeGroup,
  type Pricing,
  type ReservableVenue,
  type VenueOperator,
  type VenueType,
} from '@parenting-newsletter/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001';
const VENUES_LIMIT = 200;

export const getAllVenues = cache(async (): Promise<ReservableVenue[]> => {
  const res = await fetch(`${API_BASE}/api/venues?limit=${VENUES_LIMIT}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch venues: ${res.status}`);
  }
  const data = (await res.json()) as { venues: ReservableVenue[] };
  return data.venues;
});

export async function getVenueById(id: string): Promise<ReservableVenue | undefined> {
  const all = await getAllVenues();
  return all.find((v) => v.id === id);
}

export function getVenueRegion(venue: ReservableVenue): string {
  return venue.region.split(' ')[0];
}

export async function getVenueCountByRegion(): Promise<Record<string, number>> {
  const all = await getAllVenues();
  const map: Record<string, number> = {};
  for (const v of all) {
    const r = getVenueRegion(v);
    map[r] = (map[r] ?? 0) + 1;
  }
  return map;
}

export async function filterVenues(filters: {
  type?: VenueType;
  pricing?: Pricing;
  operator?: VenueOperator;
  age?: AgeGroup;
  region?: string;
}): Promise<ReservableVenue[]> {
  const all = await getAllVenues();
  return all.filter((v) => {
    if (filters.type && v.type !== filters.type) return false;
    if (filters.operator && v.operator !== filters.operator) return false;
    if (filters.region && getVenueRegion(v) !== filters.region) return false;
    if (filters.age && !ageGroupMatchesVenue(v, filters.age)) return false;
    if (filters.pricing) {
      // "free"로 필터 시 무료·일부무료 모두 포함
      if (filters.pricing === 'free') {
        if (v.pricing !== 'free' && v.pricing !== 'mixed') return false;
      } else if (v.pricing !== filters.pricing) {
        return false;
      }
    }
    return true;
  });
}
