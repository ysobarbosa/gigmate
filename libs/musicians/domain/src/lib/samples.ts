/**
 * Sample links: where people can hear someone play. Only https links to known
 * music platforms are accepted, which also rules out `javascript:` URLs and
 * look-alike domains.
 */
export const SAMPLE_PLATFORMS = [
  'youtube',
  'spotify',
  'soundcloud',
  'instagram',
  'bandcamp',
] as const;
export type SamplePlatform = (typeof SAMPLE_PLATFORMS)[number];

export const MAX_SAMPLES = 3;

const HOSTS: Record<Exclude<SamplePlatform, 'bandcamp'>, readonly string[]> = {
  youtube: [
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'music.youtube.com',
    'youtu.be',
  ],
  spotify: ['open.spotify.com'],
  soundcloud: ['soundcloud.com', 'www.soundcloud.com', 'on.soundcloud.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
};

/** The platform of a sample link, or null if it is not an accepted link. */
export function samplePlatform(raw: string): SamplePlatform | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  // Bandcamp gives each artist a subdomain: artist.bandcamp.com.
  if (/^[a-z0-9-]+\.bandcamp\.com$/.test(host)) return 'bandcamp';
  const match = (
    Object.entries(HOSTS) as [SamplePlatform, readonly string[]][]
  ).find(([, hosts]) => hosts.includes(host));
  return match?.[0] ?? null;
}

/** Splits free text into lines, one link per line, ignoring blank lines. */
export function parseSampleLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
