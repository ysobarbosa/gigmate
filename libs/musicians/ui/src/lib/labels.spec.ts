import { GENRES, INSTRUMENTS } from '@gigmate/musicians/domain';
import {
  availabilitySummary,
  GENRE_OPTIONS,
  INSTRUMENT_OPTIONS,
  joinPt,
} from './labels';

describe('joinPt', () => {
  it.each([
    [[], ''],
    [['Ter'], 'Ter'],
    [['Ter', 'Qui'], 'Ter e Qui'],
    [['Seg', 'Qua', 'Sex'], 'Seg, Qua e Sex'],
  ])('%p → %p', (items, expected) => {
    expect(joinPt(items)).toBe(expected);
  });
});

describe('availabilitySummary', () => {
  it('groups days by shift, in week order', () => {
    expect(
      availabilitySummary(['thu-night', 'sat-afternoon', 'tue-night']),
    ).toBe('Sáb à tarde · Ter e Qui à noite');
  });

  it('is empty when there is no slot', () => {
    expect(availabilitySummary([])).toBe('');
  });
});

describe('options', () => {
  it('cover every domain value, in domain order', () => {
    expect(INSTRUMENT_OPTIONS.map((o) => o.value)).toEqual(INSTRUMENTS);
    expect(GENRE_OPTIONS.map((o) => o.value)).toEqual(GENRES);
    expect(GENRE_OPTIONS.find((o) => o.value === 'forro')?.label).toBe('Forró');
  });
});
