import {
  DEFAULT_FILTER_RADIUS_KM,
  type DeckFilters,
  defaultFilters,
  matchesFilters,
} from './filters';
import { aMusician } from './testing';

const viewer = aMusician({
  id: 'viewer',
  lookingFor: ['drums'],
  availability: ['fri-night'],
  location: { lat: 0, lng: 0 },
});

const anything: DeckFilters = {
  instruments: [],
  genres: [],
  goals: [],
  sharedAvailabilityOnly: false,
  maxDistanceKm: 30,
};

const at = (km: number) => ({ lat: km / 111.19, lng: 0 });

describe('defaultFilters', () => {
  it('searches what the viewer is looking for, nearby, with nothing else required', () => {
    expect(defaultFilters(viewer)).toEqual({
      instruments: ['drums'],
      genres: [],
      goals: [],
      sharedAvailabilityOnly: false,
      maxDistanceKm: DEFAULT_FILTER_RADIUS_KM,
    });
  });
});

describe('matchesFilters', () => {
  const candidate = aMusician({
    instruments: [
      { instrument: 'bass', level: 'advanced' },
      { instrument: 'drums', level: 'beginner' },
    ],
    genresPlayed: ['samba', 'mpb'],
    goals: ['jam'],
    availability: ['sat-afternoon'],
    location: at(5),
  });

  it('lets everyone through when nothing is required', () => {
    expect(matchesFilters(candidate, viewer, anything)).toBe(true);
  });

  it('matches instruments against secondary instruments too', () => {
    expect(
      matchesFilters(candidate, viewer, {
        ...anything,
        instruments: ['drums'],
      }),
    ).toBe(true);
    expect(
      matchesFilters(candidate, viewer, {
        ...anything,
        instruments: ['vocals'],
      }),
    ).toBe(false);
  });

  it('needs any one of the listed genres', () => {
    expect(
      matchesFilters(candidate, viewer, {
        ...anything,
        genres: ['rock', 'mpb'],
      }),
    ).toBe(true);
    expect(
      matchesFilters(candidate, viewer, { ...anything, genres: ['rock'] }),
    ).toBe(false);
  });

  it('needs any one of the listed goals', () => {
    expect(
      matchesFilters(candidate, viewer, {
        ...anything,
        goals: ['jam', 'covers'],
      }),
    ).toBe(true);
    expect(
      matchesFilters(candidate, viewer, { ...anything, goals: ['paid-gigs'] }),
    ).toBe(false);
  });

  it('can require a free slot in common with the viewer', () => {
    const strict = { ...anything, sharedAvailabilityOnly: true };
    expect(matchesFilters(candidate, viewer, strict)).toBe(false);
    expect(
      matchesFilters(
        { ...candidate, availability: ['fri-night'] },
        viewer,
        strict,
      ),
    ).toBe(true);
  });

  it('keeps candidates within the radius, inclusive', () => {
    expect(
      matchesFilters(candidate, viewer, { ...anything, maxDistanceKm: 4 }),
    ).toBe(false);
    expect(
      matchesFilters({ ...candidate, location: at(4) }, viewer, {
        ...anything,
        maxDistanceKm: 4.001,
      }),
    ).toBe(true);
  });

  it('combines every requirement', () => {
    expect(
      matchesFilters(candidate, viewer, {
        instruments: ['drums'],
        genres: ['samba'],
        goals: ['jam'],
        sharedAvailabilityOnly: false,
        maxDistanceKm: 10,
      }),
    ).toBe(true);
  });
});
