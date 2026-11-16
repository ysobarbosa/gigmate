import { distanceKm } from './geo';
import type { MusicianProfile } from './musician';

/** How much each dimension weighs in the final score. Sums to 1. */
export const COMPATIBILITY_WEIGHTS = {
  genres: 0.35,
  availability: 0.3,
  goals: 0.2,
  distance: 0.15,
} as const;

/** Beyond this distance the distance component is 0. */
export const DEFAULT_MAX_DISTANCE_KM = 30;

/**
 * Minimum score for a fake profile to like the viewer back. Tuned on the fake
 * data (median score ~33): at 35 about a third of the relevant profiles match,
 * so the demo has matches without everyone liking everyone.
 */
export const LIKE_BACK_THRESHOLD = 35;

export interface CompatibilityBreakdown {
  /** Each component is in [0, 1]. */
  readonly genres: number;
  readonly availability: number;
  readonly goals: number;
  readonly distance: number;
}

export interface Compatibility {
  /** Weighted total, integer in [0, 100]. */
  readonly score: number;
  readonly breakdown: CompatibilityBreakdown;
  /** Exact distance between the stored (already approximate) points. */
  readonly distanceKm: number;
}

export interface CompatibilityOptions {
  readonly maxDistanceKm?: number;
}

/** |A ∩ B| / |A ∪ B|. Two empty sets share nothing, so 0. */
export function jaccard<T>(a: readonly T[], b: readonly T[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersectionSize(setA, setB) / union;
}

/**
 * |A ∩ B| / min(|A|, |B|): how much of the smaller set the other one covers.
 * Used for availability and goals, where someone free only on Friday night
 * fully fits someone free every night (Jaccard would punish the second one
 * for being more available).
 */
export function overlapCoefficient<T>(
  a: readonly T[],
  b: readonly T[],
): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const smaller = Math.min(setA.size, setB.size);
  return smaller === 0 ? 0 : intersectionSize(setA, setB) / smaller;
}

function intersectionSize<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): number {
  let count = 0;
  for (const item of a) if (b.has(item)) count++;
  return count;
}

/**
 * Symmetric compatibility between two musicians: compatibility(a, b) equals
 * compatibility(b, a), so "it's a match" means the same number for both sides.
 * Hard requirements (instrument wanted, radius) are filters, not part of the score.
 */
export function compatibility(
  a: MusicianProfile,
  b: MusicianProfile,
  { maxDistanceKm = DEFAULT_MAX_DISTANCE_KM }: CompatibilityOptions = {},
): Compatibility {
  const km = distanceKm(a.location, b.location);
  const breakdown: CompatibilityBreakdown = {
    // What people play matters more than what they listen to.
    genres:
      0.7 * jaccard(a.genresPlayed, b.genresPlayed) +
      0.3 * jaccard(a.genresLiked, b.genresLiked),
    availability: overlapCoefficient(a.availability, b.availability),
    goals: overlapCoefficient(a.goals, b.goals),
    distance: Math.max(0, 1 - km / maxDistanceKm),
  };
  const weighted =
    COMPATIBILITY_WEIGHTS.genres * breakdown.genres +
    COMPATIBILITY_WEIGHTS.availability * breakdown.availability +
    COMPATIBILITY_WEIGHTS.goals * breakdown.goals +
    COMPATIBILITY_WEIGHTS.distance * breakdown.distance;
  return { score: Math.round(weighted * 100), breakdown, distanceKm: km };
}

/**
 * Deterministic stand-in for a real person's decision: a fake profile likes
 * the viewer back when they are compatible enough and, if the fake profile is
 * looking for specific instruments, the viewer plays one of them.
 */
export function wouldLikeBack(
  candidate: MusicianProfile,
  viewer: MusicianProfile,
  options?: CompatibilityOptions,
): boolean {
  const wantsViewer =
    candidate.lookingFor.length === 0 ||
    viewer.instruments.some(({ instrument }) =>
      candidate.lookingFor.includes(instrument),
    );
  return (
    wantsViewer &&
    compatibility(candidate, viewer, options).score >= LIKE_BACK_THRESHOLD
  );
}
