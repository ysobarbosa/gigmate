/**
 * How a musician can be reached. Shown only to people they matched with: the
 * rule lives here so every layer (and a future backend) applies the same one.
 */
export const CONTACT_KINDS = ['whatsapp', 'instagram', 'email'] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export interface Contact {
  readonly kind: ContactKind;
  /** Already normalized (see `normalizeContact`). */
  readonly value: string;
}

const INSTAGRAM_HANDLE = /^[a-z0-9._]{1,30}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Canonical form: WhatsApp as digits with the 55 country code, Instagram
 * without "@" and lowercase, e-mail trimmed and lowercase. Returns null when
 * the value cannot be a valid contact of that kind.
 */
export function normalizeContact(
  kind: ContactKind,
  raw: string,
): string | null {
  const value = raw.trim();
  switch (kind) {
    case 'whatsapp': {
      const digits = value.replace(/\D/g, '');
      // Brazilian numbers: DDD + 8 or 9 digits, with or without the 55 prefix.
      if (digits.length === 10 || digits.length === 11) return `55${digits}`;
      if (
        (digits.length === 12 || digits.length === 13) &&
        digits.startsWith('55')
      ) {
        return digits;
      }
      return null;
    }
    case 'instagram': {
      const handle = value.replace(/^@/, '').toLowerCase();
      return INSTAGRAM_HANDLE.test(handle) ? handle : null;
    }
    case 'email': {
      const email = value.toLowerCase();
      return EMAIL.test(email) ? email : null;
    }
  }
}

/** Link that opens the conversation in the right app. */
export function contactHref(contact: Contact): string {
  switch (contact.kind) {
    case 'whatsapp':
      return `https://wa.me/${contact.value}`;
    case 'instagram':
      return `https://instagram.com/${contact.value}`;
    case 'email':
      return `mailto:${contact.value}`;
  }
}

/** The contact someone may see: only when the two of them matched. */
export function visibleContact(
  profile: { readonly contact?: Contact },
  matched: boolean,
): Contact | null {
  return matched ? (profile.contact ?? null) : null;
}
