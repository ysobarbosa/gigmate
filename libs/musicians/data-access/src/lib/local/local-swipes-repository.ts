import { inject, Service } from '@angular/core';
import { wouldLikeBack } from '@gigmate/musicians/domain';
import { defer, forkJoin, map, type Observable, of } from 'rxjs';
import {
  type Match,
  ProfilesRepository,
  type Swipe,
  type SwipeDecision,
  type SwipeResult,
  SwipesRepository,
} from '../ports';
import { KEY_VALUE_STORAGE, readJson, writeJson } from '../storage';
import { LOCAL_LATENCY_MS, STORAGE_KEYS, withLatency } from './local-config';

/**
 * Swipes and matches in local storage. With no real people on the other side,
 * the fake profile's answer comes from the domain rule `wouldLikeBack`, which
 * is what a server would decide when the other person likes back.
 */
@Service({ autoProvided: false })
export class LocalSwipesRepository extends SwipesRepository {
  private readonly storage = inject(KEY_VALUE_STORAGE);
  private readonly latency = inject(LOCAL_LATENCY_MS);
  // Depends on the port, not on LocalProfilesRepository.
  private readonly profiles = inject(ProfilesRepository);

  listSwipes(): Observable<readonly Swipe[]> {
    return defer(() => of(this.readSwipes())).pipe(withLatency(this.latency));
  }

  listMatches(): Observable<readonly Match[]> {
    return defer(() => of(this.readMatches())).pipe(withLatency(this.latency));
  }

  swipe(targetId: string, decision: SwipeDecision): Observable<SwipeResult> {
    return forkJoin([
      this.profiles.getViewer(),
      this.profiles.listCandidates(),
    ]).pipe(
      map(([viewer, candidates]) => {
        const target = candidates.find((profile) => profile.id === targetId);
        if (!target) throw new Error(`Unknown profile: ${targetId}`);

        const existing = this.readSwipes().find((s) => s.targetId === targetId);
        if (existing) {
          return {
            match:
              this.readMatches().find((m) => m.profileId === targetId) ?? null,
          };
        }

        const at = new Date().toISOString();
        writeJson(this.storage, STORAGE_KEYS.swipes, [
          ...this.readSwipes(),
          { targetId, decision, at } satisfies Swipe,
        ]);
        if (decision === 'pass' || !wouldLikeBack(target, viewer)) {
          return { match: null };
        }
        const match: Match = { profileId: targetId, at };
        writeJson(this.storage, STORAGE_KEYS.matches, [
          ...this.readMatches(),
          match,
        ]);
        return { match };
      }),
    );
  }

  private readSwipes(): Swipe[] {
    return readJson<Swipe[]>(this.storage, STORAGE_KEYS.swipes, []);
  }

  private readMatches(): Match[] {
    return readJson<Match[]>(this.storage, STORAGE_KEYS.matches, []);
  }
}
