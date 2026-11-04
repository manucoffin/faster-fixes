import { describe, expect, it } from "vitest";
import {
  getVideoPosterKey,
  getVideoSourceKey,
  isVideoObjectKey,
} from "./video-object-keys";

const video = { projectId: "project_1", id: "video_1" };

describe("getVideoSourceKey", () => {
  it("names an MP4 source.mp4 under the Video's folder", () => {
    expect(getVideoSourceKey({ ...video, mimeType: "video/mp4" })).toBe(
      "videos/project_1/video_1/source.mp4",
    );
  });

  it("names a MOV source.mov", () => {
    expect(getVideoSourceKey({ ...video, mimeType: "video/quicktime" })).toBe(
      "videos/project_1/video_1/source.mov",
    );
  });
});

describe("getVideoPosterKey", () => {
  it("names the Poster poster.jpg under the Video's folder", () => {
    expect(getVideoPosterKey(video)).toBe(
      "videos/project_1/video_1/poster.jpg",
    );
  });
});

describe("isVideoObjectKey", () => {
  it("accepts the Poster key", () => {
    expect(isVideoObjectKey(video, getVideoPosterKey(video))).toBe(true);
  });

  it("refuses a key in another Video's folder", () => {
    expect(isVideoObjectKey(video, "videos/project_1/video_2/poster.jpg")).toBe(
      false,
    );
  });

  it("refuses a key that shares the Video id as a prefix", () => {
    expect(
      isVideoObjectKey(video, "videos/project_1/video_10/poster.jpg"),
    ).toBe(false);
  });

  it("refuses a key that climbs out of the folder", () => {
    expect(
      isVideoObjectKey(video, "videos/project_1/video_1/../video_2/poster.jpg"),
    ).toBe(false);
  });

  it("refuses the folder itself", () => {
    expect(isVideoObjectKey(video, "videos/project_1/video_1/")).toBe(false);
  });
});
