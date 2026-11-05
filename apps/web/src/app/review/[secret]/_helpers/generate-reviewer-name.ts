export const REVIEWER_NAME_ADJECTIVES = [
  "Bold",
  "Brave",
  "Calm",
  "Clever",
  "Curious",
  "Gentle",
  "Keen",
  "Merry",
  "Patient",
  "Quiet",
  "Surprising",
  "Swift",
] as const;

export const REVIEWER_NAME_ANIMALS = [
  "Badger",
  "Cat",
  "Falcon",
  "Fox",
  "Heron",
  "Ibis",
  "Lynx",
  "Marten",
  "Otter",
  "Panda",
  "Walrus",
  "Wren",
] as const;

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error("Cannot pick from an empty list");
  return item;
}

/**
 * A name offered to a Reviewer at their first comment, e.g. "Surprising Cat".
 * Not unique: the server refuses a name already held on the Video.
 */
export function generateReviewerName(random: () => number = Math.random) {
  return `${pick(REVIEWER_NAME_ADJECTIVES, random)} ${pick(REVIEWER_NAME_ANIMALS, random)}`;
}
