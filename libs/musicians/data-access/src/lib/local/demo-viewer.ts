import type { MusicianProfile } from '@gigmate/musicians/domain';

/**
 * The profile the app uses until onboarding exists: a rock guitarist looking
 * for a drummer, which is the scenario the app was imagined for.
 */
export const DEMO_VIEWER: MusicianProfile = {
  id: 'viewer',
  name: 'Você',
  age: 30,
  bio: 'Guitarrista procurando baterista para um projeto autoral.',
  instruments: [{ instrument: 'electric-guitar', level: 'advanced' }],
  lookingFor: ['drums'],
  genresPlayed: ['rock', 'indie'],
  genresLiked: ['blues', 'mpb'],
  goals: ['original-band', 'covers'],
  availability: ['tue-night', 'thu-night', 'sat-afternoon'],
  // Rounded Pinheiros center, as onboarding would store it.
  location: { lat: -23.57, lng: -46.69 },
  neighborhood: 'Pinheiros',
  hasGear: true,
  hasCar: false,
  hasRehearsalSpace: false,
};
