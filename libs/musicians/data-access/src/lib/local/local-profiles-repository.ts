import { inject, Service } from '@angular/core';
import {
  generateFakeMusicians,
  type MusicianProfile,
} from '@gigmate/musicians/domain';
import { defer, type Observable, of } from 'rxjs';
import { ProfilesRepository } from '../ports';
import { KEY_VALUE_STORAGE, readJson, writeJson } from '../storage';
import { LOCAL_LATENCY_MS, STORAGE_KEYS, withLatency } from './local-config';

/** Fake candidates (generated once, seeded) and the viewer, if any, in local storage. */
@Service({ autoProvided: false })
export class LocalProfilesRepository extends ProfilesRepository {
  private readonly storage = inject(KEY_VALUE_STORAGE);
  private readonly latency = inject(LOCAL_LATENCY_MS);
  private readonly candidates: readonly MusicianProfile[] =
    generateFakeMusicians();

  getViewer(): Observable<MusicianProfile | null> {
    // defer(): read storage on subscribe, not when the Observable is created.
    return defer(() =>
      of(
        readJson<MusicianProfile | null>(
          this.storage,
          STORAGE_KEYS.viewer,
          null,
        ),
      ),
    ).pipe(withLatency(this.latency));
  }

  saveViewer(profile: MusicianProfile): Observable<void> {
    return defer(() => {
      writeJson(this.storage, STORAGE_KEYS.viewer, profile);
      return of(undefined);
    }).pipe(withLatency(this.latency));
  }

  listCandidates(): Observable<readonly MusicianProfile[]> {
    return of(this.candidates).pipe(withLatency(this.latency));
  }
}
