import { z } from "zod";

export const SignInUserSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignInUserInput = z.infer<typeof SignInUserSchema>;
