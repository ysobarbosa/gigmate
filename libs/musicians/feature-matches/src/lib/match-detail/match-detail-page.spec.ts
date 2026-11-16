import { TestBed } from '@angular/core/testing';
import {
  generateFakeMusicians,
  type MusicianProfile,
} from '@gigmate/musicians/domain';
import { clean, setupMatches } from '../testing';
import { MatchDetailPage } from './match-detail-page';

const [fake] = generateFakeMusicians();

/** A non-fake profile, as a real user would have. */
const real: MusicianProfile = {
  ...fake,
  id: 'user-7',
  name: 'Lia Moura',
  contact: { kind: 'whatsapp', value: '5511987654321' },
  samples: ['https://youtu.be/abc', 'https://open.spotify.com/artist/1'],
};

function render(id: string) {
  const fixture = TestBed.createComponent(MatchDetailPage);
  fixture.componentRef.setInput('id', id);
  fixture.detectChanges();
  const el = fixture.nativeElement as HTMLElement;
  const section = (title: string) =>
    Array.from(el.querySelectorAll('section')).find(
      (s) => clean(s.querySelector('h2')?.textContent) === title,
    )!;
  return { el, section };
}

describe('MatchDetailPage', () => {
  it('unlocks the contact a real person shared, opening the right app', () => {
    setupMatches([real]);
    const { el, section } = render(real.id);
    expect(clean(el.querySelector('.since')?.textContent)).toBe(
      'Vocês deram match em 16 de novembro.',
    );
    const call = section('Contato').querySelector('a')!;
    expect(clean(call.textContent)).toBe('Chamar no WhatsApp');
    expect(call.getAttribute('href')).toBe('https://wa.me/5511987654321');
    expect(call.getAttribute('target')).toBe('_blank');
    expect(call.getAttribute('rel')).toBe('noopener noreferrer');
    expect(
      Array.from(section('Amostras').querySelectorAll('a')).map((a) =>
        a.getAttribute('href'),
      ),
    ).toEqual(real.samples);
  });

  it('opens e-mail in the mail app, not a new tab', () => {
    setupMatches([
      { ...real, contact: { kind: 'email', value: 'lia@exemplo.com' } },
    ]);
    const link = render(real.id).section('Contato').querySelector('a')!;
    expect(link.getAttribute('href')).toBe('mailto:lia@exemplo.com');
    expect(link.hasAttribute('target')).toBe(false);
  });

  it('explains that a fake profile has no contact or samples', () => {
    setupMatches([fake]);
    const { section } = render(fake.id);
    expect(clean(section('Contato').textContent)).toContain(
      'Este é um perfil fictício da demonstração.',
    );
    expect(section('Contato').querySelector('a')).toBeNull();
    expect(clean(section('Amostras').querySelector('p')?.textContent)).toBe(
      'Sem amostras ainda.',
    );
  });

  it('says so when a real person shared no contact', () => {
    setupMatches([{ ...real, contact: undefined }]);
    expect(
      clean(render(real.id).section('Contato').querySelector('p')?.textContent),
    ).toBe('Essa pessoa não compartilhou um contato.');
  });

  it('handles a link to someone who is not a match', () => {
    setupMatches([real]);
    const { el } = render('fake-999');
    expect(clean(el.querySelector('.state p')?.textContent)).toBe(
      'Match não encontrado.',
    );
    expect(el.querySelector('gm-musician-card')).toBeNull();
  });
});
