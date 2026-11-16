import {
  type AvailabilitySlot,
  type Genre,
  type Goal,
  type Instrument,
  type InstrumentSkill,
  type MusicianProfile,
  neighborhoodLocation,
  type SkillLevel,
} from '@gigmate/musicians/domain';

/**
 * The form's model: flat and permissive (empty strings, null age) so every
 * field can start blank. `profileFromDraft` turns a valid draft into the
 * strict domain type.
 */
export interface ProfileDraft {
  name: string;
  age: number | null;
  neighborhood: string;
  bio: string;
  mainInstrument: Instrument | '';
  mainLevel: SkillLevel;
  secondInstrument: Instrument | '';
  secondLevel: SkillLevel;
  lookingFor: readonly Instrument[];
  genresPlayed: readonly Genre[];
  genresLiked: readonly Genre[];
  goals: readonly Goal[];
  availability: readonly AvailabilitySlot[];
  hasGear: boolean;
  hasCar: boolean;
  hasRehearsalSpace: boolean;
}

export function emptyDraft(): ProfileDraft {
  return {
    name: '',
    age: null,
    neighborhood: '',
    bio: '',
    mainInstrument: '',
    mainLevel: 'intermediate',
    secondInstrument: '',
    secondLevel: 'beginner',
    lookingFor: [],
    genresPlayed: [],
    genresLiked: [],
    goals: [],
    availability: [],
    hasGear: false,
    hasCar: false,
    hasRehearsalSpace: false,
  };
}

export function draftFromProfile(profile: MusicianProfile): ProfileDraft {
  const [main, second] = profile.instruments;
  return {
    name: profile.name,
    age: profile.age,
    neighborhood: profile.neighborhood,
    bio: profile.bio,
    mainInstrument: main.instrument,
    mainLevel: main.level,
    secondInstrument: second?.instrument ?? '',
    secondLevel: second?.level ?? 'beginner',
    lookingFor: profile.lookingFor,
    genresPlayed: profile.genresPlayed,
    genresLiked: profile.genresLiked,
    goals: profile.goals,
    availability: profile.availability,
    hasGear: profile.hasGear,
    hasCar: profile.hasCar,
    hasRehearsalSpace: profile.hasRehearsalSpace,
  };
}

/**
 * Builds the domain profile. Call only with a draft the form considers valid;
 * the checks here are a last line of defence, not user-facing validation.
 */
export function profileFromDraft(
  draft: ProfileDraft,
  id = 'viewer',
): MusicianProfile {
  const location = neighborhoodLocation(draft.neighborhood);
  if (!draft.mainInstrument || draft.age === null || !location) {
    throw new Error('Incomplete profile draft');
  }
  const instruments: InstrumentSkill[] = [
    { instrument: draft.mainInstrument, level: draft.mainLevel },
  ];
  if (
    draft.secondInstrument &&
    draft.secondInstrument !== draft.mainInstrument
  ) {
    instruments.push({
      instrument: draft.secondInstrument,
      level: draft.secondLevel,
    });
  }
  const own = instruments.map((skill) => skill.instrument);
  return {
    id,
    name: draft.name.trim(),
    age: draft.age,
    bio: draft.bio.trim(),
    instruments,
    // Looking for an instrument you already play is a slip, not a wish.
    lookingFor: draft.lookingFor.filter((i) => !own.includes(i)),
    genresPlayed: draft.genresPlayed,
    genresLiked: draft.genresLiked,
    goals: draft.goals,
    availability: draft.availability,
    location,
    neighborhood: draft.neighborhood,
    hasGear: draft.hasGear,
    hasCar: draft.hasCar,
    hasRehearsalSpace: draft.hasRehearsalSpace,
  };
}
