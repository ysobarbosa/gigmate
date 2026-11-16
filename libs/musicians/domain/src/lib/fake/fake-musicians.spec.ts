import { compatibility } from '../compatibility';
import {
  AVAILABILITY_SLOTS,
  GENRES,
  GOALS,
  INSTRUMENTS,
  mainInstrument,
  SKILL_LEVELS,
} from '../musician';
import { generateFakeMusicians } from './fake-musicians';

describe('generateFakeMusicians', () => {
  const musicians = generateFakeMusicians();

  it('generates 60 profiles by default, with unique ids', () => {
    expect(musicians).toHaveLength(60);
    expect(new Set(musicians.map((m) => m.id)).size).toBe(60);
  });

  it('is reproducible for the same seed and differs for another', () => {
    expect(generateFakeMusicians({ seed: 1 })).toEqual(
      generateFakeMusicians({ seed: 1 }),
    );
    expect(generateFakeMusicians({ seed: 1 })).not.toEqual(
      generateFakeMusicians({ seed: 2 }),
    );
  });

  it('respects count', () => {
    expect(generateFakeMusicians({ count: 5 })).toHaveLength(5);
  });

  it.each(generateFakeMusicians().map((m) => [m.id, m] as const))(
    '%s is a valid profile',
    (_, m) => {
      expect(m.instruments.length).toBeGreaterThan(0);
      for (const { instrument, level } of m.instruments) {
        expect(INSTRUMENTS).toContain(instrument);
        expect(SKILL_LEVELS).toContain(level);
      }
      expect(new Set(m.instruments.map((s) => s.instrument)).size).toBe(
        m.instruments.length,
      );
      for (const wanted of m.lookingFor) {
        expect(INSTRUMENTS).toContain(wanted);
        expect(m.instruments.map((s) => s.instrument)).not.toContain(wanted);
      }
      expect(m.genresPlayed.length).toBeGreaterThan(0);
      [...m.genresPlayed, ...m.genresLiked].forEach((g) =>
        expect(GENRES).toContain(g),
      );
      expect(m.goals.length).toBeGreaterThan(0);
      m.goals.forEach((g) => expect(GOALS).toContain(g));
      expect(m.availability.length).toBeGreaterThan(0);
      m.availability.forEach((s) => expect(AVAILABILITY_SLOTS).toContain(s));
      expect(m.age).toBeGreaterThanOrEqual(18);
      // São Paulo bounding box, roughly.
      expect(m.location.lat).toBeGreaterThan(-23.75);
      expect(m.location.lat).toBeLessThan(-23.4);
      expect(m.location.lng).toBeGreaterThan(-46.8);
      expect(m.location.lng).toBeLessThan(-46.45);
    },
  );

  it('stores only approximate (2-decimal) coordinates', () => {
    for (const { location } of musicians) {
      expect(Math.round(location.lat * 100) / 100).toBe(location.lat);
      expect(Math.round(location.lng * 100) / 100).toBe(location.lng);
    }
  });

  it('has enough drummers to make the demo interesting', () => {
    const drummers = musicians.filter((m) => mainInstrument(m) === 'drums');
    expect(drummers.length).toBeGreaterThanOrEqual(6);
  });

  it('produces a spread of compatibility scores, not all the same', () => {
    const [viewer, ...others] = musicians;
    const scores = others.map((other) => compatibility(viewer, other).score);
    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThanOrEqual(
      30,
    );
  });
});
