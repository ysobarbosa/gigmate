import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeckStore } from '../deck/deck-store';
import { DEMO_VIEWER } from '../local/demo-viewer';
import { STORAGE_KEYS } from '../local/local-config';
import { ProfilesRepository, SwipesRepository } from '../ports';
import { createMemoryStorage, KEY_VALUE_STORAGE, readJson } from '../storage';
import { setupLocalData, valueOf } from '../testing';
import { ViewerStore } from './viewer-store';

const bassist = {
  ...DEMO_VIEWER,
  name: 'Rafa',
  instruments: [{ instrument: 'bass', level: 'advanced' }],
  lookingFor: ['vocals'],
} as const;

describe('ViewerStore', () => {
  it('has no profile on a first visit', async () => {
    setupLocalData(createMemoryStorage());
    const store = TestBed.inject(ViewerStore);
    expect(await valueOf(store.ensureLoaded())).toBeNull();
    expect(store.hasProfile()).toBe(false);
  });

  it('loads a saved profile, and asks the repository only once', async () => {
    setupLocalData();
    const repo = TestBed.inject(ProfilesRepository);
    const getViewer = jest.spyOn(repo, 'getViewer');
    const store = TestBed.inject(ViewerStore);

    expect(await valueOf(store.ensureLoaded())).toEqual(DEMO_VIEWER);
    await valueOf(store.ensureLoaded());
    expect(getViewer).toHaveBeenCalledTimes(1);
    expect(store.hasProfile()).toBe(true);
  });

  it('saves, persists and updates the deck with the new profile', async () => {
    const storage = setupLocalData();
    const deck = TestBed.inject(DeckStore);
    const store = TestBed.inject(ViewerStore);
    deck.load();
    deck.setFilters({ ...deck.filters()!, genres: ['rock'] });

    await store.save(bassist);

    expect(store.viewer()).toEqual(bassist);
    expect(store.saving()).toBe(false);
    expect(deck.viewer()).toEqual(bassist);
    // Filters start over from what the new profile looks for.
    expect(deck.filters()?.instruments).toEqual(['vocals']);
    expect(deck.filters()?.genres).toEqual([]);
    expect(readJson(storage, STORAGE_KEYS.filters, null)).toBeNull();

    setupLocalData(storage);
    expect(await valueOf(TestBed.inject(ViewerStore).ensureLoaded())).toEqual(
      bassist,
    );
  });

  it('keeps the error and rethrows when saving fails', async () => {
    const failure = new Error('disk full');
    TestBed.configureTestingModule({
      providers: [
        { provide: KEY_VALUE_STORAGE, useValue: createMemoryStorage() },
        {
          provide: ProfilesRepository,
          useValue: {
            getViewer: () => of(null),
            listCandidates: () => of([]),
            saveViewer: () => throwError(() => failure),
          },
        },
        // ViewerStore -> DeckStore -> SwipesRepository: never called here.
        { provide: SwipesRepository, useValue: {} },
      ],
    });
    const store = TestBed.inject(ViewerStore);

    await expect(store.save(bassist)).rejects.toBe(failure);
    expect(store.error()).toBe(failure);
    expect(store.saving()).toBe(false);
    expect(store.hasProfile()).toBe(false);
  });
});
