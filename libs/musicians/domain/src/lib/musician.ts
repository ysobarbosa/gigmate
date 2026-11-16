/**
 * Domain model for a musician profile.
 *
 * Every list of allowed values is a `const` array, and its union type is derived
 * from it. That keeps a single source of truth: the seed generator and the
 * filters iterate the arrays, and the compiler checks every literal against them.
 * Values are code slugs; human labels (in Portuguese) belong to the UI layer.
 */

export const INSTRUMENTS = [
  'drums',
  'bass',
  'electric-guitar',
  'acoustic-guitar',
  'vocals',
  'keys',
  'percussion',
  'sax',
  'trumpet',
  'violin',
] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

export const SKILL_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
  'professional',
] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const GENRES = [
  'rock',
  'indie',
  'punk',
  'metal',
  'blues',
  'jazz',
  'soul',
  'mpb',
  'samba',
  'pagode',
  'forro',
  'sertanejo',
  'pop',
  'funk',
  'hip-hop',
  'reggae',
  'electronic',
  'gospel',
] as const;
export type Genre = (typeof GENRES)[number];

/** What the musician wants out of playing with someone. */
export const GOALS = [
  'original-band',
  'covers',
  'paid-gigs',
  'jam',
  'recording',
] as const;
export type Goal = (typeof GOALS)[number];

export const WEEKDAYS = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const SHIFTS = ['morning', 'afternoon', 'night'] as const;
export type Shift = (typeof SHIFTS)[number];

/** One cell of the weekly availability grid, e.g. `'fri-night'`. */
export type AvailabilitySlot = `${Weekday}-${Shift}`;

/** All 21 cells of the grid, in weekday-then-shift order. */
export const AVAILABILITY_SLOTS: readonly AvailabilitySlot[] = WEEKDAYS.flatMap(
  (day) => SHIFTS.map((shift): AvailabilitySlot => `${day}-${shift}`),
);

export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}

export interface InstrumentSkill {
  readonly instrument: Instrument;
  readonly level: SkillLevel;
}

export interface MusicianProfile {
  readonly id: string;
  readonly name: string;
  readonly age: number;
  readonly bio: string;
  /** First item is the main instrument. Never empty. */
  readonly instruments: readonly InstrumentSkill[];
  /** Instruments this musician is looking for (e.g. a band missing a drummer). */
  readonly lookingFor: readonly Instrument[];
  /** Genres the musician plays. */
  readonly genresPlayed: readonly Genre[];
  /** Genres the musician enjoys listening to (may differ from what they play). */
  readonly genresLiked: readonly Genre[];
  readonly goals: readonly Goal[];
  readonly availability: readonly AvailabilitySlot[];
  /** Already approximate (see `approximateLocation`); never an exact address. */
  readonly location: GeoPoint;
  readonly neighborhood: string;
  readonly hasGear: boolean;
  readonly hasCar: boolean;
  readonly hasRehearsalSpace: boolean;
}

export function mainInstrument(profile: MusicianProfile): Instrument {
  return profile.instruments[0].instrument;
}
