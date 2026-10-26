import { describe, expect, it } from "vitest";

import {
  CUSTOM_METADATA_MAX_KEY_LENGTH,
  CUSTOM_METADATA_MAX_KEYS,
  CUSTOM_METADATA_MAX_VALUE_LENGTH,
} from "./constants.js";
import { normalizeCustomMetadata } from "./custom-metadata.js";

describe("Custom metadata limits", () => {
  it("keeps 50 keys of 40 characters with values of 500 characters", () => {
    expect(CUSTOM_METADATA_MAX_KEYS).toBe(50);
    expect(CUSTOM_METADATA_MAX_KEY_LENGTH).toBe(40);
    expect(CUSTOM_METADATA_MAX_VALUE_LENGTH).toBe(500);
  });
});

describe("normalizeCustomMetadata", () => {
  it("passes a valid record through untouched", () => {
    const input = {
      userId: "user_42",
      release: "1.4.2",
      seats: 12,
      beta: true,
      tenant: null,
    };

    expect(normalizeCustomMetadata(input)).toEqual({
      customMetadata: input,
      warnings: [],
    });
  });

  it("drops keys beyond the limit in declared order and reports each", () => {
    const input = Object.fromEntries(
      Array.from({ length: CUSTOM_METADATA_MAX_KEYS + 2 }, (_, i) => [
        `k${i}`,
        i,
      ]),
    );

    const { customMetadata, warnings } = normalizeCustomMetadata(input);

    expect(Object.keys(customMetadata)).toEqual(
      Object.keys(input).slice(0, CUSTOM_METADATA_MAX_KEYS),
    );
    expect(warnings).toEqual([
      expect.objectContaining({ kind: "too-many-keys", key: "k50" }),
      expect.objectContaining({ kind: "too-many-keys", key: "k51" }),
    ]);
  });

  it("does not count dropped values towards the key limit", () => {
    const input: Record<string, unknown> = { nested: { a: 1 } };
    for (let i = 0; i < CUSTOM_METADATA_MAX_KEYS; i++) input[`k${i}`] = i;

    const { customMetadata } = normalizeCustomMetadata(input);

    expect(Object.keys(customMetadata)).toHaveLength(CUSTOM_METADATA_MAX_KEYS);
    expect(customMetadata).not.toHaveProperty("nested");
  });

  it("truncates a long key and reports it", () => {
    const longKey = "a".repeat(CUSTOM_METADATA_MAX_KEY_LENGTH + 5);

    const { customMetadata, warnings } = normalizeCustomMetadata({
      [longKey]: "v",
    });

    expect(customMetadata).toEqual({
      ["a".repeat(CUSTOM_METADATA_MAX_KEY_LENGTH)]: "v",
    });
    expect(warnings).toEqual([
      expect.objectContaining({ kind: "key-truncated", key: longKey }),
    ]);
  });

  it("keeps the first of two keys that collide once truncated", () => {
    const prefix = "p".repeat(CUSTOM_METADATA_MAX_KEY_LENGTH);

    const { customMetadata, warnings } = normalizeCustomMetadata({
      [`${prefix}1`]: "first",
      [`${prefix}2`]: "second",
    });

    expect(customMetadata).toEqual({ [prefix]: "first" });
    expect(warnings.map((w) => w.kind)).toEqual([
      "key-truncated",
      "key-truncated",
      "duplicate-key",
    ]);
  });

  it("truncates a long string value and reports it", () => {
    const { customMetadata, warnings } = normalizeCustomMetadata({
      note: "x".repeat(CUSTOM_METADATA_MAX_VALUE_LENGTH + 1),
    });

    expect(customMetadata).toEqual({
      note: "x".repeat(CUSTOM_METADATA_MAX_VALUE_LENGTH),
    });
    expect(warnings).toEqual([
      expect.objectContaining({ kind: "value-truncated", key: "note" }),
    ]);
  });

  it.each([
    ["a nested object", { a: 1 }],
    ["an array", [1, 2]],
    ["a function", () => "x"],
    ["undefined", undefined],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
  ])("drops %s and reports it", (_, value) => {
    const { customMetadata, warnings } = normalizeCustomMetadata({
      kept: "yes",
      bad: value,
    });

    expect(customMetadata).toEqual({ kept: "yes" });
    expect(warnings).toEqual([
      expect.objectContaining({ kind: "value-dropped", key: "bad" }),
    ]);
  });

  it("keeps null", () => {
    expect(normalizeCustomMetadata({ plan: null })).toEqual({
      customMetadata: { plan: null },
      warnings: [],
    });
  });

  it.each(["password", "access_token", "API-Key", "Email"])(
    "reports %s as sensitive and keeps its value",
    (key) => {
      const { customMetadata, warnings } = normalizeCustomMetadata({
        [key]: "s3cret",
      });

      expect(customMetadata).toEqual({ [key]: "s3cret" });
      expect(warnings).toEqual([
        expect.objectContaining({ kind: "sensitive-key", key }),
      ]);
    },
  );

  it("does not report a key that only contains a sensitive word", () => {
    expect(normalizeCustomMetadata({ tokenCount: 3 }).warnings).toEqual([]);
  });

  it("keeps a __proto__ key as an own property", () => {
    const input: unknown = JSON.parse('{"__proto__": "x"}');

    const { customMetadata } = normalizeCustomMetadata(input);

    expect(Object.getPrototypeOf(customMetadata)).toBe(Object.prototype);
    expect(Object.hasOwn(customMetadata, "__proto__")).toBe(true);
  });

  it.each([
    ["a string", "user_42"],
    ["a number", 42],
    ["null", null],
    ["undefined", undefined],
    ["an array", [["userId", "42"]]],
    ["a Date", new Date()],
  ])("yields an empty record and a warning for %s", (_, input) => {
    expect(normalizeCustomMetadata(input)).toEqual({
      customMetadata: {},
      warnings: [expect.objectContaining({ kind: "not-an-object" })],
    });
  });

  it("uses no exclamation mark or em dash in warnings", () => {
    const { warnings } = normalizeCustomMetadata({
      password: "x",
      nested: {},
      ["k".repeat(60)]: "y".repeat(600),
    });

    for (const { message } of warnings) {
      expect(message).not.toMatch(/[!—]/);
    }
  });
});
