import { TestBed } from '@angular/core/testing';
import {
  createMemoryStorage,
  DEMO_VIEWER,
  DeckStore,
  KEY_VALUE_STORAGE,
  LOCAL_LATENCY_MS,
  ProfilesRepository,
  provideLocalMusiciansData,
} from '@gigmate/musicians/data-access';
import { wouldLikeBack } from '@gigmate/musicians/domain';
import { FLING_MS } from '@gigmate/musicians/ui';
import { DeckPage } from './deck-page';

function setup() {
  TestBed.configureTestingModule({
    providers: [
      provideLocalMusiciansData(),
      { provide: KEY_VALUE_STORAGE, useValue: createMemoryStorage() },
      { provide: LOCAL_LATENCY_MS, useValue: 0 },
    ],
  });
  // An onboarded user (latency 0 keeps the save synchronous).
  TestBed.inject(ProfilesRepository).saveViewer(DEMO_VIEWER).subscribe();
  const fixture = TestBed.createComponent(DeckPage);
  const store = TestBed.inject(DeckStore);
  const el: HTMLElement = fixture.nativeElement;
  fixture.detectChanges();

  const render = () => fixture.detectChanges();
  const text = (selector: string) =>
    el.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const topName = () => text('.top h2');
  /** By accessible name: aria-label first, visible text otherwise. */
  const button = (label: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) =>
        (b.getAttribute('aria-label') ??
          b.textContent?.replace(/\s+/g, ' ').trim()) === label,
    );
  const click = (label: string) => {
    const target = button(label);
    if (!target) throw new Error(`No button "${label}"`);
    target.click();
    render();
  };
  /** Lets the fling animation finish, then renders. */
  const settle = () => {
    jest.advanceTimersByTime(FLING_MS);
    render();
  };
  return { fixture, store, el, render, text, topName, button, click, settle };
}

describe('DeckPage', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('loads on init and shows the best card for the default filters', () => {
    const { store, topName, text } = setup();
    const best = store.current()!;
    expect(best.profile.instruments.map((s) => s.instrument)).toContain(
      'drums',
    );
    expect(topName()).toBe(`${best.profile.name}, ${best.profile.age}`);
    expect(text('.count')).toBe(
      `${store.cards().length} músicos com seus filtros`,
    );
  });

  it('peeks the next card behind the top one, hidden from assistive tech', () => {
    const { el, store } = setup();
    const behind = el.querySelector('gm-musician-card.behind');
    expect(behind?.getAttribute('aria-hidden')).toBe('true');
    expect(behind?.textContent).toContain(store.cards()[1].profile.name);
  });

  it('passes with the button after the card flies off', () => {
    const { store, topName, click, settle } = setup();
    const [first, second] = store.cards();
    click('Passar');
    expect(topName()).toContain(first.profile.name); // still animating
    settle();
    expect(topName()).toContain(second.profile.name);
    expect(store.lastMatch()).toBeNull();
  });

  it('likes with the right arrow key and celebrates a match', () => {
    const { store, el, render, settle, text, click } = setup();
    // Bring someone who likes back to the top of the deck.
    store.setFilters({
      ...store.filters()!,
      instruments: [],
      maxDistanceKm: 30,
    });
    const target = store
      .cards()
      .find((c) => wouldLikeBack(c.profile, DEMO_VIEWER))!;
    while (store.current()!.profile.id !== target.profile.id) {
      store.pass(store.current()!.profile.id);
    }
    render();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    settle();

    const dialog = el.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute('aria-modal')).toBe('true');
    expect(text('#match-title')).toBe('Deu match!');
    expect(text('#match-text')).toContain(target.profile.name);

    click('Continuar procurando');
    expect(el.querySelector('gm-match-dialog')).toBeNull();
  });

  it('ignores arrow keys while the filters are open', () => {
    const { store, click, settle } = setup();
    const top = store.current()!.profile.id;
    click('Filtros, 1 ativo');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    settle();
    expect(store.current()!.profile.id).toBe(top);
  });

  it('applies filters live and shows how many musicians remain', () => {
    const { store, el, click, render } = setup();
    click('Filtros, 1 ativo');
    expect(el.querySelector('gm-filters-panel [role="dialog"]')).not.toBeNull();

    click('Bateria'); // deselect the default instrument
    click('Voz');
    expect(store.filters()!.instruments).toEqual(['vocals']);
    const count = store.cards().length;
    expect(buttonByText(el, `Ver ${count} músicos`)).toBeDefined();

    const range = el.querySelector<HTMLInputElement>('input[type="range"]')!;
    range.value = '3';
    range.dispatchEvent(new Event('input'));
    render();
    expect(store.filters()!.maxDistanceKm).toBe(3);

    click(
      `Ver ${store.cards().length} ${store.cards().length === 1 ? 'músico' : 'músicos'}`,
    );
    expect(el.querySelector('gm-filters-panel')).toBeNull();
  });

  it('suggests widening the filters when nobody is left', () => {
    const { store, text, click } = setup();
    store.setFilters({
      ...store.filters()!,
      instruments: ['trumpet'],
      maxDistanceKm: 1,
    });
    click('Filtros, 1 ativo');
    click('Fechar filtros');

    expect(text('.state')).toContain('Ninguém mais com esses filtros.');
    expect(text('.state')).toContain(
      `${store.hiddenByFilters()} músicos estão fora deles.`,
    );

    click('Restaurar padrão');
    expect(store.filters()!.instruments).toEqual(['drums']);
    expect(store.cards().length).toBeGreaterThan(0);
  });

  it('counts the active filters on the button', () => {
    const { store, text, render, button } = setup();
    expect(text('.badge')).toBe('1'); // instruments: drums
    expect(button('Filtros, 1 ativo')).toBeDefined();
    store.setFilters({
      ...store.filters()!,
      genres: ['rock'],
      sharedAvailabilityOnly: true,
    });
    render();
    expect(text('.badge')).toBe('3');
    expect(button('Filtros, 3 ativos')).toBeDefined();
  });
});

function buttonByText(root: HTMLElement, label: string) {
  return Array.from(root.querySelectorAll('button')).find(
    (b) => b.textContent?.replace(/\s+/g, ' ').trim() === label,
  );
}
