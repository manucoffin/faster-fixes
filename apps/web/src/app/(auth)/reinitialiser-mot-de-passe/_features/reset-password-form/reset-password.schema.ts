import { PasswordSchema } from "@/app/_features/auth/_utils/password.schema";
import { z } from "zod";

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ResetPasswordInputs = z.infer<typeof ResetPasswordSchema>;
