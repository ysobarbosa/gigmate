import { Component, input, model } from '@angular/core';
import {
  AVAILABILITY_SLOTS,
  type AvailabilitySlot,
  type Shift,
  SHIFTS,
  type Weekday,
  WEEKDAYS,
} from '@gigmate/musicians/domain';
import { WEEKDAY_LABELS } from '../labels';

const SHIFT_LABELS: Record<Shift, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  night: 'Noite',
};

const SHIFT_PHRASES: Record<Shift, string> = {
  morning: 'de manhã',
  afternoon: 'à tarde',
  night: 'à noite',
};

/**
 * Weekly grid (days × shifts) of toggle buttons. `slots` is a two-way
 * `model()`; it is always kept in grid order, whatever the click order.
 */
@Component({
  selector: 'gm-availability-grid',
  templateUrl: './availability-grid.html',
  styleUrl: './availability-grid.scss',
  host: { role: 'group', '[attr.aria-label]': 'label()' },
})
export class AvailabilityGrid {
  readonly label = input('Horários livres');
  readonly slots = model<readonly AvailabilitySlot[]>([]);

  protected readonly days = WEEKDAYS;
  protected readonly shifts = SHIFTS;
  protected readonly dayLabels = WEEKDAY_LABELS;
  protected readonly shiftLabels = SHIFT_LABELS;

  protected slot(day: Weekday, shift: Shift): AvailabilitySlot {
    return `${day}-${shift}`;
  }

  protected cellLabel(day: Weekday, shift: Shift): string {
    return `${WEEKDAY_LABELS[day]} ${SHIFT_PHRASES[shift]}`;
  }

  protected isOn(day: Weekday, shift: Shift): boolean {
    return this.slots().includes(this.slot(day, shift));
  }

  protected toggle(day: Weekday, shift: Shift): void {
    const target = this.slot(day, shift);
    this.slots.update((current) => {
      const next = new Set(current);
      if (next.has(target)) next.delete(target);
      else next.add(target);
      return AVAILABILITY_SLOTS.filter((s) => next.has(s));
    });
  }
}
