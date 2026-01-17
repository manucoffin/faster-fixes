/**
 * Seeded shuffle algorithm that produces deterministic randomness
 * Same seed always produces the same shuffle order
 * Uses a simple seeded PRNG (Mulberry32)
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a hash from a string (filter criteria) to use as seed
 * This ensures same filters always produce same shuffle order
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Shuffle array using seeded random number generator
 * This produces consistent shuffles for the same seed
 *
 * @param array - The array to shuffle
 * @param seed - String that will be hashed to create the random seed
 * @returns Shuffled copy of the array
 */
export function shuffleArraySeeded<T>(array: T[], seed: string): T[] {
  const shuffled = [...array];
  const seedNumber = hashString(seed);
  const rng = mulberry32(seedNumber);

  // Fisher-Yates shuffle with seeded RNG
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
