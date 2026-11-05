import z from "zod";

export const GetVideoSchema = z.object({
  videoId: z.string(),
});

export type GetVideoInput = z.infer<typeof GetVideoSchema>;
