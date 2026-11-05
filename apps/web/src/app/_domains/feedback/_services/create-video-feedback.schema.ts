import { z } from "zod";

const coordinate = z
  .number()
  .min(0, "Coordinates must be between 0 and 1.")
  .max(1, "Coordinates must be between 0 and 1.");

const size = z
  .number()
  .gt(0, "An area must have a width and a height.")
  .max(1, "An area must stay inside the frame.");

/**
 * Where a video Feedback sits: an instant (`endMs` null) or a range, and an
 * optional point or area on the frame in normalized 0..1 coordinates. The
 * bound against the Video's duration is the caller's, since only it knows the
 * Video.
 */
export const VideoSelectionSchema = z
  .object({
    startMs: z.number().int().min(0, "The in point cannot be negative."),
    endMs: z.number().int().nullable(),
    point: z.object({ x: coordinate, y: coordinate }).nullish(),
    area: z
      .object({ x: coordinate, y: coordinate, width: size, height: size })
      .refine(
        ({ x, y, width, height }) => x + width <= 1 && y + height <= 1,
        "An area must stay inside the frame.",
      )
      .nullish(),
  })
  .refine(({ startMs, endMs }) => endMs === null || endMs > startMs, {
    message: "The out point must be later than the in point.",
    path: ["endMs"],
  })
  .refine(({ point, area }) => !(point && area), {
    message: "Mark either a point or an area, not both.",
    path: ["area"],
  });

const comment = z
  .string()
  .trim()
  .min(1, "Write a comment before posting.")
  .max(5000, "A comment cannot exceed 5000 characters.");

// `safeExtend` keeps the Selection's cross-field refinements, which a spread
// of its shape would drop.
export const CreateVideoFeedbackSchema = VideoSelectionSchema.safeExtend({
  comment,
  browserName: z.string().max(100).optional(),
  browserVersion: z.string().max(100).optional(),
  os: z.string().max(100).optional(),
  viewportWidth: z.number().int().min(0).optional(),
  viewportHeight: z.number().int().min(0).optional(),
});

/** A Reviewer's edit of their own new Feedback: the comment only. */
export const UpdateVideoFeedbackSchema = z.object({ comment });

export type VideoSelectionInput = z.infer<typeof VideoSelectionSchema>;
export type CreateVideoFeedbackInput = z.infer<
  typeof CreateVideoFeedbackSchema
>;
export type UpdateVideoFeedbackInput = z.infer<
  typeof UpdateVideoFeedbackSchema
>;
