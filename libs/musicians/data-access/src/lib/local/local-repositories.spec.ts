import { TestBed } from '@angular/core/testing';
import {
  generateFakeMusicians,
  wouldLikeBack,
} from '@gigmate/musicians/domain';
import { ProfilesRepository, SwipesRepository } from '../ports';
import { setupLocalData, valueOf } from '../testing';
import { DEMO_VIEWER } from './demo-viewer';
import { LocalProfilesRepository } from './local-profiles-repository';
import { LocalSwipesRepository } from './local-swipes-repository';

const fakes = generateFakeMusicians();
const likesBack = fakes.find((m) => wouldLikeBack(m, DEMO_VIEWER))!;
const doesNotLikeBack = fakes.find((m) => !wouldLikeBack(m, DEMO_VIEWER))!;

describe('provideLocalMusiciansData', () => {
  it('binds the ports to the local adapters', () => {
    setupLocalData();
    expect(TestBed.inject(ProfilesRepository)).toBeInstanceOf(
      LocalProfilesRepository,
    );
    expect(TestBed.inject(SwipesRepository)).toBeInstanceOf(
      LocalSwipesRepository,
    );
  });

  it('is required: without it the ports cannot be injected', () => {
    TestBed.resetTestingModule();
    expect(() => TestBed.inject(ProfilesRepository)).toThrow(/No provider/);
  });
});

describe('LocalProfilesRepository', () => {
  const repo = () => TestBed.inject(ProfilesRepository);

  it('lists the seeded fake musicians', async () => {
    setupLocalData();
    expect(await valueOf(repo().listCandidates())).toEqual(fakes);
  });

  it('returns the demo viewer until one is saved', async () => {
    setupLocalData();
    expect(await valueOf(repo().getViewer())).toEqual(DEMO_VIEWER);
  });

  it('persists the saved viewer across reloads', async () => {
    const storage = setupLocalData();
    const edited = { ...DEMO_VIEWER, name: 'Rafa' };
    await valueOf(repo().saveViewer(edited));

    setupLocalData(storage);
    expect(await valueOf(repo().getViewer())).toEqual(edited);
  });
});

describe('LocalSwipesRepository', () => {
  const repo = () => TestBed.inject(SwipesRepository);

  beforeEach(() => setupLocalData());

  it('matches when liking someone who likes back', async () => {
    const { match } = await valueOf(repo().swipe(likesBack.id, 'like'));
    expect(match?.profileId).toBe(likesBack.id);
    expect(await valueOf(repo().listMatches())).toEqual([match]);
  });

  it('does not match when the other side would not like back', async () => {
    const { match } = await valueOf(repo().swipe(doesNotLikeBack.id, 'like'));
    expect(match).toBeNull();
    expect(await valueOf(repo().listMatches())).toEqual([]);
  });

  it('never matches on a pass, even with someone compatible', async () => {
    expect(
      (await valueOf(repo().swipe(likesBack.id, 'pass'))).match,
    ).toBeNull();
  });

  it('records every swipe', async () => {
    await valueOf(repo().swipe(likesBack.id, 'like'));
    await valueOf(repo().swipe(doesNotLikeBack.id, 'pass'));
    const swipes = await valueOf(repo().listSwipes());
    expect(
      swipes.map(({ targetId, decision }) => [targetId, decision]),
    ).toEqual([
      [likesBack.id, 'like'],
      [doesNotLikeBack.id, 'pass'],
    ]);
  });

  it('is idempotent: a second swipe on the same profile changes nothing', async () => {
    const first = await valueOf(repo().swipe(likesBack.id, 'like'));
    const second = await valueOf(repo().swipe(likesBack.id, 'pass'));
    expect(second).toEqual(first);
    expect(await valueOf(repo().listSwipes())).toHaveLength(1);
    expect(await valueOf(repo().listMatches())).toHaveLength(1);
  });

  it('rejects an unknown profile', async () => {
    await expect(valueOf(repo().swipe('nobody', 'like'))).rejects.toThrow(
      'Unknown profile: nobody',
    );
  });

  it('persists swipes and matches across reloads', async () => {
    const storage = setupLocalData();
    await valueOf(repo().swipe(likesBack.id, 'like'));

    setupLocalData(storage);
    expect(await valueOf(repo().listSwipes())).toHaveLength(1);
    expect(await valueOf(repo().listMatches())).toHaveLength(1);
  });
});
