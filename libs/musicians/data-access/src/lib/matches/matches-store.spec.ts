import { TestBed } from '@angular/core/testing';
import {
  generateFakeMusicians,
  type MusicianProfile,
  wouldLikeBack,
} from '@gigmate/musicians/domain';
import { of, throwError } from 'rxjs';
import { DEMO_VIEWER } from '../local/demo-viewer';
import { type Match, ProfilesRepository, SwipesRepository } from '../ports';
import { createMemoryStorage, KEY_VALUE_STORAGE } from '../storage';
import { setupLocalData, valueOf } from '../testing';
import { MatchesStore } from './matches-store';

const fakes = generateFakeMusicians();
const matchable = fakes.filter((m) => wouldLikeBack(m, DEMO_VIEWER));

describe('MatchesStore with the local adapters', () => {
  beforeEach(() => setupLocalData());

  it('is empty before any match', () => {
    const store = TestBed.inject(MatchesStore);
    store.load();
    expect(store.status()).toBe('ready');
    expect(store.entries()).toEqual([]);
  });

  it('lists matches with their compatibility, and refetches on load()', async () => {
    const store = TestBed.inject(MatchesStore);
    store.load();
    const swipes = TestBed.inject(SwipesRepository);
    await valueOf(swipes.swipe(matchable[0].id, 'like'));
    expect(store.entries()).toEqual([]); // not reloaded yet

    store.load();
    const [entry] = store.entries();
    expect(entry.profile).toEqual(matchable[0]);
    expect(entry.compatibility.score).toBeGreaterThanOrEqual(35);
    // Fake profiles share no contact.
    expect(entry.contact).toBeNull();
    expect(store.entry(matchable[0].id)).toBe(entry);
    expect(store.entry('nobody')).toBeNull();
  });
});

describe('MatchesStore with test doubles', () => {
  const withContact: MusicianProfile = {
    ...fakes[0],
    contact: { kind: 'instagram', value: 'debora.bateria' },
  };

  function setup(
    matches: Match[],
    listCandidates = () => of([withContact, fakes[1]]),
  ) {
    TestBed.configureTestingModule({
      providers: [
        { provide: KEY_VALUE_STORAGE, useValue: createMemoryStorage() },
        {
          provide: ProfilesRepository,
          useValue: { getViewer: () => of(DEMO_VIEWER), listCandidates },
        },
        {
          provide: SwipesRepository,
          useValue: { listMatches: () => of(matches) },
        },
      ],
    });
    const store = TestBed.inject(MatchesStore);
    store.load();
    return store;
  }

  it('sorts the most recent match first', () => {
    const store = setup([
      { profileId: withContact.id, at: '2026-11-10T10:00:00.000Z' },
      { profileId: fakes[1].id, at: '2026-11-15T10:00:00.000Z' },
    ]);
    expect(store.entries().map((e) => e.profile.id)).toEqual([
      fakes[1].id,
      withContact.id,
    ]);
  });

  it('unlocks the contact the person shared', () => {
    const store = setup([
      { profileId: withContact.id, at: '2026-11-10T10:00:00.000Z' },
    ]);
    expect(store.entries()[0].contact).toEqual(withContact.contact);
  });

  it('skips a match whose profile no longer exists', () => {
    const store = setup([
      { profileId: 'gone', at: '2026-11-10T10:00:00.000Z' },
    ]);
    expect(store.entries()).toEqual([]);
  });

  it('reports a load error', () => {
    const failure = new Error('offline');
    const store = setup([], () => throwError(() => failure));
    expect(store.status()).toBe('error');
    expect(store.error()).toBe(failure);
  });
});
