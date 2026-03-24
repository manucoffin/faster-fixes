import { z } from "zod";

export const LinkRepoSchema = z.object({
  projectId: z.string(),
  repoId: z.number(),
  repoOwner: z.string(),
  repoName: z.string(),
  repoFullName: z.string(),
  autoCreateIssues: z.boolean().default(true),
  defaultLabels: z.array(z.string()).default(["faster-fixes"]),
});

export type LinkRepoSchemaType = z.infer<typeof LinkRepoSchema>;
