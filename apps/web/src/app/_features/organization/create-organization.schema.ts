import z from "zod";

export const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
});

export type CreateOrganizationInputs = z.infer<typeof CreateOrganizationSchema>;
