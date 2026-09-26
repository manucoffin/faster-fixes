import { z } from "zod";

export const RequestPasswordResetSchema = z.object({
  email: z.email("Invalid email address"),
});

export type RequestPasswordResetInput = z.infer<
  typeof RequestPasswordResetSchema
>;
