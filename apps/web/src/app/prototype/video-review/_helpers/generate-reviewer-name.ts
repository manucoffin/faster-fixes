const ADJECTIVES = [
  "Curious",
  "Brave",
  "Quiet",
  "Swift",
  "Gentle",
  "Clever",
  "Bold",
  "Calm",
  "Keen",
  "Merry",
];

const ANIMALS = [
  "Otter",
  "Heron",
  "Fox",
  "Lynx",
  "Badger",
  "Falcon",
  "Panda",
  "Walrus",
  "Ibis",
  "Marten",
];

function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) throw new Error("Empty list");
  return item;
}

export function generateReviewerName() {
  return `${pick(ADJECTIVES)} ${pick(ANIMALS)}`;
}
