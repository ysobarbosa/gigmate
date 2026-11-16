import { generateFakeMusicians } from './fake/fake-musicians';
import {
  NEIGHBORHOOD_NAMES,
  NEIGHBORHOODS,
  neighborhoodLocation,
} from './neighborhoods';

describe('neighborhoods', () => {
  it('lists every neighborhood once, alphabetically (pt-BR)', () => {
    expect(NEIGHBORHOOD_NAMES).toHaveLength(NEIGHBORHOODS.length);
    expect(new Set(NEIGHBORHOOD_NAMES).size).toBe(NEIGHBORHOODS.length);
    expect(NEIGHBORHOOD_NAMES[0]).toBe('Barra Funda');
    expect(NEIGHBORHOOD_NAMES.at(-1)).toBe('Vila Mariana');
  });

  it('stores the rounded neighborhood center, not an address', () => {
    expect(neighborhoodLocation('Pinheiros')).toEqual({
      lat: -23.57,
      lng: -46.69,
    });
  });

  it('returns null for an unknown neighborhood', () => {
    expect(neighborhoodLocation('Copacabana')).toBeNull();
  });

  it('did not change the fake data when the list moved here', () => {
    // Seed-42 profiles seen in the app before the move.
    const byId = new Map(generateFakeMusicians().map((m) => [m.id, m]));
    expect(
      ['fake-002', 'fake-012', 'fake-026'].map((id) => {
        const m = byId.get(id)!;
        return `${m.name} · ${m.neighborhood}`;
      }),
    ).toEqual([
      'Lucas Santos · Barra Funda',
      'Débora Ribeiro · Bela Vista',
      'Pedro Campos · Pinheiros',
    ]);
  });
});
