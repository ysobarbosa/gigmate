/**
 * Small seeded PRNG (mulberry32) plus helpers. `Math.random()` cannot be
 * seeded, and a seed is what makes the fake data reproducible: same seed,
 * same musicians, in every test run and every demo.
 */
export interface Random {
  /** Float in [0, 1). */
  next(): number;
  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number;
  chance(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  /** Picks by weight; weights need not sum to 1. */
  weighted<T>(entries: readonly (readonly [T, number])[]): T;
  /** `count` distinct items, in random order. */
  sample<T>(items: readonly T[], count: number): T[];
}

export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const random: Random = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: (probability) => next() < probability,
    pick: (items) => {
      if (items.length === 0) throw new Error('pick() from an empty list');
      return items[Math.floor(next() * items.length)];
    },
    weighted: (entries) => {
      const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
      let roll = next() * total;
      for (const [value, weight] of entries) {
        roll -= weight;
        if (roll < 0) return value;
      }
      return entries[entries.length - 1][0];
    },
    sample: (items, count) => {
      // Partial Fisher-Yates shuffle on a copy.
      const copy = [...items];
      const n = Math.min(count, copy.length);
      for (let i = 0; i < n; i++) {
        const j = i + Math.floor(next() * (copy.length - i));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy.slice(0, n);
    },
  };
  return random;
}
