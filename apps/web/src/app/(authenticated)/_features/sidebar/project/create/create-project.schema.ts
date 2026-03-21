import z from "zod";

export const CreateProjectSchema = z.object({
  organizationId: z.string(),
  name: z.string().trim().min(1, "Name is required"),
  url: z.string().url("URL must be valid (e.g. https://client.com)"),
});

export type CreateProjectInputs = z.infer<typeof CreateProjectSchema>;
