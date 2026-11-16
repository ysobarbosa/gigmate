import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    // Lazy: the deck (and its libs) is its own chunk, out of the initial bundle.
    loadComponent: () =>
      import('@gigmate/musicians/feature-deck').then((m) => m.DeckPage),
  },
];
