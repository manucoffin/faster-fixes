import z from "zod";

export const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
