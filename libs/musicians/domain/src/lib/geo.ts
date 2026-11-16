import type { GeoPoint } from './musician';

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance between two points (haversine formula), in km. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Rounds coordinates so the stored point is a ~1 km cell, not an address.
 * Two decimals of latitude are ~1.1 km; of longitude, ~1 km near the tropics.
 */
export function approximateLocation(point: GeoPoint, decimals = 2): GeoPoint {
  const factor = 10 ** decimals;
  return {
    lat: Math.round(point.lat * factor) / factor,
    lng: Math.round(point.lng * factor) / factor,
  };
}

/**
 * Distance as shown to users: whole km, never below 1 ("~1 km").
 * Showing "0.3 km" would leak more precision than the stored point has.
 */
export function displayDistanceKm(km: number): number {
  return Math.max(1, Math.round(km));
}
