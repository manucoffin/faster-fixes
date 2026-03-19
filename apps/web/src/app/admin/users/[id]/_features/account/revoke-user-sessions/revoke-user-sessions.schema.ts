import { z } from "zod";

export const RevokeUserSessionsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export type RevokeUserSessionsInputs = z.infer<typeof RevokeUserSessionsSchema>;
