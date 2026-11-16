import { Component, computed, input } from '@angular/core';

/** Initials on a color derived from the id: stable per person, no photo needed. */
@Component({
  selector: 'gm-avatar',
  template: `{{ initials() }}`,
  styleUrl: './avatar.scss',
  host: {
    'aria-hidden': 'true',
    '[style.--gm-avatar-hue]': 'hue()',
  },
})
export class Avatar {
  readonly id = input.required<string>();
  readonly name = input.required<string>();

  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );

  protected readonly hue = computed(() => hashHue(this.id()));
}

/** Small string hash (djb2) mapped to a hue in [0, 360). */
export function hashHue(text: string): number {
  let hash = 5381;
  for (const char of text) hash = (hash * 33) ^ char.charCodeAt(0);
  return Math.abs(hash) % 360;
}
