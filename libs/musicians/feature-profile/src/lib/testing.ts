import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  createMemoryStorage,
  DEMO_VIEWER,
  KEY_VALUE_STORAGE,
  LOCAL_LATENCY_MS,
  ProfilesRepository,
  provideLocalMusiciansData,
  ViewerStore,
} from '@gigmate/musicians/data-access';
import { firstValueFrom } from 'rxjs';

@Component({ template: '' })
class Blank {}

/**
 * Specs only: local data with no latency, a router with a blank deck at '/',
 * and the viewer already loaded, as the route guard would leave it.
 */
export async function setupProfileFeature(options: { onboarded: boolean }) {
  TestBed.configureTestingModule({
    providers: [
      provideLocalMusiciansData(),
      { provide: KEY_VALUE_STORAGE, useValue: createMemoryStorage() },
      { provide: LOCAL_LATENCY_MS, useValue: 0 },
      provideRouter([{ path: '', component: Blank }]),
    ],
  });
  if (options.onboarded) {
    await firstValueFrom(
      TestBed.inject(ProfilesRepository).saveViewer(DEMO_VIEWER),
    );
  }
  await firstValueFrom(TestBed.inject(ViewerStore).ensureLoaded());
}

/** Small DOM helpers that find controls the way people do: by their text. */
export function domHelpers(root: HTMLElement, render: () => void) {
  const clean = (text: string | null | undefined) =>
    (text ?? '').replace(/\s+/g, ' ').trim();
  const button = (name: string) => {
    const found = Array.from(
      root.querySelectorAll<HTMLElement>('button, a'),
    ).find(
      (b) => (b.getAttribute('aria-label') ?? clean(b.textContent)) === name,
    );
    if (!found) throw new Error(`No button or link "${name}"`);
    return found;
  };
  /** The control a `<label for>` points to, found by the label's text. */
  const control = <T extends HTMLElement>(label: string) => {
    const found = Array.from(root.querySelectorAll('label')).find((l) =>
      clean(l.textContent).startsWith(label),
    );
    const input = found?.control as T | null | undefined;
    if (!input) throw new Error(`No control labelled "${label}"`);
    return input;
  };
  return {
    clean,
    text: (selector: string) =>
      clean(root.querySelector(selector)?.textContent),
    errors: () =>
      Array.from(root.querySelectorAll('.field-error')).map((e) =>
        clean(e.textContent),
      ),
    click: (name: string) => {
      button(name).click();
      render();
    },
    type: (label: string, value: string) => {
      const input = control<HTMLInputElement>(label);
      input.value = value;
      input.dispatchEvent(new Event('input'));
      render();
    },
    choose: (label: string, value: string) => {
      const select = control<HTMLSelectElement>(label);
      select.value = value;
      select.dispatchEvent(new Event('change'));
      select.dispatchEvent(new Event('input'));
      render();
    },
    has: (name: string) => {
      try {
        button(name);
        return true;
      } catch {
        return false;
      }
    },
  };
}
