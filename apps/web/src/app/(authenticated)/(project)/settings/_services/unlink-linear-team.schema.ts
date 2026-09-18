import z from "zod";

export const UnlinkLinearTeamSchema = z.object({
  projectId: z.string(),
});

export type UnlinkLinearTeamInput = z.infer<typeof UnlinkLinearTeamSchema>;
