import { TestBed } from '@angular/core/testing';
import { firstValueFrom, type Observable } from 'rxjs';
import { LOCAL_LATENCY_MS } from './local/local-config';
import { provideLocalMusiciansData } from './provide-local-musicians-data';
import {
  createMemoryStorage,
  KEY_VALUE_STORAGE,
  type KeyValueStorage,
} from './storage';

/**
 * Specs only: configures TestBed with the local adapters, memory storage and
 * no latency. Call it again with the same storage to simulate a page reload.
 */
export function setupLocalData(
  storage: KeyValueStorage = createMemoryStorage(),
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
