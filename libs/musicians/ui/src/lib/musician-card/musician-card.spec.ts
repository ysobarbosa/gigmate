import { TestBed } from '@angular/core/testing';
import { compatibility, type MusicianProfile } from '@gigmate/musicians/domain';
import { MusicianCard } from './musician-card';

const drummer: MusicianProfile = {
  id: 'fake-012',
  name: 'Débora Ribeiro',
  age: 31,
  bio: 'Pontual, levo meu equipamento.',
  instruments: [
    { instrument: 'drums', level: 'advanced' },
    { instrument: 'percussion', level: 'intermediate' },
  ],
  lookingFor: ['electric-guitar', 'bass'],
  genresPlayed: ['rock', 'forro'],
  genresLiked: ['jazz', 'soul'],
  goals: ['original-band', 'jam'],
  availability: ['tue-night', 'thu-night', 'sat-afternoon'],
  location: { lat: -23.56, lng: -46.65 },
  neighborhood: 'Bela Vista',
  hasGear: true,
  hasCar: false,
  hasRehearsalSpace: true,
};

function render(withCompatibility: boolean) {
  const fixture = TestBed.createComponent(MusicianCard);
  fixture.componentRef.setInput('profile', drummer);
  if (withCompatibility) {
    fixture.componentRef.setInput(
      'compatibility',
      compatibility(drummer, {
        ...drummer,
        id: 'viewer',
        location: { lat: -23.56, lng: -46.69 },
      }),
    );
  }
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement;
  const clean = (node: Element | null) =>
    node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  // textContent glues siblings ("TocaRock"): read each term/value pair instead.
  const facts = Object.fromEntries(
    Array.from(el.querySelectorAll('dt')).map((dt) => {
      const dd = dt.nextElementSibling;
      const items = Array.from(dd?.querySelectorAll('li') ?? []).map(clean);
      return [clean(dt), items.length ? items.join(', ') : clean(dd)];
    }),
  );
  return { el, clean, facts, text: clean(el) };
}

describe('MusicianCard', () => {
  it('shows the profile with Portuguese labels', () => {
    const { el, clean, facts, text } = render(false);
    expect(clean(el.querySelector('h2'))).toBe('Débora Ribeiro, 31');
    expect(clean(el.querySelector('.instruments'))).toBe(
      'Bateria (avançado) · Percussão (intermediário)',
    );
    expect(facts).toEqual({
      Toca: 'Rock, Forró',
      'Também curte': 'Jazz e Soul',
      Quer: 'Banda autoral, Jam',
      Livre: 'Sáb à tarde · Ter e Qui à noite',
      Procura: 'guitarra e baixo',
      Extras: 'Equipamento próprio · Lugar para ensaiar',
    });
    expect(text).not.toContain('Tem carro');
    expect(el.querySelector('gm-avatar')?.textContent?.trim()).toBe('DR');
  });

  it('hides score, distance and reasons without a compatibility', () => {
    const { el, text } = render(false);
    expect(el.querySelector('.score')).toBeNull();
    expect(el.querySelector('.why')).toBeNull();
    expect(text).not.toContain('km');
  });

  it('shows score, rounded distance and the reasons with one', () => {
    const { el, clean } = render(true);
    expect(el.querySelector('.score')?.getAttribute('aria-label')).toMatch(
      /^Compatibilidade \d+ de 100$/,
    );
    expect(clean(el.querySelector('.place'))).toBe('Bela Vista · ~4 km');
    const reasons = Array.from(el.querySelectorAll('.reason')).map((r) =>
      Array.from(r.children).map(clean).filter(Boolean).join(' '),
    );
    expect(reasons).toEqual([
      'Gêneros 100%',
      'Horários 100%',
      'Objetivos 100%',
      expect.stringMatching(/^Distância \d+%$/),
    ]);
  });
});
