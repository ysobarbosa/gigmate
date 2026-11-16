import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideLocalMusiciansData } from '@gigmate/musicians/data-access';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Route params (like /matches/:id) arrive as component inputs.
    provideRouter(appRoutes, withComponentInputBinding()),
    // Data source: local fake data. Swap this line to change backends.
    provideLocalMusiciansData(),
  ],
};
