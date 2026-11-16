import { Component, inject, type OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchesStore } from '@gigmate/musicians/data-access';
import { mainInstrument } from '@gigmate/musicians/domain';
import { Avatar, INSTRUMENT_LABELS } from '@gigmate/musicians/ui';
import { formatMatchDate } from '../format';

/** Everyone the viewer matched with, most recent first. */
@Component({
  selector: 'gm-matches-page',
  imports: [RouterLink, Avatar],
  templateUrl: './matches-page.html',
  styleUrl: './matches-page.scss',
})
export class MatchesPage implements OnInit {
  protected readonly store = inject(MatchesStore);
  protected readonly date = formatMatchDate;
  protected readonly instrument = (p: Parameters<typeof mainInstrument>[0]) =>
    INSTRUMENT_LABELS[mainInstrument(p)];

  ngOnInit(): void {
    this.store.load();
  }
}
