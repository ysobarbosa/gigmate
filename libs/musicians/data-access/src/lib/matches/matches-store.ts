import { computed, inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type Compatibility,
  compatibility,
  type Contact,
  type MusicianProfile,
  visibleContact,
} from '@gigmate/musicians/domain';
import { catchError, EMPTY, exhaustMap, forkJoin, Subject, tap } from 'rxjs';
import { ProfilesRepository, SwipesRepository } from '../ports';

export interface MatchEntry {
  readonly profile: MusicianProfile;
  readonly compatibility: Compatibility;
  /** ISO 8601. */
  readonly matchedAt: string;
  /** Unlocked by the match (null if the person shared none). */
  readonly contact: Contact | null;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface MatchesState {
  readonly entries: readonly MatchEntry[];
  readonly status: Status;
  readonly error: unknown;
}

/** The viewer's matches, most recent first, with the contact each match unlocks. */
@Service()
export class MatchesStore {
  private readonly profiles = inject(ProfilesRepository);
  private readonly swipes = inject(SwipesRepository);

  private readonly state = signal<MatchesState>({
    entries: [],
    status: 'idle',
    error: null,
  });
  private readonly load$ = new Subject<void>();

  readonly entries = computed(() => this.state().entries);
  readonly status = computed(() => this.state().status);
  readonly error = computed(() => this.state().error);

  constructor() {
    this.load$
      .pipe(
        exhaustMap(() => {
          this.state.update((s) => ({ ...s, status: 'loading', error: null }));
          return forkJoin([
            this.profiles.getViewer(),
            this.profiles.listCandidates(),
            this.swipes.listMatches(),
          ]).pipe(
            tap(([viewer, candidates, matches]) => {
              const byId = new Map(candidates.map((p) => [p.id, p]));
              const entries = viewer
                ? matches
                    .flatMap((match) => {
                      const profile = byId.get(match.profileId);
                      // A match whose profile no longer exists is skipped.
                      return profile
                        ? [
                            {
                              profile,
                              compatibility: compatibility(viewer, profile),
                              matchedAt: match.at,
                              contact: visibleContact(profile, true),
                            },
                          ]
                        : [];
                    })
                    .sort((a, b) => b.matchedAt.localeCompare(a.matchedAt))
                : [];
              this.state.set({ entries, status: 'ready', error: null });
            }),
            catchError((error: unknown) => {
              this.state.update((s) => ({ ...s, status: 'error', error }));
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  /** Always refetches: a match may have happened in the deck since the last load. */
  load(): void {
    this.load$.next();
  }

  entry(profileId: string): MatchEntry | null {
    return this.entries().find((e) => e.profile.id === profileId) ?? null;
  }
}
