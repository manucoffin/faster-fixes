import { z } from "zod";

export const RequestPasswordResetSchema = z.object({
  userId: z.string(),
});

export type RequestPasswordResetInput = z.infer<
  typeof RequestPasswordResetSchema
>;
