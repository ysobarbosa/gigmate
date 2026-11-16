import { TestBed } from '@angular/core/testing';
import {
  generateFakeMusicians,
  type MusicianProfile,
  wouldLikeBack,
} from '@gigmate/musicians/domain';
import { of, Subject, throwError } from 'rxjs';
import { DEMO_VIEWER } from '../local/demo-viewer';
import { LOCAL_LATENCY_MS } from '../local/local-config';
import { provideLocalMusiciansData } from '../provide-local-musicians-data';
import {
  type Match,
  ProfilesRepository,
  type Swipe,
  SwipesRepository,
} from '../ports';
import { createMemoryStorage, KEY_VALUE_STORAGE } from '../storage';
import { setupLocalData, valueOf } from '../testing';
import { DeckStore } from './deck-store';

const fakes = generateFakeMusicians();
const likesBack = fakes.find((m) => wouldLikeBack(m, DEMO_VIEWER))!;
const doesNotLikeBack = fakes.find((m) => !wouldLikeBack(m, DEMO_VIEWER))!;

const deckIds = (store: DeckStore) => store.cards().map((c) => c.profile.id);

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
  });

  it('loads every candidate, best match first', () => {
    store.load();
    expect(store.status()).toBe('ready');
    expect(store.viewer()).toEqual(DEMO_VIEWER);

    const scores = store.cards().map((c) => c.compatibility.score);
    expect(scores).toHaveLength(fakes.length);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(store.current()).toBe(store.cards()[0]);
  });

  it('removes a liked card at once and announces the match', () => {
    store.load();
    store.like(likesBack.id);
    expect(deckIds(store)).not.toContain(likesBack.id);
    expect(store.lastMatch()).toEqual(likesBack);

    store.dismissMatch();
    expect(store.lastMatch()).toBeNull();
  });

  it('removes a card without a match when the other side would not like back', () => {
    store.load();
    store.like(doesNotLikeBack.id);
    expect(deckIds(store)).not.toContain(doesNotLikeBack.id);
    expect(store.lastMatch()).toBeNull();
  });

  it('removes a passed card without a match', () => {
    store.load();
    store.pass(likesBack.id);
    expect(deckIds(store)).not.toContain(likesBack.id);
    expect(store.lastMatch()).toBeNull();
  });

  it('ignores a second swipe on the same card', async () => {
    store.load();
    store.like(likesBack.id);
    store.pass(likesBack.id);
    const swipes = await valueOf(TestBed.inject(SwipesRepository).listSwipes());
    expect(swipes.map((s) => s.decision)).toEqual(['like']);
  });

  it('keeps swiped cards out of the deck after a reload', () => {
    const storage = createMemoryStorage();
    setupLocalData(storage);
    store = TestBed.inject(DeckStore);
    store.load();
    store.pass(doesNotLikeBack.id);

    setupLocalData(storage);
    store = TestBed.inject(DeckStore);
    store.load();
    expect(deckIds(store)).not.toContain(doesNotLikeBack.id);
    expect(store.cards()).toHaveLength(fakes.length - 1);
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
