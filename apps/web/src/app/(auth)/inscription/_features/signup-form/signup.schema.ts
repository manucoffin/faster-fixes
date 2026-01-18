import { z } from "zod";

export const SignupSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignupSchemaType = z.infer<typeof SignupSchema>;
