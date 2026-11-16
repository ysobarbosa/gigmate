import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import type { MusicianProfile } from '@gigmate/musicians/domain';
import { Avatar, INSTRUMENT_LABELS } from '@gigmate/musicians/ui';

@Component({
  selector: 'gm-match-dialog',
  imports: [Avatar],
  template: `
    <div class="backdrop"></div>
    <section
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      aria-describedby="match-text"
    >
      <gm-avatar [id]="match().id" [name]="match().name" />
      <h2 id="match-title">Deu match!</h2>
      <p id="match-text">
        {{ match().name }} ({{ instrument() }}) também curtiu você.
      </p>
      <div class="actions">
        <button type="button" (click)="viewProfile.emit()">
          Ver perfil e contato
        </button>
        <button type="button" class="secondary" (click)="closed.emit()">
          Continuar procurando
        </button>
      </div>
    </section>
  `,
  styleUrl: './match-dialog.scss',
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class MatchDialog {
  readonly match = input.required<MusicianProfile>();
  readonly closed = output<void>();
  readonly viewProfile = output<void>();

  protected instrument(): string {
    return INSTRUMENT_LABELS[
      this.match().instruments[0].instrument
    ].toLowerCase();
  }

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    afterNextRender(() => host.nativeElement.querySelector('button')?.focus());
  }
}
