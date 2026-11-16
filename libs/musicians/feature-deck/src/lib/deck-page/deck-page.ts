import {
  Component,
  computed,
  inject,
  type OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { DeckStore } from '@gigmate/musicians/data-access';
import type { DeckFilters } from '@gigmate/musicians/domain';
import {
  MusicianCard,
  type SwipeDirection,
  Swipeable,
} from '@gigmate/musicians/ui';
import { FiltersPanel } from '../filters-panel/filters-panel';
import { MatchDialog } from '../match-dialog/match-dialog';

/** The swipe deck: one card on top, the next one peeking behind it. */
@Component({
  selector: 'gm-deck-page',
  imports: [MusicianCard, Swipeable, FiltersPanel, MatchDialog],
  templateUrl: './deck-page.html',
  styleUrl: './deck-page.scss',
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class DeckPage implements OnInit {
  protected readonly store = inject(DeckStore);
  protected readonly filtersOpen = signal(false);

  /** The top card as a one-item list: `@for ... track id` gives each card a fresh swipeable. */
  protected readonly top = computed(() => {
    const card = this.store.current();
    return card ? [card] : [];
  });
  protected readonly next = computed(() => this.store.cards()[1] ?? null);

  private readonly swipeable = viewChild(Swipeable);

  protected readonly activeFilters = computed(() => {
    const f = this.store.filters();
    if (!f) return 0;
    return [
      f.instruments.length,
      f.genres.length,
      f.goals.length,
      f.sharedAvailabilityOnly,
    ].filter(Boolean).length;
  });

  protected readonly filtersLabel = computed(() => {
    const n = this.activeFilters();
    return n ? `Filtros, ${n} ${n === 1 ? 'ativo' : 'ativos'}` : 'Filtros';
  });

  ngOnInit(): void {
    this.store.load();
  }

  /** Buttons and keyboard go through the card, so they animate like a drag. */
  protected swipe(direction: SwipeDirection): void {
    this.swipeable()?.fling(direction);
  }

  protected decide(id: string, direction: SwipeDirection): void {
    if (direction === 'like') this.store.like(id);
    else this.store.pass(id);
  }

  protected updateFilters(filters: DeckFilters): void {
    this.store.setFilters(filters);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.filtersOpen() || this.store.lastMatch()) return;
    // The target can be the document itself (nothing focused), which has no closest().
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable]')
    ) {
      return;
    }
    if (event.key === 'ArrowRight') this.swipe('like');
    else if (event.key === 'ArrowLeft') this.swipe('pass');
    else return;
    event.preventDefault();
  }
}
