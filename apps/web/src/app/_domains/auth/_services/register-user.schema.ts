import { z } from "zod";
import { PasswordSchema } from "./password.schema";

export const RegisterUserSchema = z
  .object({
    email: z.email("Invalid email address"),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
