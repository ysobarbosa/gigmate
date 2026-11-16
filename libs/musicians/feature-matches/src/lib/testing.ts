import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  createMemoryStorage,
  DEMO_VIEWER,
  KEY_VALUE_STORAGE,
  type Match,
  ProfilesRepository,
  SwipesRepository,
} from '@gigmate/musicians/data-access';
import type { MusicianProfile } from '@gigmate/musicians/domain';
import { of } from 'rxjs';

/** Specs only: the stores over in-memory doubles with these matches. */
export function setupMatches(
  matched: readonly MusicianProfile[],
  at = '2026-11-16T12:00:00.000Z',
) {
  const matches: Match[] = matched.map((p) => ({ profileId: p.id, at }));
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: KEY_VALUE_STORAGE, useValue: createMemoryStorage() },
      {
        provide: ProfilesRepository,
        useValue: {
          getViewer: () => of(DEMO_VIEWER),
          listCandidates: () => of(matched),
        },
      },
      {
        provide: SwipesRepository,
        useValue: { listMatches: () => of(matches) },
      },
    ],
  });
}

export const clean = (text: string | null | undefined) =>
  (text ?? '').replace(/\s+/g, ' ').trim();
