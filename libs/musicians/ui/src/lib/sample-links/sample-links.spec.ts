import { TestBed } from '@angular/core/testing';
import { SampleLinks } from './sample-links';

describe('SampleLinks', () => {
  function render(samples: readonly string[]) {
    const fixture = TestBed.createComponent(SampleLinks);
    fixture.componentRef.setInput('samples', samples);
    fixture.detectChanges();
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('a'),
    );
  }

  it('renders known links, opening safely in a new tab', () => {
    const [link] = render(['https://youtu.be/abc']);
    expect(link.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Ouvir no YouTube (abre em outra aba)',
    );
    expect(link.getAttribute('href')).toBe('https://youtu.be/abc');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('drops anything the domain does not accept, even if it was stored', () => {
    expect(
      render([
        'javascript:alert(1)',
        'http://youtu.be/abc',
        'https://example.com',
      ]),
    ).toEqual([]);
  });

  it('renders nothing without samples', () => {
    expect(render([])).toEqual([]);
  });
});
