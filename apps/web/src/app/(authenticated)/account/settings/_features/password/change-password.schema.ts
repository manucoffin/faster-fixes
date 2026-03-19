import { PasswordSchema } from "@/app/_features/auth/_utils/password.schema";
import z from "zod";

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInputs = z.infer<typeof ChangePasswordSchema>;
