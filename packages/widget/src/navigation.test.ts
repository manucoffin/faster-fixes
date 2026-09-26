import { describe, expect, it } from "vitest";

import {
  isNavigableUrl,
  PENDING_FEEDBACK_KEY,
  storePendingFeedback,
  takePendingFeedback,
} from "./navigation.js";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  };
}

function blockedStorage(): Storage {
  throw new Error("SecurityError");
}

describe("pending Feedback", () => {
  it("uses the key the React Embed reads", () => {
    expect(PENDING_FEEDBACK_KEY).toBe("ff_pending_feedback");
  });

  it("returns the stored id once, then nothing", () => {
    const storage = memoryStorage();
    storePendingFeedback(() => storage, "fb_1");
    expect(takePendingFeedback(() => storage)).toBe("fb_1");
    expect(storage.values.size).toBe(0);
    expect(takePendingFeedback(() => storage)).toBeNull();
  });

  it("returns nothing when no item is pending", () => {
    expect(takePendingFeedback(memoryStorage)).toBeNull();
  });

  it("tolerates blocked storage", () => {
    expect(() => storePendingFeedback(blockedStorage, "fb_1")).not.toThrow();
    expect(takePendingFeedback(blockedStorage)).toBeNull();
  });
});

describe("isNavigableUrl", () => {
  it("accepts http and https page URLs", () => {
    expect(isNavigableUrl("https://example.com/pricing")).toBe(true);
    expect(isNavigableUrl("http://localhost:3000/")).toBe(true);
  });

  it("rejects other schemes and relative values", () => {
    expect(isNavigableUrl("javascript:alert(1)")).toBe(false);
    expect(isNavigableUrl("/pricing")).toBe(false);
    expect(isNavigableUrl("")).toBe(false);
  });
});
