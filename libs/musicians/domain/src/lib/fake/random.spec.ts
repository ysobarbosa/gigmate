import { createRandom } from './random';

describe('createRandom', () => {
  const take = (seed: number, n: number) => {
    const random = createRandom(seed);
    return Array.from({ length: n }, () => random.next());
  };

  it('is reproducible for the same seed', () => {
    expect(take(7, 5)).toEqual(take(7, 5));
  });

  it('differs between seeds', () => {
    expect(take(7, 5)).not.toEqual(take(8, 5));
  });

  it('stays in [0, 1)', () => {
    for (const value of take(1, 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('int() covers both bounds', () => {
    const random = createRandom(3);
    const seen = new Set(Array.from({ length: 200 }, () => random.int(1, 3)));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('sample() returns distinct items and never more than exist', () => {
    const random = createRandom(5);
    const picked = random.sample(['a', 'b', 'c', 'd'], 3);
    expect(new Set(picked).size).toBe(3);
    expect(random.sample(['a', 'b'], 5)).toHaveLength(2);
  });

  it('weighted() never picks a zero-weight entry and favors heavier ones', () => {
    const random = createRandom(9);
    const counts = { a: 0, b: 0, never: 0 };
    for (let i = 0; i < 1000; i++) {
      counts[
        random.weighted([
          ['a', 3],
          ['b', 1],
          ['never', 0],
        ] as const)
      ]++;
    }
    expect(counts.never).toBe(0);
    expect(counts.a).toBeGreaterThan(counts.b * 2);
  });

  it('pick() rejects an empty list', () => {
    expect(() => createRandom(1).pick([])).toThrow();
  });
});
