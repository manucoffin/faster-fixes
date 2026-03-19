import { PasswordSchema } from "@/app/_features/auth/_utils/password.schema";
import { z } from "zod";

export const SignupSchema = z
  .object({
    email: z.email("Invalid email address"),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInputs = z.infer<typeof SignupSchema>;
