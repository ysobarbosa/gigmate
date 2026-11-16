import { Component, input, model } from '@angular/core';
import type { Option } from '../labels';

/**
 * Multi-select as toggle chips. `selected` is a `model()`, so the parent can
 * bind it two-way: `[(selected)]="..."`. Each chip is a button with
 * `aria-pressed`, which screen readers announce as a toggle.
 */
@Component({
  selector: 'gm-chip-select',
  templateUrl: './chip-select.html',
  styleUrl: './chip-select.scss',
  host: { role: 'group', '[attr.aria-label]': 'label()' },
})
export class ChipSelect<T extends string> {
  readonly label = input.required<string>();
  readonly options = input.required<readonly Option<T>[]>();
  readonly selected = model<readonly T[]>([]);

  protected isSelected(value: T): boolean {
    return this.selected().includes(value);
  }

  protected toggle(value: T): void {
    this.selected.update((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : // Keep the options' order, whatever order the user clicked in.
          this.options()
            .map((o) => o.value)
            .filter((v) => v === value || current.includes(v)),
    );
  }
}
