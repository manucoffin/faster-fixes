import z from "zod";

export const UpdateOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis"),
  slug: z
    .string()
    .trim()
    .min(1, "Le slug est requis")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets",
    ),
});

export type UpdateOrganizationInputs = z.infer<typeof UpdateOrganizationSchema>;
