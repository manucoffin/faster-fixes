import { describe, expect, it } from "vitest";
import {
  generateReviewerSecret,
  getReviewerIdentityKey,
  readReviewerIdentity,
  writeReviewerIdentity,
} from "./reviewer-identity";

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

const identity = {
  name: "Surprising Cat",
  secret: "browser_secret",
  reviewerId: "reviewer_1",
};

describe("getReviewerIdentityKey", () => {
  it("includes the Video id", () => {
    expect(getReviewerIdentityKey("video_1")).toContain("video_1");
  });

  it("differs from one Video to the next", () => {
    expect(getReviewerIdentityKey("video_1")).not.toBe(
      getReviewerIdentityKey("video_2"),
    );
  });
});

describe("readReviewerIdentity and writeReviewerIdentity", () => {
  it("reads back the identity written for the Video", () => {
    const storage = memoryStorage();

    writeReviewerIdentity(storage, "video_1", identity);

    expect(readReviewerIdentity(storage, "video_1")).toEqual(identity);
  });

  it("stores the identity under the Video's key", () => {
    const storage = memoryStorage();

    writeReviewerIdentity(storage, "video_1", identity);

    expect(
      JSON.parse(storage.items.get(getReviewerIdentityKey("video_1")) ?? ""),
    ).toEqual(identity);
  });

  it("answers null when nothing is stored for the Video", () => {
    expect(readReviewerIdentity(memoryStorage(), "video_1")).toBeNull();
  });

  it("does not answer another Video's identity", () => {
    const storage = memoryStorage();
    writeReviewerIdentity(storage, "video_1", identity);

    expect(readReviewerIdentity(storage, "video_2")).toBeNull();
  });

  it("answers null when the stored value is not JSON", () => {
    const storage = memoryStorage();
    storage.setItem(getReviewerIdentityKey("video_1"), "{not json");

    expect(readReviewerIdentity(storage, "video_1")).toBeNull();
  });

  it("answers null when the stored value lacks the secret", () => {
    const storage = memoryStorage();
    storage.setItem(
      getReviewerIdentityKey("video_1"),
      JSON.stringify({ name: "Surprising Cat", reviewerId: "reviewer_1" }),
    );

    expect(readReviewerIdentity(storage, "video_1")).toBeNull();
  });
});

describe("generateReviewerSecret", () => {
  it("encodes 24 random bytes as 32 base64url characters", () => {
    expect(generateReviewerSecret()).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  it("differs on every call", () => {
    expect(generateReviewerSecret()).not.toBe(generateReviewerSecret());
  });
});
