import { z } from "zod";

export const ForgotPasswordSchema = z.object({
  email: z.email("Adresse email invalide"),
});

export type ForgotPasswordInputs = z.infer<typeof ForgotPasswordSchema>;
