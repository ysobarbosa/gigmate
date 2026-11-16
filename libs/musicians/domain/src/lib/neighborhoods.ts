import { approximateLocation } from './geo';
import type { GeoPoint } from './musician';

/**
 * São Paulo neighborhoods with rough center points. Used by the fake profiles
 * and by onboarding: people pick a neighborhood instead of sharing GPS, so the
 * stored location is a neighborhood center, never where they live.
 */
export const NEIGHBORHOODS: readonly (readonly [
  name: string,
  center: GeoPoint,
])[] = [
  ['Pinheiros', { lat: -23.567, lng: -46.692 }],
  ['Vila Madalena', { lat: -23.556, lng: -46.69 }],
  ['Centro', { lat: -23.55, lng: -46.634 }],
  ['Liberdade', { lat: -23.558, lng: -46.635 }],
  ['Bela Vista', { lat: -23.561, lng: -46.648 }],
  ['Consolação', { lat: -23.553, lng: -46.66 }],
  ['Barra Funda', { lat: -23.526, lng: -46.666 }],
  ['Perdizes', { lat: -23.536, lng: -46.677 }],
  ['Lapa', { lat: -23.522, lng: -46.704 }],
  ['Butantã', { lat: -23.571, lng: -46.708 }],
  ['Vila Mariana', { lat: -23.589, lng: -46.634 }],
  ['Ipiranga', { lat: -23.587, lng: -46.607 }],
  ['Mooca', { lat: -23.56, lng: -46.599 }],
  ['Tatuapé', { lat: -23.54, lng: -46.576 }],
  ['Penha', { lat: -23.523, lng: -46.542 }],
  ['Santana', { lat: -23.502, lng: -46.625 }],
  ['Freguesia do Ó', { lat: -23.497, lng: -46.698 }],
  ['Campo Belo', { lat: -23.622, lng: -46.669 }],
  ['Jabaquara', { lat: -23.646, lng: -46.641 }],
  ['Santo Amaro', { lat: -23.654, lng: -46.708 }],
];

/** Alphabetical, for a select. */
export const NEIGHBORHOOD_NAMES: readonly string[] = NEIGHBORHOODS.map(
  ([name]) => name,
).sort((a, b) => a.localeCompare(b, 'pt-BR'));

/** The approximate point stored for someone in `name`, or null if unknown. */
export function neighborhoodLocation(name: string): GeoPoint | null {
  const center = NEIGHBORHOODS.find(([n]) => n === name)?.[1];
  return center ? approximateLocation(center) : null;
}

/** Limits every profile must respect, shared by forms and any future backend. */
export const PROFILE_LIMITS = {
  nameMaxLength: 40,
  bioMaxLength: 160,
  minAge: 16,
  maxAge: 99,
} as const;
