import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  createMemoryStorage,
  DEMO_VIEWER,
  KEY_VALUE_STORAGE,
  LOCAL_LATENCY_MS,
  ProfilesRepository,
  provideLocalMusiciansData,
} from '@gigmate/musicians/data-access';
import { firstValueFrom } from 'rxjs';
import {
  redirectIfProfile,
  requireProfile,
  viewerLoaded,
} from './profile-guards';

@Component({ template: 'page' })
class Page {}

async function navigate(url: string, onboarded: boolean): Promise<string> {
  TestBed.configureTestingModule({
    providers: [
      provideLocalMusiciansData(),
      { provide: KEY_VALUE_STORAGE, useValue: createMemoryStorage() },
      { provide: LOCAL_LATENCY_MS, useValue: 0 },
      provideRouter([
        {
          path: '',
          pathMatch: 'full',
          canActivate: [requireProfile],
          component: Page,
        },
        {
          path: 'boas-vindas',
          canActivate: [redirectIfProfile],
          component: Page,
        },
        { path: 'perfil', canActivate: [viewerLoaded], component: Page },
      ]),
    ],
  });
  if (onboarded) {
    await firstValueFrom(
      TestBed.inject(ProfilesRepository).saveViewer(DEMO_VIEWER),
    );
  }
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url);
  return TestBed.inject(Router).url;
}

describe('profile guards', () => {
  it('send a first-time visitor from the deck to the welcome page', async () => {
    expect(await navigate('/', false)).toBe('/boas-vindas');
  });

  it('let someone with a profile into the deck', async () => {
    expect(await navigate('/', true)).toBe('/');
  });

  it('skip the welcome page for someone with a profile', async () => {
    expect(await navigate('/boas-vindas', true)).toBe('/');
  });

  it('show the welcome page on a first visit', async () => {
    expect(await navigate('/boas-vindas', false)).toBe('/boas-vindas');
  });

  it.each([false, true])(
    'open the editor (onboarded: %p)',
    async (onboarded) => {
      expect(await navigate('/perfil', onboarded)).toBe('/perfil');
    },
  );
});
