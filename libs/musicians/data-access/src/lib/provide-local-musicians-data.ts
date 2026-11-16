import {
  type EnvironmentProviders,
  makeEnvironmentProviders,
} from '@angular/core';
import { LocalProfilesRepository } from './local/local-profiles-repository';
import { LocalSwipesRepository } from './local/local-swipes-repository';
import { ProfilesRepository, SwipesRepository } from './ports';

/**
 * Composition root for the local (no backend) data source. The app calls this
 * once in `app.config.ts`; switching to a real backend means calling another
 * `provide...()` there, with no change to stores or components.
 */
export function provideLocalMusiciansData(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ProfilesRepository, useClass: LocalProfilesRepository },
    { provide: SwipesRepository, useClass: LocalSwipesRepository },
  ]);
}
