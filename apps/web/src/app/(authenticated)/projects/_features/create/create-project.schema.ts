import z from "zod";

export const CreateProjectSchema = z.object({
  organizationId: z.string(),
  name: z.string().trim().min(1, "Le nom est requis"),
  url: z.string().url("L'URL doit être valide (ex: https://client.com)"),
});

export type CreateProjectInputs = z.infer<typeof CreateProjectSchema>;
