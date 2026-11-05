import { describe, expect, it } from "vitest";
import {
  CreateVideoFeedbackSchema,
  VideoSelectionSchema,
} from "./create-video-feedback.schema";

function firstIssue(input: unknown) {
  const result = VideoSelectionSchema.safeParse(input);
  return result.success ? null : result.error.issues[0]?.message;
}

describe("VideoSelectionSchema", () => {
  it("accepts an instant with a point", () => {
    const input = { startMs: 1200, endMs: null, point: { x: 0.25, y: 0.5 } };

    expect(VideoSelectionSchema.parse(input)).toEqual(input);
  });

  it("accepts a range with an area touching the frame's edges", () => {
    const input = {
      startMs: 1200,
      endMs: 4800,
      area: { x: 0.5, y: 0, width: 0.5, height: 1 },
    };

    expect(VideoSelectionSchema.parse(input)).toEqual(input);
  });

  it("accepts a Selection that marks no part of the frame", () => {
    expect(
      VideoSelectionSchema.safeParse({ startMs: 0, endMs: null }).success,
    ).toBe(true);
  });

  it("accepts an explicit null point and area", () => {
    expect(
      VideoSelectionSchema.safeParse({
        startMs: 0,
        endMs: null,
        point: null,
        area: null,
      }).success,
    ).toBe(true);
  });

  it("refuses an out point equal to the in point", () => {
    expect(firstIssue({ startMs: 1200, endMs: 1200 })).toBe(
      "The out point must be later than the in point.",
    );
  });

  it("refuses an out point before the in point", () => {
    expect(firstIssue({ startMs: 1200, endMs: 800 })).toBe(
      "The out point must be later than the in point.",
    );
  });

  it("refuses a negative in point", () => {
    expect(firstIssue({ startMs: -1, endMs: null })).toBe(
      "The in point cannot be negative.",
    );
  });

  it("refuses a fractional in point", () => {
    expect(
      VideoSelectionSchema.safeParse({ startMs: 1.5, endMs: null }).success,
    ).toBe(false);
  });

  it("refuses a point outside 0..1", () => {
    expect(
      firstIssue({ startMs: 0, endMs: null, point: { x: 1.2, y: 0.5 } }),
    ).toBe("Coordinates must be between 0 and 1.");
  });

  it("refuses an area leaving the frame", () => {
    expect(
      firstIssue({
        startMs: 0,
        endMs: null,
        area: { x: 0.6, y: 0.2, width: 0.5, height: 0.3 },
      }),
    ).toBe("An area must stay inside the frame.");
  });

  it("refuses an area with no width", () => {
    expect(
      firstIssue({
        startMs: 0,
        endMs: null,
        area: { x: 0.6, y: 0.2, width: 0, height: 0.3 },
      }),
    ).toBe("An area must have a width and a height.");
  });

  it("refuses a point and an area together", () => {
    expect(
      firstIssue({
        startMs: 0,
        endMs: null,
        point: { x: 0.1, y: 0.1 },
        area: { x: 0.2, y: 0.2, width: 0.1, height: 0.1 },
      }),
    ).toBe("Mark either a point or an area, not both.");
  });
});

describe("CreateVideoFeedbackSchema", () => {
  const valid = { comment: "The logo jumps", startMs: 1200, endMs: null };

  it("trims the comment", () => {
    expect(
      CreateVideoFeedbackSchema.parse({ ...valid, comment: "  Too slow  " })
        .comment,
    ).toBe("Too slow");
  });

  it("refuses a blank comment", () => {
    expect(
      CreateVideoFeedbackSchema.safeParse({ ...valid, comment: "   " }).success,
    ).toBe(false);
  });

  it("refuses a comment above 5000 characters", () => {
    expect(
      CreateVideoFeedbackSchema.safeParse({
        ...valid,
        comment: "a".repeat(5001),
      }).success,
    ).toBe(false);
  });

  it("keeps the Selection's refinements", () => {
    expect(
      CreateVideoFeedbackSchema.safeParse({ ...valid, endMs: 1000 }).success,
    ).toBe(false);
  });
});
