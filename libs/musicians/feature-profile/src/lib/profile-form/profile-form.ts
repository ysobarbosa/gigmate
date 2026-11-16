import {
  max,
  maxLength,
  min,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { PROFILE_LIMITS } from '@gigmate/musicians/domain';
import type { ProfileDraft } from './profile-draft';

const { nameMaxLength, bioMaxLength, minAge, maxAge } = PROFILE_LIMITS;

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
  { title: 'Confira seu perfil', fields: [] },
];
