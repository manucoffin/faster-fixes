import { describe, expect, it } from "vitest";
import type { VideoFileClassification } from "./classify-video-file";
import { describeVideoFileClassification } from "./describe-video-file-classification";

const accepted: VideoFileClassification = {
  kind: "accepted",
  videoCodec: "avc1",
  durationMs: 5000,
  width: 1920,
  height: 1080,
  hasFastStart: true,
  audio: "aac",
};

describe("describeVideoFileClassification", () => {
  it("has nothing to say about an H.264 file with AAC and fast start", () => {
    expect(describeVideoFileClassification(accepted)).toEqual({
      refusal: null,
      warnings: [],
    });
  });

  it.each([
    ["hevc", "This video uses HEVC (H.265)"],
    ["prores", "This video uses ProRes"],
    ["webm", "WebM videos are not supported"],
    ["unknown", "This video could not be read"],
  ] as const)("refuses %s", (reason, start) => {
    const { refusal, warnings } = describeVideoFileClassification({
      kind: "refused",
      reason,
    });
    expect(refusal?.startsWith(start)).toBe(true);
    expect(warnings).toEqual([]);
  });

  it.each(["other", "none"] as const)("warns on %s audio", (audio) => {
    expect(
      describeVideoFileClassification({ ...accepted, audio }).warnings,
    ).toEqual(["The audio in this video may not play in every browser."]);
  });

  it("warns on a missing fast start", () => {
    expect(
      describeVideoFileClassification({ ...accepted, hasFastStart: false })
        .warnings,
    ).toEqual([
      "This video will take longer to start playing. Export it with fast start (web optimized) for a better review experience.",
    ]);
  });
});
