import { z } from "zod";

export const UpdateProjectLinkSchema = z.object({
  projectId: z.string(),
  autoCreateIssues: z.boolean().optional(),
  defaultLabels: z.array(z.string()).optional(),
});

export type UpdateProjectLinkSchemaType = z.infer<
  typeof UpdateProjectLinkSchema
>;
