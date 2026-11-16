import {
  max,
  maxLength,
  min,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  type ContactKind,
  MAX_SAMPLES,
  normalizeContact,
  parseSampleLines,
  PROFILE_LIMITS,
  samplePlatform,
} from '@gigmate/musicians/domain';
import type { ProfileDraft } from './profile-draft';

const { nameMaxLength, bioMaxLength, minAge, maxAge } = PROFILE_LIMITS;

const CONTACT_ERRORS: Record<ContactKind, string> = {
  whatsapp: 'Use um celular com DDD, como (11) 98765-4321.',
  instagram: 'Use só letras, números, ponto e _, como @seu.perfil.',
  email: 'Confira o e-mail, como nome@exemplo.com.',
};

/** Validation rules for the profile form (Signal Forms schema). */
export const profileSchema = schema<ProfileDraft>((p) => {
  required(p.name, { message: 'Como você quer ser chamado?' });
  maxLength(p.name, nameMaxLength, {
    message: `Use até ${nameMaxLength} caracteres.`,
  });

  required(p.age, { message: 'Informe sua idade.' });
  min(p.age, minAge, {
    message: `O Gigmate é para quem tem ${minAge} anos ou mais.`,
  });
  max(p.age, maxAge, { message: `Confira a idade: até ${maxAge}.` });

  required(p.neighborhood, { message: 'Escolha seu bairro.' });
  maxLength(p.bio, bioMaxLength, {
    message: `Use até ${bioMaxLength} caracteres.`,
  });

  required(p.mainInstrument, {
    message: 'Escolha seu instrumento principal.',
  });
  // Cross-field rule: valueOf reads another field of the same form.
  validate(p.secondInstrument, ({ value, valueOf }) =>
    value() !== '' && value() === valueOf(p.mainInstrument)
      ? {
          kind: 'sameInstrument',
          message: 'Escolha um instrumento diferente do principal.',
        }
      : undefined,
  );

  minLength(p.genresPlayed, 1, {
    message: 'Escolha pelo menos um gênero que você toca.',
  });
  minLength(p.goals, 1, { message: 'Escolha pelo menos um objetivo.' });
  minLength(p.availability, 1, {
    message: 'Marque pelo menos um horário livre.',
  });

  // Contact is optional, but the value must match the chosen kind.
  validate(p.contactValue, ({ value, valueOf }) => {
    const kind = valueOf(p.contactKind);
    if (!kind) {
      return value().trim()
        ? { kind: 'contactKind', message: 'Escolha onde te encontrar.' }
        : undefined;
    }
    if (!value().trim()) {
      return {
        kind: 'required',
        message: 'Preencha o contato ou escolha "Não mostrar".',
      };
    }
    return normalizeContact(kind, value())
      ? undefined
      : { kind: 'contact', message: CONTACT_ERRORS[kind] };
  });

  validate(p.samplesText, ({ value }) => {
    const lines = parseSampleLines(value());
    if (lines.length > MAX_SAMPLES) {
      return { kind: 'tooMany', message: `Use até ${MAX_SAMPLES} links.` };
    }
    const bad = lines.find((line) => samplePlatform(line) === null);
    return bad
      ? {
          kind: 'sample',
          message: `Link não aceito: ${bad}. Use https do YouTube, Spotify, SoundCloud, Instagram ou Bandcamp.`,
        }
      : undefined;
  });
});

export type ProfileField = keyof ProfileDraft;

export interface ProfileStep {
  readonly title: string;
  /** Fields that must be valid before moving past this step. */
  readonly fields: readonly ProfileField[];
}

export const PROFILE_STEPS: readonly ProfileStep[] = [
  { title: 'Sobre você', fields: ['name', 'age', 'neighborhood', 'bio'] },
  {
    title: 'O que você toca',
    fields: [
      'mainInstrument',
      'mainLevel',
      'secondInstrument',
      'secondLevel',
      'lookingFor',
    ],
  },
  { title: 'Sua música', fields: ['genresPlayed', 'genresLiked', 'goals'] },
  {
    title: 'Agenda e estrutura',
    fields: ['availability', 'hasGear', 'hasCar', 'hasRehearsalSpace'],
  },
  {
    title: 'Contato e amostras',
    fields: ['contactKind', 'contactValue', 'samplesText'],
  },
  { title: 'Confira seu perfil', fields: [] },
];
