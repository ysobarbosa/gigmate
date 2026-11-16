import type { MusicianProfile } from './musician';

/** Test builder: a complete, valid profile with any field overridden. Specs only. */
export function aMusician(
  overrides: Partial<MusicianProfile> = {},
): MusicianProfile {
  return {
    id: 'm-1',
    name: 'Ana Souza',
    age: 28,
    bio: 'Toco desde os 15.',
    instruments: [{ instrument: 'electric-guitar', level: 'intermediate' }],
    lookingFor: [],
    genresPlayed: ['rock', 'indie'],
    genresLiked: ['blues'],
    goals: ['original-band'],
    availability: ['fri-night', 'sat-afternoon'],
    location: { lat: -23.56, lng: -46.69 },
    neighborhood: 'Pinheiros',
    hasGear: true,
    hasCar: false,
    hasRehearsalSpace: false,
    ...overrides,
  };
}
