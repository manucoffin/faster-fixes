import { z } from "zod";

export const ForgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export type ForgotPasswordInputs = z.infer<typeof ForgotPasswordSchema>;
