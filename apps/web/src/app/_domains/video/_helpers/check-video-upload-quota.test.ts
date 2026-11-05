import { describe, expect, it } from "vitest";
import { checkVideoUploadQuota } from "./check-video-upload-quota";
import type { VideoUsage } from "./format-video-usage";

const MB = 1_000_000;
const GB = 1_000_000_000;

const free: VideoUsage = {
  plan: "free",
  videoCount: 0,
  videoLimit: 1,
  usedBytes: 0,
  budgetBytes: 500 * MB,
  fileSizeCapBytes: 500 * MB,
};

const pro: VideoUsage = {
  plan: "pro",
  videoCount: 6,
  videoLimit: null,
  usedBytes: 19_600 * MB,
  budgetBytes: 20 * GB,
  fileSizeCapBytes: 2 * GB,
};

describe("checkVideoUploadQuota", () => {
  it("allows a file within every limit", () => {
    expect(checkVideoUploadQuota(free, 320 * MB)).toBeNull();
  });

  it("refuses a file over the per-file cap first", () => {
    expect(checkVideoUploadQuota(pro, 2_300 * MB)).toEqual({
      kind: "videoFileSize",
      size: 2_300 * MB,
      cap: 2 * GB,
    });
  });

  it("refuses when the Organization is at its Video count", () => {
    expect(checkVideoUploadQuota({ ...free, videoCount: 1 }, MB)).toEqual({
      kind: "videoCount",
      count: 1,
      limit: 1,
    });
  });

  it("ignores the count on a Plan without one", () => {
    expect(
      checkVideoUploadQuota({ ...pro, videoCount: 500, usedBytes: 0 }, MB),
    ).toBeNull();
  });

  it("refuses a file that would go over the storage budget", () => {
    expect(checkVideoUploadQuota(pro, 500 * MB)).toEqual({
      kind: "videoStorage",
      used: 19_600 * MB,
      budget: 20 * GB,
    });
  });

  it("allows a file that fills the budget exactly", () => {
    expect(checkVideoUploadQuota(pro, 400 * MB)).toBeNull();
  });
});
