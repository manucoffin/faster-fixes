import { z } from "zod";

export const RequestPasswordResetSchema = z.object({
  userId: z.string(),
});

export type RequestPasswordResetInputs = z.infer<
  typeof RequestPasswordResetSchema
>;
