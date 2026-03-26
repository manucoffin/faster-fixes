import z from "zod";

export const UpdateProjectSchema = z.object({
  projectId: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  url: z.string().url("URL must be valid (e.g. https://example.com)"),
  widgetEnabled: z.boolean(),
});

export type UpdateProjectInputs = z.infer<typeof UpdateProjectSchema>;
