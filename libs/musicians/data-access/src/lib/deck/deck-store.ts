import { computed, inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type Compatibility,
  compatibility,
  type DeckFilters,
  defaultFilters,
  matchesFilters,
  type MusicianProfile,
} from '@gigmate/musicians/domain';
import {
  catchError,
  concatMap,
  EMPTY,
  exhaustMap,
  forkJoin,
  map,
  Subject,
  tap,
} from 'rxjs';
import { STORAGE_KEYS } from '../local/local-config';
import {
  ProfilesRepository,
  type SwipeDecision,
  SwipesRepository,
} from '../ports';
import { KEY_VALUE_STORAGE, readJson, writeJson } from '../storage';

export interface DeckCard {
  readonly profile: MusicianProfile;
  readonly compatibility: Compatibility;
}

export type DeckStatus = 'idle' | 'loading' | 'ready' | 'error';

interface DeckState {
  readonly viewer: MusicianProfile | null;
  readonly candidates: readonly MusicianProfile[];
  /** Swiped ids, including optimistic ones still being saved. */
  readonly swipedIds: ReadonlySet<string>;
  readonly status: DeckStatus;
  /** Load error (status 'error') or the last swipe error (status stays 'ready'). */
  readonly error: unknown;
  readonly lastMatch: MusicianProfile | null;
  /** Null until the viewer is known (the defaults come from the viewer). */
  readonly filters: DeckFilters | null;
}

const initialState: DeckState = {
  viewer: null,
  candidates: [],
  swipedIds: new Set(),
  status: 'idle',
  error: null,
  lastMatch: null,
  filters: null,
};

/**
 * The swipe deck: candidates not swiped yet, best matches first.
 *
 * State lives in one signal; everything the UI reads is `computed`. Swipes are
 * optimistic: the card leaves the deck at once (a swipe must feel instant) and
 * comes back with an error if saving fails.
 */
@Service()
export class DeckStore {
  private readonly profiles = inject(ProfilesRepository);
  private readonly swipes = inject(SwipesRepository);
  // Filters are a device preference, not shared data: always stored locally,
  // whatever the backend behind the ports.
  private readonly storage = inject(KEY_VALUE_STORAGE);

  private readonly state = signal(initialState);
  private readonly load$ = new Subject<void>();
  private readonly swipe$ = new Subject<{
    id: string;
    decision: SwipeDecision;
  }>();

  readonly status = computed(() => this.state().status);
  readonly loading = computed(() => this.state().status === 'loading');
  readonly error = computed(() => this.state().error);
  readonly viewer = computed(() => this.state().viewer);
  readonly lastMatch = computed(() => this.state().lastMatch);
  readonly filters = computed(() => this.state().filters);

  /** Not swiped yet, before filters. */
  private readonly unseen = computed(() => {
    const { viewer, candidates, swipedIds } = this.state();
    if (!viewer) return [];
    return candidates.filter((p) => p.id !== viewer.id && !swipedIds.has(p.id));
  });

  /** Filtered, then ranked by score; ties by id so the order is stable. */
  readonly cards = computed<readonly DeckCard[]>(() => {
    const { viewer, filters } = this.state();
    if (!viewer || !filters) return [];
    return this.unseen()
      .filter((p) => matchesFilters(p, viewer, filters))
      .map((profile) => ({
        profile,
        compatibility: compatibility(viewer, profile),
      }))
      .sort(
        (a, b) =>
          b.compatibility.score - a.compatibility.score ||
          a.profile.id.localeCompare(b.profile.id),
      );
  });

  readonly current = computed(() => this.cards()[0] ?? null);

  /** Unseen musicians the filters are hiding (to suggest widening them). */
  readonly hiddenByFilters = computed(
    () => this.unseen().length - this.cards().length,
  );

  constructor() {
    this.load$
      .pipe(
        // Ignore load() while one is in flight.
        exhaustMap(() => {
          this.patch({ status: 'loading', error: null });
          return forkJoin([
            this.profiles.getViewer(),
            this.profiles.listCandidates(),
            this.swipes.listSwipes(),
          ]).pipe(
            tap(([viewer, candidates, swipes]) =>
              this.patch({
                viewer,
                candidates,
                swipedIds: new Set(swipes.map((s) => s.targetId)),
                filters: this.restoreFilters(viewer),
                status: 'ready',
              }),
            ),
            catchError((error: unknown) => {
              this.patch({ status: 'error', error });
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.swipe$
      .pipe(
        // One save at a time, in the order the user swiped.
        concatMap(({ id, decision }) =>
          this.swipes.swipe(id, decision).pipe(
            map(({ match }) => match),
            tap((match) => {
              if (match) this.patch({ lastMatch: this.findCandidate(id) });
            }),
            catchError((error: unknown) => {
              this.updateSwiped((ids) => ids.delete(id));
              this.patch({ error });
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  load(): void {
    this.load$.next();
  }

  like(id: string): void {
    this.swipe(id, 'like');
  }

  pass(id: string): void {
    this.swipe(id, 'pass');
  }

  dismissMatch(): void {
    this.patch({ lastMatch: null });
  }

  setFilters(filters: DeckFilters): void {
    this.patch({ filters });
    writeJson(this.storage, STORAGE_KEYS.filters, filters);
  }

  resetFilters(): void {
    const viewer = this.state().viewer;
    this.storage.removeItem(STORAGE_KEYS.filters);
    this.patch({ filters: viewer ? defaultFilters(viewer) : null });
  }

  /**
   * Saved filters over the defaults: a field added in a later version gets its
   * default instead of `undefined`.
   */
  private restoreFilters(viewer: MusicianProfile): DeckFilters {
    const saved = readJson<Partial<DeckFilters>>(
      this.storage,
      STORAGE_KEYS.filters,
      {},
    );
    return { ...defaultFilters(viewer), ...saved };
  }

  private swipe(id: string, decision: SwipeDecision): void {
    // Only cards still in the deck can be swiped (no double swipes).
    if (!this.cards().some((card) => card.profile.id === id)) return;
    this.updateSwiped((ids) => ids.add(id));
    this.patch({ error: null });
    this.swipe$.next({ id, decision });
  }

  private findCandidate(id: string): MusicianProfile | null {
    return this.state().candidates.find((p) => p.id === id) ?? null;
  }

  /** Signals compare by reference: mutate a copy, never the current Set. */
  private updateSwiped(change: (ids: Set<string>) => void): void {
    this.state.update((s) => {
      const ids = new Set(s.swipedIds);
      change(ids);
      return { ...s, swipedIds: ids };
    });
  }

  private patch(partial: Partial<DeckState>): void {
    this.state.update((s) => ({ ...s, ...partial }));
  }
}
