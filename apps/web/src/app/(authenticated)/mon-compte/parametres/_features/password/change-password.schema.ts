import { PasswordSchema } from "@/app/_features/auth/_utils/password.schema";
import z from "zod";

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ChangePasswordInputs = z.infer<typeof ChangePasswordSchema>;
