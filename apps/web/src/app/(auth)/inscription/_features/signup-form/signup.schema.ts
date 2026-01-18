import { PasswordSchema } from "@/app/_features/auth/_utils/password.schema";
import { z } from "zod";

export const SignupSchema = z
  .object({
    email: z.email("Adresse email invalide"),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type SignupInputs = z.infer<typeof SignupSchema>;
