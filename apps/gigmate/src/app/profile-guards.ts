import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { ViewerStore } from '@gigmate/musicians/data-access';
import { map } from 'rxjs';

/**
 * Guards live in the app, not in the feature libs: importing them statically
 * from a feature's barrel could pull its pages into the initial bundle.
 */

/** The deck needs a profile: without one, go to the welcome page. */
export const requireProfile: CanActivateFn = () => {
  const router = inject(Router);
  return inject(ViewerStore)
    .ensureLoaded()
    .pipe(map((viewer) => (viewer ? true : router.parseUrl('/boas-vindas'))));
};

/** Welcome is for first visits: someone with a profile goes to the deck. */
export const redirectIfProfile: CanActivateFn = () => {
  const router = inject(Router);
  return inject(ViewerStore)
    .ensureLoaded()
    .pipe(map((viewer) => (viewer ? router.parseUrl('/') : true)));
};

/** The editor works with or without a profile, but must know which. */
export const viewerLoaded: CanActivateFn = () =>
  inject(ViewerStore)
    .ensureLoaded()
    .pipe(map(() => true));
