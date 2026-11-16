import { approximateLocation, displayDistanceKm, distanceKm } from './geo';

describe('distanceKm', () => {
  it('is zero for the same point', () => {
    const p = { lat: -23.55, lng: -46.63 };
    expect(distanceKm(p, p)).toBe(0);
  });

  it('matches a known distance: one degree of latitude is ~111 km', () => {
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(
      111.19,
      1,
    );
  });

  it('is symmetric', () => {
    const a = { lat: -23.567, lng: -46.692 };
    const b = { lat: -23.502, lng: -46.625 };
    expect(distanceKm(a, b)).toBeCloseTo(distanceKm(b, a), 10);
  });
});

describe('approximateLocation', () => {
  it('rounds to two decimals by default', () => {
    expect(approximateLocation({ lat: -23.56789, lng: -46.69123 })).toEqual({
      lat: -23.57,
      lng: -46.69,
    });
  });

  it('moves the point by at most ~1 km', () => {
    const exact = { lat: -23.56499, lng: -46.69499 };
    expect(distanceKm(exact, approximateLocation(exact))).toBeLessThan(1);
  });
});

describe('displayDistanceKm', () => {
  it.each([
    [0, 1],
    [0.4, 1],
    [1.6, 2],
    [12.49, 12],
  ])('shows %p km as ~%p km', (km, shown) => {
    expect(displayDistanceKm(km)).toBe(shown);
  });
});
