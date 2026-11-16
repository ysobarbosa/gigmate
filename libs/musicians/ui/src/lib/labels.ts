import {
  CONTACT_KINDS,
  type ContactKind,
  type SamplePlatform,
  type AvailabilitySlot,
  type Genre,
  GENRES,
  type Goal,
  GOALS,
  type Instrument,
  INSTRUMENTS,
  type Shift,
  SHIFTS,
  type SkillLevel,
  type Weekday,
  WEEKDAYS,
} from '@gigmate/musicians/domain';

/**
 * Portuguese labels for the domain slugs. `Record<Slug, string>` makes the
 * compiler demand a label for every value: adding a genre to the domain
 * without a label here is a build error.
 */
export const INSTRUMENT_LABELS: Record<Instrument, string> = {
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

export const GENRE_LABELS: Record<Genre, string> = {
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

export const GOAL_LABELS: Record<Goal, string> = {
  'original-band': 'Banda autoral',
  covers: 'Covers',
  'paid-gigs': 'Shows pagos',
  jam: 'Jam',
  recording: 'Gravação',
};

export const LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'iniciante',
  intermediate: 'intermediário',
  advanced: 'avançado',
  professional: 'profissional',
};

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Seg',
  tue: 'Ter',
  wed: 'Qua',
  thu: 'Qui',
  fri: 'Sex',
  sat: 'Sáb',
  sun: 'Dom',
};

const SHIFT_PHRASES: Record<Shift, string> = {
  morning: 'de manhã',
  afternoon: 'à tarde',
  night: 'à noite',
};

export interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
}

const toOptions = <T extends string>(
  values: readonly T[],
  labels: Record<T, string>,
): readonly Option<T>[] =>
  values.map((value) => ({ value, label: labels[value] }));

export const CONTACT_LABELS: Record<ContactKind, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  email: 'E-mail',
};

export const SAMPLE_PLATFORM_LABELS: Record<SamplePlatform, string> = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  instagram: 'Instagram',
  bandcamp: 'Bandcamp',
};

export const CONTACT_OPTIONS = toOptions(CONTACT_KINDS, CONTACT_LABELS);
export const INSTRUMENT_OPTIONS = toOptions(INSTRUMENTS, INSTRUMENT_LABELS);
export const GENRE_OPTIONS = toOptions(GENRES, GENRE_LABELS);
export const GOAL_OPTIONS = toOptions(GOALS, GOAL_LABELS);

/** "Ter e Qui à noite · Sáb à tarde": days grouped by shift, in week order. */
export function availabilitySummary(
  slots: readonly AvailabilitySlot[],
): string {
  return SHIFTS.map((shift) => {
    const days = WEEKDAYS.filter((day) => slots.includes(`${day}-${shift}`));
    return days.length
      ? `${joinPt(days.map((d) => WEEKDAY_LABELS[d]))} ${SHIFT_PHRASES[shift]}`
      : '';
  })
    .filter(Boolean)
    .join(' · ');
}

/** ["a", "b", "c"] → "a, b e c". */
export function joinPt(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}
