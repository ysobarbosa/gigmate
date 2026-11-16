import {
  COMPATIBILITY_WEIGHTS,
  compatibility,
  jaccard,
  LIKE_BACK_THRESHOLD,
  overlapCoefficient,
  wouldLikeBack,
} from './compatibility';
import { aMusician } from './testing';

describe('jaccard', () => {
  it.each([
    [['a', 'b'], ['a', 'b'], 1],
    [['a', 'b'], ['b', 'c'], 1 / 3],
    [['a'], ['b'], 0],
    [[], [], 0],
    [['a', 'a', 'b'], ['a', 'b'], 1],
  ])('jaccard(%p, %p) = %p', (a, b, expected) => {
    expect(jaccard(a, b)).toBeCloseTo(expected);
  });
});

describe('overlapCoefficient', () => {
  it('is 1 when the smaller set is fully covered', () => {
    expect(overlapCoefficient(['fri'], ['mon', 'wed', 'fri'])).toBe(1);
  });

  it('is 0 when either side is empty', () => {
    expect(overlapCoefficient([], ['fri'])).toBe(0);
  });

  it('counts partial coverage of the smaller set', () => {
    expect(overlapCoefficient(['fri', 'sat'], ['sat', 'sun', 'mon'])).toBe(0.5);
  });
});

describe('compatibility', () => {
  it('weights sum to 1', () => {
    const sum = Object.values(COMPATIBILITY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });

  it('scores 100 for two identical profiles', () => {
    const a = aMusician();
    expect(compatibility(a, aMusician({ id: 'm-2' })).score).toBe(100);
  });

  it('scores 0 when nothing overlaps and they are far apart', () => {
    const a = aMusician();
    const b = aMusician({
      genresPlayed: ['sertanejo'],
      genresLiked: ['gospel'],
      goals: ['paid-gigs'],
      availability: ['mon-morning'],
      location: { lat: -22.9, lng: -43.2 }, // Rio, ~360 km away
    });
    const result = compatibility(a, b);
    expect(result.score).toBe(0);
    expect(result.breakdown).toEqual({
      genres: 0,
      availability: 0,
      goals: 0,
      distance: 0,
    });
  });

  it('is symmetric', () => {
    const a = aMusician({
      genresPlayed: ['rock', 'punk'],
      availability: ['fri-night'],
    });
    const b = aMusician({
      genresPlayed: ['rock', 'metal', 'blues'],
      availability: ['fri-night', 'sat-night', 'sun-afternoon'],
      location: { lat: -23.5, lng: -46.62 },
    });
    expect(compatibility(a, b)).toEqual(compatibility(b, a));
  });

  it('weighs genres played more than genres liked', () => {
    const viewer = aMusician({ genresPlayed: ['rock'], genresLiked: ['jazz'] });
    const sharesPlayed = aMusician({
      genresPlayed: ['rock'],
      genresLiked: ['samba'],
    });
    const sharesLiked = aMusician({
      genresPlayed: ['samba'],
      genresLiked: ['jazz'],
    });
    expect(compatibility(viewer, sharesPlayed).breakdown.genres).toBeCloseTo(
      0.7,
    );
    expect(compatibility(viewer, sharesLiked).breakdown.genres).toBeCloseTo(
      0.3,
    );
  });

  it('does not punish someone for being available more often', () => {
    const fridayOnly = aMusician({ availability: ['fri-night'] });
    const everyNight = aMusician({
      availability: [
        'mon-night',
        'tue-night',
        'wed-night',
        'thu-night',
        'fri-night',
      ],
    });
    expect(compatibility(fridayOnly, everyNight).breakdown.availability).toBe(
      1,
    );
  });

  it('decays distance linearly to 0 at the max distance', () => {
    const here = aMusician({ location: { lat: 0, lng: 0 } });
    const fifteenKmNorth = aMusician({
      location: { lat: 15 / 111.19, lng: 0 },
    });
    const result = compatibility(here, fifteenKmNorth, { maxDistanceKm: 30 });
    expect(result.distanceKm).toBeCloseTo(15, 1);
    expect(result.breakdown.distance).toBeCloseTo(0.5, 2);
    expect(
      compatibility(here, fifteenKmNorth, { maxDistanceKm: 10 }).breakdown
        .distance,
    ).toBe(0);
  });
});

describe('wouldLikeBack', () => {
  const viewer = aMusician({
    id: 'viewer',
    instruments: [{ instrument: 'electric-guitar', level: 'advanced' }],
  });

  it('likes back a compatible viewer when not looking for anything specific', () => {
    expect(compatibility(aMusician(), viewer).score).toBeGreaterThanOrEqual(
      LIKE_BACK_THRESHOLD,
    );
    expect(wouldLikeBack(aMusician({ lookingFor: [] }), viewer)).toBe(true);
  });

  it('likes back only if the viewer plays an instrument it is looking for', () => {
    expect(
      wouldLikeBack(
        aMusician({ lookingFor: ['bass', 'electric-guitar'] }),
        viewer,
      ),
    ).toBe(true);
    expect(wouldLikeBack(aMusician({ lookingFor: ['drums'] }), viewer)).toBe(
      false,
    );
  });

  it('considers secondary instruments of the viewer', () => {
    const multi = aMusician({
      instruments: [
        { instrument: 'electric-guitar', level: 'advanced' },
        { instrument: 'drums', level: 'beginner' },
      ],
    });
    expect(wouldLikeBack(aMusician({ lookingFor: ['drums'] }), multi)).toBe(
      true,
    );
  });

  it('does not like back below the threshold', () => {
    const incompatible = aMusician({
      genresPlayed: ['sertanejo'],
      genresLiked: ['gospel'],
      goals: ['paid-gigs'],
      availability: ['mon-morning'],
    });
    expect(compatibility(incompatible, viewer).score).toBeLessThan(
      LIKE_BACK_THRESHOLD,
    );
    expect(wouldLikeBack(incompatible, viewer)).toBe(false);
  });
});
