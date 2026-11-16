import { Component, inject, type OnInit } from '@angular/core';
import { DeckStore } from '@gigmate/musicians/data-access';
import {
  displayDistanceKm,
  type Genre,
  type Instrument,
  mainInstrument,
} from '@gigmate/musicians/domain';

// Temporary labels: they move to a UI lib with the real deck (phase 4).
const INSTRUMENT_LABELS: Record<Instrument, string> = {
  drums: 'Bateria',
  bass: 'Baixo',
  'electric-guitar': 'Guitarra',
  'acoustic-guitar': 'Violão',
  vocals: 'Voz',
  keys: 'Teclado',
  percussion: 'Percussão',
  sax: 'Sax',
  trumpet: 'Trompete',
  violin: 'Violino',
};

const GENRE_LABELS: Record<Genre, string> = {
  rock: 'Rock',
  indie: 'Indie',
  punk: 'Punk',
  metal: 'Metal',
  blues: 'Blues',
  jazz: 'Jazz',
  soul: 'Soul',
  mpb: 'MPB',
  samba: 'Samba',
  pagode: 'Pagode',
  forro: 'Forró',
  sertanejo: 'Sertanejo',
  pop: 'Pop',
  funk: 'Funk',
  'hip-hop': 'Hip-hop',
  reggae: 'Reggae',
  electronic: 'Eletrônica',
  gospel: 'Gospel',
};

/** Temporary ranked list to exercise the data layer; phase 4 turns it into a swipe deck. */
@Component({
  selector: 'gm-deck-page',
  templateUrl: './deck-page.html',
  styleUrl: './deck-page.scss',
})
export class DeckPage implements OnInit {
  protected readonly store = inject(DeckStore);
  protected readonly mainInstrument = mainInstrument;
  protected readonly displayDistanceKm = displayDistanceKm;
  protected readonly instrumentLabel = (i: Instrument) => INSTRUMENT_LABELS[i];
  protected readonly genreLabels = (genres: readonly Genre[]) =>
    genres.map((g) => GENRE_LABELS[g]).join(', ');

  ngOnInit(): void {
    this.store.load();
  }
}
