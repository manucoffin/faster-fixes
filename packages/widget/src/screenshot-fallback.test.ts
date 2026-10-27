import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FULL_CAPTURE_TIMEOUT,
  settleScreenshot,
} from "./screenshot-fallback.js";

const fullImage = new Blob(["full"]);
const lightImage = new Blob(["light"]);

afterEach(() => {
  vi.useRealTimers();
});

describe("settleScreenshot", () => {
  it("uses the full capture when it finishes in time", async () => {
    const capture = vi.fn(() => Promise.resolve(lightImage));

    await expect(
      settleScreenshot(Promise.resolve(fullImage), capture),
    ).resolves.toBe(fullImage);
    expect(capture).not.toHaveBeenCalled();
  });

  it("falls back to a lightweight capture when the full one times out", async () => {
    vi.useFakeTimers();
    const capture = vi.fn(() => Promise.resolve(lightImage));
    const never = new Promise<Blob | null>(() => {});

    const settled = settleScreenshot(never, capture, 3000);
    await vi.advanceTimersByTimeAsync(3000);

    await expect(settled).resolves.toBe(lightImage);
    expect(capture).toHaveBeenCalledWith({ lightweight: true });
  });

  it("gives the full capture 15 seconds by default", async () => {
    vi.useFakeTimers();
    const capture = vi.fn(() => Promise.resolve(lightImage));
    let finish: (blob: Blob) => void = () => {};
    const slow = new Promise<Blob | null>((resolve) => {
      finish = resolve;
    });

    const settled = settleScreenshot(slow, capture);
    await vi.advanceTimersByTimeAsync(FULL_CAPTURE_TIMEOUT - 1);
    finish(fullImage);

    await expect(settled).resolves.toBe(fullImage);
    expect(FULL_CAPTURE_TIMEOUT).toBe(15000);
    expect(capture).not.toHaveBeenCalled();
  });

  it("falls back to a lightweight capture when the full one failed", async () => {
    const capture = vi.fn(() => Promise.resolve(lightImage));

    await expect(
      settleScreenshot(Promise.resolve(null), capture),
    ).resolves.toBe(lightImage);
    await expect(
      settleScreenshot(Promise.reject(new Error("boom")), capture),
    ).resolves.toBe(lightImage);
  });

  it("resolves to null when both captures fail", async () => {
    const capture = vi.fn(() => Promise.reject(new Error("boom")));

    await expect(
      settleScreenshot(Promise.resolve(null), capture),
    ).resolves.toBeNull();
  });

  it("captures lightweight when no full capture was started", async () => {
    const capture = vi.fn(() => Promise.resolve(lightImage));

    await expect(settleScreenshot(null, capture)).resolves.toBe(lightImage);
  });
});
