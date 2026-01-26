import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.email("Adresse email invalide"),
  name: z.string().min(1, "Le nom est requis").max(255),
  firstName: z.string().max(255).optional().or(z.literal("")),
  lastName: z.string().max(255).optional().or(z.literal("")),
});

export type CreateUserInputs = z.infer<typeof CreateUserSchema>;
