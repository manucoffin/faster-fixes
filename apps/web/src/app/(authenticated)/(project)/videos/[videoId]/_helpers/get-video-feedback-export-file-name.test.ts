import { describe, expect, it } from "vitest";
import { getVideoFeedbackExportFileName } from "./get-video-feedback-export-file-name";

describe("getVideoFeedbackExportFileName", () => {
  it("joins the words of the title with hyphens", () => {
    expect(getVideoFeedbackExportFileName("Launch cut v2", "video_1")).toBe(
      "launch-cut-v2-feedback.json",
    );
  });

  it("drops punctuation and collapses the separators it leaves", () => {
    expect(
      getVideoFeedbackExportFileName(
        "  Homepage: walkthrough (final)!  ",
        "video_1",
      ),
    ).toBe("homepage-walkthrough-final-feedback.json");
  });

  it("strips accents to their base letter", () => {
    expect(getVideoFeedbackExportFileName("Démo écran Noël", "video_1")).toBe(
      "demo-ecran-noel-feedback.json",
    );
  });

  it("falls back to the Video id when nothing of the title is left", () => {
    expect(getVideoFeedbackExportFileName("日本語 ???", "video_1")).toBe(
      "video_1-feedback.json",
    );
  });
});
