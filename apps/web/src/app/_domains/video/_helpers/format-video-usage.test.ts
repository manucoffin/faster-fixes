import { describe, expect, it } from "vitest";
import {
  formatVideoQuotaDenial,
  formatVideoUsageLine,
  isVideoUsageAtLimit,
  type VideoUsage,
} from "./format-video-usage";

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
  usedBytes: 4_230_000_000,
  budgetBytes: 20 * GB,
  fileSizeCapBytes: 2 * GB,
};

describe("formatVideoUsageLine", () => {
  it("names the count and the bytes on Free", () => {
    expect(
      formatVideoUsageLine({ ...free, videoCount: 1, usedBytes: 320 * MB }),
    ).toBe("1 of 1 video, 320 MB of 500 MB");
  });

  it("pluralizes a count limit above one", () => {
    expect(formatVideoUsageLine({ ...free, videoLimit: 3 })).toBe(
      "0 of 3 videos, 0 B of 500 MB",
    );
  });

  it("names the storage alone on a paid Plan", () => {
    expect(formatVideoUsageLine(pro)).toBe("4.2 GB of 20 GB of video storage");
  });

  it("rounds megabytes whole and gigabytes to one decimal", () => {
    expect(
      formatVideoUsageLine({ ...free, videoCount: 1, usedBytes: 320_499_999 }),
    ).toBe("1 of 1 video, 320 MB of 500 MB");
    expect(formatVideoUsageLine({ ...pro, usedBytes: 19_640_000_000 })).toBe(
      "19.6 GB of 20 GB of video storage",
    );
  });
});

describe("isVideoUsageAtLimit", () => {
  it("is false under both limits", () => {
    expect(isVideoUsageAtLimit(free)).toBe(false);
    expect(isVideoUsageAtLimit(pro)).toBe(false);
  });

  it("is true when Free has its one video", () => {
    expect(
      isVideoUsageAtLimit({ ...free, videoCount: 1, usedBytes: 10 * MB }),
    ).toBe(true);
  });

  it("is true when the budget is used up", () => {
    expect(isVideoUsageAtLimit({ ...pro, usedBytes: 20 * GB })).toBe(true);
  });
});

describe("formatVideoQuotaDenial", () => {
  it("names the file size and the Plan's cap", () => {
    expect(
      formatVideoQuotaDenial(
        { kind: "videoFileSize", size: 2_300_000_000, cap: 2 * GB },
        "pro",
      ),
    ).toBe("This file is 2.3 GB. The Pro plan accepts files up to 2 GB.");
  });

  it("names the used storage and the budget", () => {
    expect(
      formatVideoQuotaDenial(
        { kind: "videoStorage", used: 19_600_000_000, budget: 20 * GB },
        "pro",
      ),
    ).toBe("Your organization uses 19.6 GB of 20 GB of video storage.");
  });

  it("names the Plan's video count", () => {
    expect(
      formatVideoQuotaDenial(
        { kind: "videoCount", count: 1, limit: 1 },
        "free",
      ),
    ).toBe("The Free plan includes one video.");
  });
});
