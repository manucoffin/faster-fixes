import { describe, expect, it } from "vitest";
import {
  generateReviewerName,
  REVIEWER_NAME_ADJECTIVES,
  REVIEWER_NAME_ANIMALS,
} from "./generate-reviewer-name";

// A random source answering the given draws in order.
function draws(...values: number[]) {
  return () => values.shift() ?? 0;
}

describe("generateReviewerName", () => {
  it("joins an adjective and an animal with one space", () => {
    expect(generateReviewerName(draws(0, 0))).toBe(
      `${REVIEWER_NAME_ADJECTIVES[0]} ${REVIEWER_NAME_ANIMALS[0]}`,
    );
  });

  it("picks the last word of each list at the top of the range", () => {
    expect(generateReviewerName(draws(0.999, 0.999))).toBe(
      `${REVIEWER_NAME_ADJECTIVES.at(-1)} ${REVIEWER_NAME_ANIMALS.at(-1)}`,
    );
  });

  it("can offer the spec's example name", () => {
    const adjective = REVIEWER_NAME_ADJECTIVES.indexOf("Surprising");
    const animal = REVIEWER_NAME_ANIMALS.indexOf("Cat");

    expect(
      generateReviewerName(
        draws(
          adjective / REVIEWER_NAME_ADJECTIVES.length,
          animal / REVIEWER_NAME_ANIMALS.length,
        ),
      ),
    ).toBe("Surprising Cat");
  });

  it("always answers two Title Case words, each from its list", () => {
    for (let i = 0; i < 50; i++) {
      const [adjective, animal, ...rest] = generateReviewerName().split(" ");

      expect(rest).toEqual([]);
      expect(REVIEWER_NAME_ADJECTIVES).toContain(adjective);
      expect(REVIEWER_NAME_ANIMALS).toContain(animal);
    }
  });

  it("keeps every word of both lists in Title Case", () => {
    for (const word of [
      ...REVIEWER_NAME_ADJECTIVES,
      ...REVIEWER_NAME_ANIMALS,
    ]) {
      expect(word).toMatch(/^[A-Z][a-z]+$/);
    }
  });
});
