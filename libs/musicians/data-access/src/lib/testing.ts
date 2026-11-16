import { TestBed } from '@angular/core/testing';
import { firstValueFrom, type Observable } from 'rxjs';
import { DEMO_VIEWER } from './local/demo-viewer';
import { LOCAL_LATENCY_MS, STORAGE_KEYS } from './local/local-config';
import { provideLocalMusiciansData } from './provide-local-musicians-data';
import {
  createMemoryStorage,
  KEY_VALUE_STORAGE,
  type KeyValueStorage,
} from './storage';

/** Memory storage that already has the demo viewer saved (an onboarded user). */
export function storageWithViewer(): KeyValueStorage {
  return createMemoryStorage({
    [STORAGE_KEYS.viewer]: JSON.stringify(DEMO_VIEWER),
  });
}

/**
 * Specs only: configures TestBed with the local adapters, memory storage and
 * no latency. Call it again with the same storage to simulate a page reload.
 * By default the user is onboarded as the demo viewer; pass
 * `createMemoryStorage()` for a first visit.
 */
export function setupLocalData(
  storage: KeyValueStorage = storageWithViewer(),
): KeyValueStorage {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideLocalMusiciansData(),
      { provide: KEY_VALUE_STORAGE, useValue: storage },
      { provide: LOCAL_LATENCY_MS, useValue: 0 },
    ],
  });
  return storage;
}

export const valueOf = <T>(source: Observable<T>): Promise<T> =>
  firstValueFrom(source);
