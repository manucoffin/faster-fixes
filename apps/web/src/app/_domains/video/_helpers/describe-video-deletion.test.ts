import { describe, expect, it } from "vitest";
import { describeVideoDeletion } from "./describe-video-deletion";

describe("describeVideoDeletion", () => {
  it("names the number of Feedback going with the Video", () => {
    expect(describeVideoDeletion(3)).toBe(
      "This action is irreversible. The video, its share link and 3 feedback items will be permanently deleted.",
    );
  });

  it("uses the singular for one Feedback", () => {
    expect(describeVideoDeletion(1)).toBe(
      "This action is irreversible. The video, its share link and 1 feedback item will be permanently deleted.",
    );
  });

  it("drops the Feedback clause when there is none", () => {
    expect(describeVideoDeletion(0)).toBe(
      "This action is irreversible. The video and its share link will be permanently deleted.",
    );
  });
});
