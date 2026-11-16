import { TestBed } from '@angular/core/testing';
import {
  type DeckFilters,
  DEFAULT_FILTER_RADIUS_KM,
  distanceKm,
  generateFakeMusicians,
  type MusicianProfile,
  wouldLikeBack,
} from '@gigmate/musicians/domain';
import { of, Subject, throwError } from 'rxjs';
import { DEMO_VIEWER } from '../local/demo-viewer';
import { LOCAL_LATENCY_MS, STORAGE_KEYS } from '../local/local-config';
import { provideLocalMusiciansData } from '../provide-local-musicians-data';
import {
  type Match,
  ProfilesRepository,
  type Swipe,
  SwipesRepository,
} from '../ports';
import {
  createMemoryStorage,
  KEY_VALUE_STORAGE,
  readJson,
  writeJson,
} from '../storage';
import { setupLocalData, valueOf } from '../testing';
import { DeckStore } from './deck-store';

const fakes = generateFakeMusicians();
const likesBack = fakes.find((m) => wouldLikeBack(m, DEMO_VIEWER))!;
const doesNotLikeBack = fakes.find((m) => !wouldLikeBack(m, DEMO_VIEWER))!;

const NO_FILTERS: DeckFilters = {
  instruments: [],
  genres: [],
  goals: [],
  sharedAvailabilityOnly: false,
  maxDistanceKm: 100,
};

const deckIds = (store: DeckStore) => store.cards().map((c) => c.profile.id);

/** Loads and lifts every filter, so any fake profile can be swiped. */
function loadEverything(store: DeckStore): void {
  store.load();
  store.setFilters(NO_FILTERS);
}

describe('DeckStore with the local adapters', () => {
  let store: DeckStore;

  beforeEach(() => {
    setupLocalData();
    store = TestBed.inject(DeckStore);
  });

  it('starts idle and empty; it does not load by itself', () => {
    expect(store.status()).toBe('idle');
    expect(store.cards()).toEqual([]);
    expect(store.current()).toBeNull();
    expect(store.filters()).toBeNull();
  });

  it('ranks the deck, best match first', () => {
    loadEverything(store);
    expect(store.status()).toBe('ready');
    expect(store.viewer()).toEqual(DEMO_VIEWER);

    const scores = store.cards().map((c) => c.compatibility.score);
    expect(scores).toHaveLength(fakes.length);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(store.current()).toBe(store.cards()[0]);
  });

  it('removes a liked card at once and announces the match', () => {
    loadEverything(store);
    store.like(likesBack.id);
    expect(deckIds(store)).not.toContain(likesBack.id);
    expect(store.lastMatch()).toEqual(likesBack);

    store.dismissMatch();
    expect(store.lastMatch()).toBeNull();
  });

  it('removes a card without a match when the other side would not like back', () => {
    loadEverything(store);
    store.like(doesNotLikeBack.id);
    expect(deckIds(store)).not.toContain(doesNotLikeBack.id);
    expect(store.lastMatch()).toBeNull();
  });

  it('removes a passed card without a match', () => {
    loadEverything(store);
    store.pass(likesBack.id);
    expect(deckIds(store)).not.toContain(likesBack.id);
    expect(store.lastMatch()).toBeNull();
  });

  it('ignores a second swipe on the same card', async () => {
    loadEverything(store);
    store.like(likesBack.id);
    store.pass(likesBack.id);
    const swipes = await valueOf(TestBed.inject(SwipesRepository).listSwipes());
    expect(swipes.map((s) => s.decision)).toEqual(['like']);
  });

  it('keeps swiped cards out of the deck after a reload', () => {
    const storage = createMemoryStorage();
    setupLocalData(storage);
    store = TestBed.inject(DeckStore);
    loadEverything(store);
    store.pass(doesNotLikeBack.id);

    setupLocalData(storage);
    store = TestBed.inject(DeckStore);
    store.load();
    expect(deckIds(store)).not.toContain(doesNotLikeBack.id);
    expect(store.cards()).toHaveLength(fakes.length - 1);
  });
});

