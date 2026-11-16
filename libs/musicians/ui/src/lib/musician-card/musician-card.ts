import { Component, computed, input } from '@angular/core';
import {
  type Compatibility,
  displayDistanceKm,
  type MusicianProfile,
} from '@gigmate/musicians/domain';
import { Avatar } from '../avatar/avatar';
import {
  availabilitySummary,
  GENRE_LABELS,
  GOAL_LABELS,
  INSTRUMENT_LABELS,
  joinPt,
  LEVEL_LABELS,
} from '../labels';

/** Presentational card for one musician. Knows nothing about swiping or stores. */
@Component({
  selector: 'gm-musician-card',
  imports: [Avatar],
  templateUrl: './musician-card.html',
  styleUrl: './musician-card.scss',
})
export class MusicianCard {
  readonly profile = input.required<MusicianProfile>();
  /** Optional: without it the card hides the score and the "why" section. */
  readonly compatibility = input<Compatibility | null>(null);

  protected readonly instruments = computed(() =>
    this.profile().instruments.map(
      ({ instrument, level }) =>
        `${INSTRUMENT_LABELS[instrument]} (${LEVEL_LABELS[level]})`,
    ),
  );

  protected readonly genresPlayed = computed(() =>
    this.profile().genresPlayed.map((g) => GENRE_LABELS[g]),
  );

  protected readonly genresLiked = computed(() =>
    joinPt(this.profile().genresLiked.map((g) => GENRE_LABELS[g])),
  );

  protected readonly goals = computed(() =>
    this.profile().goals.map((g) => GOAL_LABELS[g]),
  );

  protected readonly availability = computed(() =>
    availabilitySummary(this.profile().availability),
  );

  protected readonly lookingFor = computed(() =>
    joinPt(
      this.profile().lookingFor.map((i) => INSTRUMENT_LABELS[i].toLowerCase()),
    ),
  );

  protected readonly perks = computed(() => {
    const { hasGear, hasCar, hasRehearsalSpace } = this.profile();
    return [
      hasGear && 'Equipamento próprio',
      hasCar && 'Tem carro',
      hasRehearsalSpace && 'Lugar para ensaiar',
    ].filter((perk): perk is string => Boolean(perk));
  });

  protected readonly distance = computed(() => {
    const km = this.compatibility()?.distanceKm;
    return km === undefined ? null : displayDistanceKm(km);
  });

  protected readonly reasons = computed(() => {
    const breakdown = this.compatibility()?.breakdown;
    if (!breakdown) return [];
    return [
      { label: 'Gêneros', value: breakdown.genres },
      { label: 'Horários', value: breakdown.availability },
      { label: 'Objetivos', value: breakdown.goals },
      { label: 'Distância', value: breakdown.distance },
    ].map((r) => ({ ...r, percent: Math.round(r.value * 100) }));
  });
}
