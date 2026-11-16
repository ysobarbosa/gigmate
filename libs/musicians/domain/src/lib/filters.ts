import { distanceKm } from './geo';
import type { Genre, Goal, Instrument, MusicianProfile } from './musician';

/**
 * What the viewer is searching for. Hard requirements: a candidate either
 * passes or is out of the deck. Ranking among those who pass is the job of
 * `compatibility`. An empty list means "any".
 */
export interface DeckFilters {
  /** Candidate plays at least one of these (main or secondary instrument). */
  readonly instruments: readonly Instrument[];
  /** Candidate plays at least one of these genres. */
  readonly genres: readonly Genre[];
  /** Candidate shares at least one goal from this list. */
  readonly goals: readonly Goal[];
  /** Only candidates with at least one free slot in common with the viewer. */
  readonly sharedAvailabilityOnly: boolean;
  readonly maxDistanceKm: number;
}

export const DEFAULT_FILTER_RADIUS_KM = 10;
export const MIN_FILTER_RADIUS_KM = 1;
export const MAX_FILTER_RADIUS_KM = 30;

/** Starting point: whatever the viewer said they are looking for, nearby. */
export function defaultFilters(viewer: MusicianProfile): DeckFilters {
  return {
    instruments: viewer.lookingFor,
    genres: [],
    goals: [],
    sharedAvailabilityOnly: false,
    maxDistanceKm: DEFAULT_FILTER_RADIUS_KM,
  };
}

const anyOf = <T>(wanted: readonly T[], has: readonly T[]) =>
  wanted.length === 0 || wanted.some((item) => has.includes(item));

export function matchesFilters(
  candidate: MusicianProfile,
  viewer: MusicianProfile,
  filters: DeckFilters,
): boolean {
  return (
    anyOf(
      filters.instruments,
      candidate.instruments.map((skill) => skill.instrument),
    ) &&
    anyOf(filters.genres, candidate.genresPlayed) &&
    anyOf(filters.goals, candidate.goals) &&
    (!filters.sharedAvailabilityOnly ||
      candidate.availability.some((slot) =>
        viewer.availability.includes(slot),
      )) &&
    distanceKm(viewer.location, candidate.location) <= filters.maxDistanceKm
  );
}
