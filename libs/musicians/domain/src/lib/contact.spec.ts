import { contactHref, normalizeContact, visibleContact } from './contact';
import { parseSampleLines, samplePlatform } from './samples';

describe('normalizeContact', () => {
  it.each([
    ['(11) 98765-4321', '5511987654321'],
    ['11 3456-7890', '551134567890'],
    ['+55 11 98765-4321', '5511987654321'],
  ])('accepts the WhatsApp number %p as %p', (raw, expected) => {
    expect(normalizeContact('whatsapp', raw)).toBe(expected);
  });

  it.each(['123', '98765-4321', '+1 415 555 0100 99'])(
    'rejects the WhatsApp number %p',
    (raw) => {
      expect(normalizeContact('whatsapp', raw)).toBeNull();
    },
  );

  it('accepts Instagram handles with or without @, lowercased', () => {
    expect(normalizeContact('instagram', ' @Rafa.Baixo_ ')).toBe('rafa.baixo_');
    expect(normalizeContact('instagram', 'nome com espaço')).toBeNull();
    expect(normalizeContact('instagram', '@')).toBeNull();
  });

  it('accepts e-mails, lowercased', () => {
    expect(normalizeContact('email', ' Rafa@Exemplo.com ')).toBe(
      'rafa@exemplo.com',
    );
    expect(normalizeContact('email', 'rafa@exemplo')).toBeNull();
  });
});

describe('contactHref', () => {
  it('opens the right app', () => {
    expect(contactHref({ kind: 'whatsapp', value: '5511987654321' })).toBe(
      'https://wa.me/5511987654321',
    );
    expect(contactHref({ kind: 'instagram', value: 'rafa' })).toBe(
      'https://instagram.com/rafa',
    );
    expect(contactHref({ kind: 'email', value: 'rafa@exemplo.com' })).toBe(
      'mailto:rafa@exemplo.com',
    );
  });
});

describe('visibleContact', () => {
  const profile = { contact: { kind: 'instagram', value: 'rafa' } as const };

  it('shows the contact only after a match', () => {
    expect(visibleContact(profile, true)).toEqual(profile.contact);
    expect(visibleContact(profile, false)).toBeNull();
  });

  it('is null when the profile has no contact', () => {
    expect(visibleContact({}, true)).toBeNull();
  });
});

describe('samplePlatform', () => {
  it.each([
    ['https://www.youtube.com/watch?v=abc', 'youtube'],
    ['https://youtu.be/abc', 'youtube'],
    ['https://open.spotify.com/artist/123', 'spotify'],
    ['https://soundcloud.com/rafa/demo', 'soundcloud'],
    ['https://www.instagram.com/rafa/', 'instagram'],
    ['https://rafa.bandcamp.com/album/demo', 'bandcamp'],
  ])('recognizes %p as %p', (url, platform) => {
    expect(samplePlatform(url)).toBe(platform);
  });

  it.each([
    'http://youtube.com/watch?v=abc', // not https
    'javascript:alert(1)',
    'https://youtube.com.evil.example/watch', // look-alike host
    'https://example.com/song.mp3',
    'não é um link',
  ])('rejects %p', (url) => {
    expect(samplePlatform(url)).toBeNull();
  });
});

describe('parseSampleLines', () => {
  it('keeps one trimmed link per non-blank line', () => {
    expect(parseSampleLines(' a \n\n b\r\n')).toEqual(['a', 'b']);
  });
});
