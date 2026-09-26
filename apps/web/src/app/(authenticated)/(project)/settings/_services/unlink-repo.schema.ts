import z from "zod";

export const UnlinkRepoSchema = z.object({
  projectId: z.string(),
});

export type UnlinkRepoInput = z.infer<typeof UnlinkRepoSchema>;
