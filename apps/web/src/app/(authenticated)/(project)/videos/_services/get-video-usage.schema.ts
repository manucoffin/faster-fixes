import z from "zod";

export const GetVideoUsageSchema = z.object({
  projectId: z.string(),
});

export type GetVideoUsageInput = z.infer<typeof GetVideoUsageSchema>;
