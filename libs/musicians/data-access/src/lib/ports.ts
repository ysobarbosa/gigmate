import type { MusicianProfile } from '@gigmate/musicians/domain';
import type { Observable } from 'rxjs';

/**
 * Ports: what the app needs from a data source, with no hint of where the data
 * lives. Abstract classes double as DI tokens and as types, so components and
 * stores `inject(ProfilesRepository)` and never see an adapter.
 *
 * Methods return Observables because a real backend is asynchronous; the local
 * adapter honours the same contract.
 */

export type SwipeDecision = 'like' | 'pass';

export interface Swipe {
  readonly targetId: string;
  readonly decision: SwipeDecision;
  /** ISO 8601. */
  readonly at: string;
}

export interface Match {
  readonly profileId: string;
  /** ISO 8601. */
  readonly at: string;
}

export interface SwipeResult {
  /** Set when this like completed a mutual like. */
  readonly match: Match | null;
}

export abstract class ProfilesRepository {
  /** The signed-in musician, or null before onboarding. */
  abstract getViewer(): Observable<MusicianProfile | null>;
  abstract saveViewer(profile: MusicianProfile): Observable<void>;
  /**
   * Everyone who can appear in the deck. Filtering and ranking happen in the store.
   * A real backend must omit `contact` here for anyone the viewer has not
   * matched: hiding it in the UI is not enough when the data reaches the browser.
   */
  abstract listCandidates(): Observable<readonly MusicianProfile[]>;
}

export abstract class SwipesRepository {
  abstract listSwipes(): Observable<readonly Swipe[]>;
  /**
   * Records a decision. Idempotent: swiping the same profile again returns the
   * first result. Errors if the profile does not exist.
   */
  abstract swipe(
    targetId: string,
    decision: SwipeDecision,
  ): Observable<SwipeResult>;
  abstract listMatches(): Observable<readonly Match[]>;
}
