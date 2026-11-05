import { describe, expect, it } from "vitest";
import {
  getVideoTitleFromFileName,
  VIDEO_TITLE_MAX_LENGTH,
} from "./get-video-title-from-file-name";

describe("getVideoTitleFromFileName", () => {
  it("drops the extension", () => {
    expect(getVideoTitleFromFileName("Homepage walkthrough.mp4")).toBe(
      "Homepage walkthrough",
    );
  });

  it("drops only the last extension", () => {
    expect(getVideoTitleFromFileName("cut v2.final.mov")).toBe("cut v2.final");
  });

  it("keeps a name that is only an extension", () => {
    expect(getVideoTitleFromFileName(".mp4")).toBe(".mp4");
  });

  it("bounds the title", () => {
    expect(getVideoTitleFromFileName(`${"a".repeat(200)}.mp4`)).toHaveLength(
      VIDEO_TITLE_MAX_LENGTH,
    );
  });
});
