import z from "zod";

export const UpdateOrganizationSchema = z.object({
  organizationId: z.string(),
  name: z.string().trim().min(1, "Le nom est requis"),
});

export type UpdateOrganizationInputs = z.infer<typeof UpdateOrganizationSchema>;
