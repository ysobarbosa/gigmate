import { InjectionToken } from '@angular/core';
import { delay, type MonoTypeOperatorFunction, pipe } from 'rxjs';

/**
 * Artificial latency for the local adapters, so loading states are real in the
 * demo instead of flashing by. Tests set it to 0, which keeps everything
 * synchronous (no timers, no fakeAsync: the test env is zoneless).
 */
export const LOCAL_LATENCY_MS = new InjectionToken<number>('LOCAL_LATENCY_MS', {
  providedIn: 'root',
  factory: () => 300,
});

export function withLatency<T>(ms: number): MonoTypeOperatorFunction<T> {
  return ms > 0 ? delay(ms) : pipe();
}

/** Versioned keys: a future shape change bumps the version instead of misreading old data. */
export const STORAGE_KEYS = {
  viewer: 'gigmate:v1:viewer',
  swipes: 'gigmate:v1:swipes',
  matches: 'gigmate:v1:matches',
} as const;
