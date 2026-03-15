import z from "zod";

export const UpdateProjectSchema = z.object({
  projectId: z.string(),
  name: z.string().trim().min(1, "Le nom est requis"),
  url: z.string().url("L'URL doit être valide (ex: https://client.com)"),
  widgetColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur hex invalide"),
  widgetPosition: z.enum(["bottom-right", "bottom-left"]),
});

export type UpdateProjectInputs = z.infer<typeof UpdateProjectSchema>;
