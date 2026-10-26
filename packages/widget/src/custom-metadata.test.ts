import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveCustomMetadata } from "./custom-metadata.js";

describe("resolveCustomMetadata", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("sends nothing when the option is not set", () => {
    expect(resolveCustomMetadata(undefined)).toBeUndefined();
  });

  it("sends a static object as declared", () => {
    expect(
      resolveCustomMetadata({ release: "1.4.0", beta: true, seats: 3 }),
    ).toEqual({ release: "1.4.0", beta: true, seats: 3 });
  });

  it("calls the function on every resolution, not once", () => {
    let userId: string | null = null;
    const option = vi.fn(() => ({ userId }));

    expect(option).not.toHaveBeenCalled();
    expect(resolveCustomMetadata(option)).toEqual({ userId: null });
    userId = "user_42";
    expect(resolveCustomMetadata(option)).toEqual({ userId: "user_42" });
    expect(option).toHaveBeenCalledTimes(2);
  });

  it("normalises the result and warns about each change in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const result = resolveCustomMetadata(() => ({
      release: "1.4.0",
      nested: { a: 1 } as never,
      note: "x".repeat(600),
    }));

    expect(result).toEqual({ release: "1.4.0", note: "x".repeat(500) });
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[0]?.[0]).toMatch(/^\[faster-fixes\] .*"nested"/);
  });

  it("sends nothing when no pair survives", () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(resolveCustomMetadata({})).toBeUndefined();
    expect(resolveCustomMetadata({ nested: [1, 2] as never })).toBeUndefined();
  });

  it("sends nothing and warns once when the function throws", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const failure = new Error("user is not loaded");

    expect(
      resolveCustomMetadata(() => {
        throw failure;
      }),
    ).toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[1]).toBe(failure);
  });

  it("warns about a sensitive key but still sends the value", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(resolveCustomMetadata({ access_token: "abc" })).toEqual({
      access_token: "abc",
    });
    expect(warn).toHaveBeenCalledOnce();
  });

  it("stays silent in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    resolveCustomMetadata(() => {
      throw new Error("boom");
    });
    resolveCustomMetadata({ password: "x".repeat(600) });

    expect(warn).not.toHaveBeenCalled();
  });
});
