import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(255),
  firstName: z.string().max(255).optional().or(z.literal("")),
  lastName: z.string().max(255).optional().or(z.literal("")),
});

export type CreateUserInputs = z.infer<typeof CreateUserSchema>;
