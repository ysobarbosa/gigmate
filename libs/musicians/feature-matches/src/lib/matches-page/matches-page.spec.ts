import { TestBed } from '@angular/core/testing';
import { generateFakeMusicians } from '@gigmate/musicians/domain';
import { formatMatchDate } from '../format';
import { clean, setupMatches } from '../testing';
import { MatchesPage } from './matches-page';

const [debora] = generateFakeMusicians().filter(
  (m) => m.name === 'Débora Ribeiro',
);

function render() {
  const fixture = TestBed.createComponent(MatchesPage);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('MatchesPage', () => {
  it('invites to keep swiping when there is no match', () => {
    setupMatches([]);
    const el = render();
    expect(clean(el.querySelector('.state p')?.textContent)).toBe(
      'Nenhum match ainda.',
    );
    expect(el.querySelector('a.button')?.getAttribute('href')).toBe('/');
  });

  it('lists each match with a link to its detail', () => {
    setupMatches([debora]);
    const el = render();
    const row = el.querySelector<HTMLAnchorElement>('a.row')!;
    expect(row.getAttribute('href')).toBe(`/matches/${debora.id}`);
    expect(clean(row.querySelector('strong')?.textContent)).toBe(
      'Débora Ribeiro',
    );
    expect(clean(row.querySelector('small')?.textContent)).toBe(
      `Match em ${formatMatchDate('2026-11-16T12:00:00.000Z')}`,
    );
    expect(row.querySelector('.score')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
    expect(clean(row.querySelector('.visually-hidden')?.textContent)).toMatch(
      /^Compatibilidade \d+ de 100$/,
    );
  });
});

describe('formatMatchDate', () => {
  it('writes day and month in Portuguese', () => {
    expect(formatMatchDate('2026-11-16T12:00:00.000Z')).toBe('16 de novembro');
  });
});
