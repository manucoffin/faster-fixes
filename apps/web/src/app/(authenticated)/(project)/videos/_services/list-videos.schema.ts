import z from "zod";

export const ListVideosSchema = z.object({
  projectId: z.string(),
});

export type ListVideosInput = z.infer<typeof ListVideosSchema>;
