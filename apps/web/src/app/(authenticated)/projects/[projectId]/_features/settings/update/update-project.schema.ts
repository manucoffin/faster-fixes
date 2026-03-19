import z from "zod";

export const UpdateProjectSchema = z.object({
  projectId: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  url: z.string().url("URL must be valid (e.g. https://example.com)"),
  widgetColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
  widgetPosition: z.enum([
    "top-right",
    "top-left",
    "bottom-right",
    "bottom-left",
  ]),
});

export type UpdateProjectInputs = z.infer<typeof UpdateProjectSchema>;
