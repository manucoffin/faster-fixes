import z from "zod";

export const GetProjectSchema = z.object({
  projectId: z.string(),
});

export type GetProjectInput = z.infer<typeof GetProjectSchema>;
