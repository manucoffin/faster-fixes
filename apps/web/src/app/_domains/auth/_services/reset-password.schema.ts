import { z } from "zod";
import { PasswordSchema } from "./password.schema";

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
