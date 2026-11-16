import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  createMemoryStorage,
  DEMO_VIEWER,
  KEY_VALUE_STORAGE,
  LOCAL_LATENCY_MS,
  provideLocalMusiciansData,
  ViewerStore,
} from '@gigmate/musicians/data-access';
import { App } from './app';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideLocalMusiciansData(),
        { provide: KEY_VALUE_STORAGE, useValue: createMemoryStorage() },
        { provide: LOCAL_LATENCY_MS, useValue: 0 },
        provideRouter([]),
      ],
    });
  });

  it('renders the brand and no navigation before onboarding', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Gigmate');
    expect(el.querySelector('nav')).toBeNull();
  });

  it('shows the navigation once the viewer has a profile', async () => {
    await TestBed.inject(ViewerStore).save(DEMO_VIEWER);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('nav a'),
    ).map((a) => a.textContent?.trim());
    expect(links).toEqual(['Descobrir', 'Meu perfil']);
  });
});