describe('DeckStore filters', () => {
  let store: DeckStore;
  let storage: ReturnType<typeof createMemoryStorage>;

  beforeEach(() => {
    storage = setupLocalData();
    store = TestBed.inject(DeckStore);
  });

  it('starts from what the viewer is looking for, nearby', () => {
    store.load();
    expect(store.filters()?.instruments).toEqual(DEMO_VIEWER.lookingFor);
    expect(store.cards().length).toBeGreaterThan(0);
    for (const { profile } of store.cards()) {
      expect(profile.instruments.map((s) => s.instrument)).toContain('drums');
      expect(
        distanceKm(DEMO_VIEWER.location, profile.location),
      ).toBeLessThanOrEqual(DEFAULT_FILTER_RADIUS_KM);
    }
  });

  it('counts how many unseen musicians the filters hide', () => {
    store.load();
    expect(store.hiddenByFilters()).toBe(fakes.length - store.cards().length);
    store.setFilters(NO_FILTERS);
    expect(store.hiddenByFilters()).toBe(0);
  });

  it('applies new filters at once and keeps them across reloads', () => {
    store.load();
    const vocalists = { ...NO_FILTERS, instruments: ['vocals'] } as const;
    store.setFilters(vocalists);
    expect(
      store
        .cards()
        .every((c) =>
          c.profile.instruments.some((s) => s.instrument === 'vocals'),
        ),
    ).toBe(true);

    setupLocalData(storage);
    store = TestBed.inject(DeckStore);
    store.load();
    expect(store.filters()).toEqual(vocalists);
  });

  it('fills fields missing from saved filters with the defaults', () => {
    writeJson(storage, STORAGE_KEYS.filters, { genres: ['rock'] });
    store.load();
    expect(store.filters()).toEqual({
      instruments: ['drums'],
      genres: ['rock'],
      goals: [],
      sharedAvailabilityOnly: false,
      maxDistanceKm: DEFAULT_FILTER_RADIUS_KM,
    });
  });

  it('resets to the defaults and forgets the saved filters', () => {
    store.load();
    const defaults = store.filters();
    store.setFilters(NO_FILTERS);
    store.resetFilters();
    expect(store.filters()).toEqual(defaults);
    expect(readJson(storage, STORAGE_KEYS.filters, null)).toBeNull();
  });
});

describe('DeckStore with test doubles', () => {
  function setup(
    profiles: Partial<ProfilesRepository>,
    swipes: Partial<SwipesRepository> = {},
  ): DeckStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: KEY_VALUE_STORAGE, useValue: createMemoryStorage() },
        {
          provide: ProfilesRepository,
          useValue: {
            getViewer: () => of(DEMO_VIEWER),
            listCandidates: () => of(fakes),
            ...profiles,
          },
        },
        {
          provide: SwipesRepository,
          useValue: {
            listSwipes: () => of<Swipe[]>([]),
            listMatches: () => of<Match[]>([]),
            swipe: () => of({ match: null }),
            ...swipes,
          },
        },
      ],
    });
    return TestBed.inject(DeckStore);
  }

  it('is loading while the request is pending and ignores load() meanwhile', () => {
    const candidates$ = new Subject<readonly MusicianProfile[]>();
    const listCandidates = jest.fn(() => candidates$);
    const store = setup({ listCandidates });

    store.load();
    store.load();
    expect(store.loading()).toBe(true);
    expect(listCandidates).toHaveBeenCalledTimes(1);

    candidates$.next(fakes);
    candidates$.complete();
    expect(store.status()).toBe('ready');
  });

  it('reports a load error', () => {
    const failure = new Error('offline');
    const store = setup({ listCandidates: () => throwError(() => failure) });
    store.load();
    expect(store.status()).toBe('error');
    expect(store.error()).toBe(failure);
  });

  it('puts the card back when saving a swipe fails', () => {
    const failure = new Error('offline');
    const store = setup({}, { swipe: () => throwError(() => failure) });
    store.load();
    const top = store.current()!.profile.id;

    store.like(top);
    expect(store.current()?.profile.id).toBe(top);
    expect(store.error()).toBe(failure);
    expect(store.status()).toBe('ready');
  });

  it('removes the card before the save completes (optimistic)', () => {
    const result$ = new Subject<{ match: Match | null }>();
    const store = setup({}, { swipe: () => result$ });
    store.load();
    const top = store.current()!.profile.id;

    store.like(top);
    expect(deckIds(store)).not.toContain(top);
  });
});

it('uses the 300 ms default latency outside tests', () => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideLocalMusiciansData(),
      { provide: KEY_VALUE_STORAGE, useValue: createMemoryStorage() },
    ],
  });
  expect(TestBed.inject(LOCAL_LATENCY_MS)).toBe(300);
});
