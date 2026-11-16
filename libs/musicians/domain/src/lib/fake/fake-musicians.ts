import { approximateLocation } from '../geo';
import {
  type AvailabilitySlot,
  AVAILABILITY_SLOTS,
  type Genre,
  GENRES,
  type Goal,
  type Instrument,
  type InstrumentSkill,
  type MusicianProfile,
  SHIFTS,
  WEEKDAYS,
} from '../musician';
import {
  BIOS,
  FIRST_NAMES,
  GOAL_WEIGHTS,
  INSTRUMENT_WEIGHTS,
  LAST_NAMES,
  LEVEL_WEIGHTS,
  NEIGHBORHOODS,
  SCENES,
} from './fake-data';
import { createRandom, type Random } from './random';

export interface FakeMusiciansOptions {
  readonly count?: number;
  readonly seed?: number;
}

export const DEFAULT_FAKE_SEED = 42;

/**
 * Generates plausible, reproducible fake musicians around São Paulo.
 * Same options, same output: profiles are generated at runtime instead of
 * being stored as a JSON file, so the rules that shape the data live in code.
 */
export function generateFakeMusicians({
  count = 60,
  seed = DEFAULT_FAKE_SEED,
}: FakeMusiciansOptions = {}): MusicianProfile[] {
  const random = createRandom(seed);
  return Array.from({ length: count }, (_, index) =>
    fakeMusician(random, index),
  );
}

function fakeMusician(random: Random, index: number): MusicianProfile {
  const instruments = fakeInstruments(random);
  const ownInstruments = instruments.map((skill) => skill.instrument);
  const [neighborhood, center] = random.pick(NEIGHBORHOODS);
  const scene = random.pick(SCENES);
  const genresPlayed = random.sample(scene, random.int(2, 3));
  return {
    id: `fake-${String(index + 1).padStart(3, '0')}`,
    name: `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`,
    age: random.int(18, 55),
    bio: random.pick(BIOS),
    instruments,
    lookingFor: fakeLookingFor(random, ownInstruments),
    genresPlayed,
    genresLiked: fakeGenresLiked(random, scene, genresPlayed),
    goals: fakeGoals(random),
    availability: fakeAvailability(random),
    // ~±1.5 km of jitter around the neighborhood center, then rounded.
    location: approximateLocation({
      lat: center.lat + (random.next() - 0.5) * 0.03,
      lng: center.lng + (random.next() - 0.5) * 0.03,
    }),
    neighborhood,
    hasGear: random.chance(0.7),
    hasCar: random.chance(0.5),
    hasRehearsalSpace: random.chance(0.2),
  };
}

function fakeInstruments(random: Random): InstrumentSkill[] {
  const main = random.weighted(INSTRUMENT_WEIGHTS);
  const skills: InstrumentSkill[] = [
    { instrument: main, level: random.weighted(LEVEL_WEIGHTS) },
  ];
  if (random.chance(0.3)) {
    const others = INSTRUMENT_WEIGHTS.filter(
      ([instrument]) => instrument !== main,
    );
    skills.push({
      instrument: random.weighted(others),
      // A secondary instrument is rarely played at a professional level.
      level: random.weighted(LEVEL_WEIGHTS.slice(0, 3)),
    });
  }
  return skills;
}

/** Most people look for something; drums are the most wanted. */
function fakeLookingFor(
  random: Random,
  own: readonly Instrument[],
): Instrument[] {
  if (random.chance(0.2)) return [];
  const candidates = INSTRUMENT_WEIGHTS.filter(
    ([instrument]) => !own.includes(instrument),
  );
  const wanted = new Set<Instrument>();
  const target = random.int(1, 2);
  while (wanted.size < target) wanted.add(random.weighted(candidates));
  return [...wanted];
}

function fakeGenresLiked(
  random: Random,
  scene: readonly Genre[],
  played: readonly Genre[],
): Genre[] {
  const fromScene = scene.filter((genre) => !played.includes(genre));
  const liked = new Set(random.sample(fromScene, random.int(1, 2)));
  if (random.chance(0.4)) liked.add(random.pick(GENRES));
  return [...liked];
}

function fakeGoals(random: Random): Goal[] {
  const goals = new Set<Goal>();
  const target = random.int(1, 3);
  while (goals.size < target) goals.add(random.weighted(GOAL_WEIGHTS));
  return [...goals];
}

const WEEKDAYS_ONLY = WEEKDAYS.slice(0, 5);
const slot = (day: string, shift: string) =>
  `${day}-${shift}` as AvailabilitySlot;

/** A few realistic routines, so availability overlaps in meaningful ways. */
function fakeAvailability(random: Random): AvailabilitySlot[] {
  const routine = random.weighted([
    ['works-days', 40],
    ['weekends', 25],
    ['student', 20],
    ['flexible', 15],
  ] as const);
  const slots = new Set<AvailabilitySlot>();
  switch (routine) {
    case 'works-days':
      random
        .sample(WEEKDAYS_ONLY, random.int(2, 4))
        .forEach((day) => slots.add(slot(day, 'night')));
      if (random.chance(0.5))
        slots.add(slot(random.pick(['sat', 'sun']), 'afternoon'));
      break;
    case 'weekends':
      random
        .sample(
          ['sat', 'sun'].flatMap((day) =>
            SHIFTS.map((shift) => slot(day, shift)),
          ),
          random.int(3, 5),
        )
        .forEach((s) => slots.add(s));
      break;
    case 'student':
      random
        .sample(WEEKDAYS_ONLY, random.int(2, 3))
        .forEach((day) => slots.add(slot(day, 'afternoon')));
      random
        .sample(WEEKDAYS, random.int(1, 2))
        .forEach((day) => slots.add(slot(day, 'night')));
      break;
    case 'flexible':
      random
        .sample(AVAILABILITY_SLOTS, random.int(6, 12))
        .forEach((s) => slots.add(s));
      break;
  }
  // Keep grid order (mon-morning ... sun-night) for stable, readable output.
  return AVAILABILITY_SLOTS.filter((s) => slots.has(s));
}
