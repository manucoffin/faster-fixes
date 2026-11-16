import { z } from "zod";

export const UnlinkTrelloBoardSchema = z.object({
  projectId: z.string(),
});

export type UnlinkTrelloBoardInput = z.infer<typeof UnlinkTrelloBoardSchema>;
