import z from "zod";

export const GetRecordingPlaybackSchema = z.object({
  feedbackId: z.string(),
});

export type GetRecordingPlaybackInput = z.infer<
  typeof GetRecordingPlaybackSchema
>;
