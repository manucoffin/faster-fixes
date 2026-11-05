import z from "zod";

export const GetVideoFeedbackExportSchema = z.object({
  videoId: z.string(),
});

export type GetVideoFeedbackExportInput = z.infer<
  typeof GetVideoFeedbackExportSchema
>;
