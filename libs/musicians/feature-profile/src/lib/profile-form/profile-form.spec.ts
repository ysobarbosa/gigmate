import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';
import { DEMO_VIEWER } from '@gigmate/musicians/data-access';
import {
  draftFromProfile,
  emptyDraft,
  type ProfileDraft,
  profileFromDraft,
} from './profile-draft';
import { PROFILE_STEPS, profileSchema } from './profile-form';

const validDraft: ProfileDraft = {
  ...emptyDraft(),
  name: '  Rafa  ',
  age: 29,
  neighborhood: 'Mooca',
  mainInstrument: 'bass',
  secondInstrument: 'vocals',
  lookingFor: ['drums', 'bass'],
  genresPlayed: ['rock'],
  goals: ['jam'],
  availability: ['fri-night'],
};

describe('profile draft', () => {
  it('round-trips a profile', () => {
    expect(profileFromDraft(draftFromProfile(DEMO_VIEWER))).toEqual(
      DEMO_VIEWER,
    );
  });

  it('builds the domain profile from a valid draft', () => {
    const profile = profileFromDraft(validDraft);
    expect(profile.name).toBe('Rafa');
    expect(profile.instruments).toEqual([
      { instrument: 'bass', level: 'intermediate' },
      { instrument: 'vocals', level: 'beginner' },
    ]);
    // Rounded neighborhood center, never an exact point.
    expect(profile.location).toEqual({ lat: -23.56, lng: -46.6 });
    // Drops instruments the person already plays from "looking for".
    expect(profile.lookingFor).toEqual(['drums']);
  });

  it('normalizes the contact and keeps only accepted sample links', () => {
    const profile = profileFromDraft({
      ...validDraft,
      contactKind: 'whatsapp',
      contactValue: '(11) 98765-4321',
      samplesText: 'https://youtu.be/abc\n\nhttps://open.spotify.com/artist/1',
    });
    expect(profile.contact).toEqual({
      kind: 'whatsapp',
      value: '5511987654321',
    });
    expect(profile.samples).toEqual([
      'https://youtu.be/abc',
      'https://open.spotify.com/artist/1',
    ]);
  });

  it('leaves contact and samples out when empty', () => {
    const profile = profileFromDraft(validDraft);
    expect('contact' in profile).toBe(false);
    expect('samples' in profile).toBe(false);
  });

  it('refuses an incomplete draft', () => {
    expect(() => profileFromDraft(emptyDraft())).toThrow(
      'Incomplete profile draft',
    );
  });
});

describe('profileSchema', () => {
  function setup(draft: ProfileDraft) {
    const model = signal(draft);
    const f = TestBed.runInInjectionContext(() => form(model, profileSchema));
    const messages = (field: keyof ProfileDraft) =>
      f[field]()
        .errors()
        .map((e) => e.message);
    return { model, f, messages };
  }

  it('accepts a complete draft', () => {
    expect(setup(validDraft).f().valid()).toBe(true);
  });

  it('explains every missing required answer', () => {
    const { messages } = setup(emptyDraft());
    expect(messages('name')).toEqual(['Como você quer ser chamado?']);
    expect(messages('age')).toEqual(['Informe sua idade.']);
    expect(messages('neighborhood')).toEqual(['Escolha seu bairro.']);
    expect(messages('mainInstrument')).toEqual([
      'Escolha seu instrumento principal.',
    ]);
    expect(messages('genresPlayed')).toEqual([
      'Escolha pelo menos um gênero que você toca.',
    ]);
    expect(messages('goals')).toEqual(['Escolha pelo menos um objetivo.']);
    expect(messages('availability')).toEqual([
      'Marque pelo menos um horário livre.',
    ]);
  });

  it('checks limits', () => {
    const { messages } = setup({
      ...validDraft,
      name: 'x'.repeat(41),
      age: 15,
      bio: 'y'.repeat(161),
    });
    expect(messages('name')).toEqual(['Use até 40 caracteres.']);
    expect(messages('age')).toEqual([
      'O Gigmate é para quem tem 16 anos ou mais.',
    ]);
    expect(messages('bio')).toEqual(['Use até 160 caracteres.']);
  });

  it('rejects a second instrument equal to the main one, and re-checks when the main changes', () => {
    const { model, messages } = setup({
      ...validDraft,
      secondInstrument: 'bass',
    });
    expect(messages('secondInstrument')).toEqual([
      'Escolha um instrumento diferente do principal.',
    ]);
    model.update((d) => ({ ...d, mainInstrument: 'drums' }));
    expect(messages('secondInstrument')).toEqual([]);
  });

  it('accepts no contact at all, but not a value without a kind', () => {
    expect(setup(validDraft).f.contactValue().valid()).toBe(true);
    expect(
      setup({ ...validDraft, contactValue: '@rafa' }).messages('contactValue'),
    ).toEqual(['Escolha onde te encontrar.']);
  });

  it('checks the contact against its kind, and re-checks when the kind changes', () => {
    const { model, messages } = setup({
      ...validDraft,
      contactKind: 'whatsapp',
      contactValue: '@rafa',
    });
    expect(messages('contactValue')).toEqual([
      'Use um celular com DDD, como (11) 98765-4321.',
    ]);
    model.update((d) => ({ ...d, contactKind: 'instagram' }));
    expect(messages('contactValue')).toEqual([]);
  });

  it('accepts up to 3 known sample links and names the bad one', () => {
    const youtube = 'https://youtu.be/abc';
    expect(
      setup({
        ...validDraft,
        samplesText: `${youtube}\n\n${youtube}`,
      }).messages('samplesText'),
    ).toEqual([]);
    expect(
      setup({
        ...validDraft,
        samplesText: [youtube, youtube, youtube, youtube].join('\n'),
      }).messages('samplesText'),
    ).toEqual(['Use até 3 links.']);
    expect(
      setup({
        ...validDraft,
        samplesText: `${youtube}\nhttp://exemplo.com`,
      }).messages('samplesText'),
    ).toEqual([
      'Link não aceito: http://exemplo.com. Use https do YouTube, Spotify, SoundCloud, Instagram ou Bandcamp.',
    ]);
  });

  it('assigns every validated field to exactly one step', () => {
    const fields = PROFILE_STEPS.flatMap((s) => s.fields);
    expect(new Set(fields).size).toBe(fields.length);
    expect([...fields].sort()).toEqual(Object.keys(emptyDraft()).sort());
  });
});
