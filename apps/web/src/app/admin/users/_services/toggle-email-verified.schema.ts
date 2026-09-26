import { z } from "zod";

export const ToggleEmailVerifiedSchema = z.object({
  userId: z.string().min(1),
  emailVerified: z.boolean(),
});

export type ToggleEmailVerifiedInput = z.infer<
  typeof ToggleEmailVerifiedSchema
>;
