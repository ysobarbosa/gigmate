import { Route } from '@angular/router';
import {
  redirectIfProfile,
  requireProfile,
  viewerLoaded,
} from './profile-guards';

// Every page is lazy: each feature lib is its own chunk.
export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Descobrir músicos · Gigmate',
    canActivate: [requireProfile],
    loadComponent: () =>
      import('@gigmate/musicians/feature-deck').then((m) => m.DeckPage),
  },
  {
    path: 'boas-vindas',
    title: 'Gigmate: encontre músicos perto de você',
    canActivate: [redirectIfProfile],
    loadComponent: () =>
      import('@gigmate/musicians/feature-profile').then((m) => m.WelcomePage),
  },
  {
    path: 'perfil',
    title: 'Meu perfil · Gigmate',
    canActivate: [viewerLoaded],
    loadComponent: () =>
      import('@gigmate/musicians/feature-profile').then(
        (m) => m.ProfileEditorPage,
      ),
  },
  {
    path: 'matches',
    title: 'Seus matches · Gigmate',
    canActivate: [requireProfile],
    loadComponent: () =>
      import('@gigmate/musicians/feature-matches').then((m) => m.MatchesPage),
  },
  {
    path: 'matches/:id',
    title: 'Match · Gigmate',
    canActivate: [requireProfile],
    loadComponent: () =>
      import('@gigmate/musicians/feature-matches').then(
        (m) => m.MatchDetailPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
