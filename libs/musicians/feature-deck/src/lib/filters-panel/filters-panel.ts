import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import {
  type DeckFilters,
  MAX_FILTER_RADIUS_KM,
  MIN_FILTER_RADIUS_KM,
} from '@gigmate/musicians/domain';
import {
  ChipSelect,
  GENRE_OPTIONS,
  GOAL_OPTIONS,
  INSTRUMENT_OPTIONS,
} from '@gigmate/musicians/ui';

/**
 * Filters applied live: every change goes straight to the store, and the
 * button shows how many musicians the current filters leave.
 */
@Component({
  selector: 'gm-filters-panel',
  imports: [ChipSelect],
  templateUrl: './filters-panel.html',
  styleUrl: './filters-panel.scss',
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class FiltersPanel {
  readonly filters = input.required<DeckFilters>();
  readonly resultCount = input.required<number>();
  readonly filtersChange = output<DeckFilters>();
  /** Not `reset`: that is a native DOM event name (form reset). */
  readonly resetFilters = output<void>();
  readonly closed = output<void>();

  protected readonly instrumentOptions = INSTRUMENT_OPTIONS;
  protected readonly genreOptions = GENRE_OPTIONS;
  protected readonly goalOptions = GOAL_OPTIONS;
  protected readonly minRadius = MIN_FILTER_RADIUS_KM;
  protected readonly maxRadius = MAX_FILTER_RADIUS_KM;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    // Move focus into the dialog when it opens.
    afterNextRender(() =>
      host.nativeElement.querySelector<HTMLElement>('h2')?.focus(),
    );
  }

  protected update(change: Partial<DeckFilters>): void {
    this.filtersChange.emit({ ...this.filters(), ...change });
  }

  protected numberFrom(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }

  protected checkedFrom(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }
}
