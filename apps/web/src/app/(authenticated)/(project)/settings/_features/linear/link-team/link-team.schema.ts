import { z } from "zod";

export const LinearPrioritySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const LinkLinearTeamSchema = z.object({
  projectId: z.string(),
  teamId: z.string(),
  teamKey: z.string(),
  teamName: z.string(),
  defaultStateId: z.string(),
  defaultLabelIds: z.array(z.string()).default([]),
  defaultPriority: LinearPrioritySchema.default(0),
  autoCreateIssues: z.boolean().default(true),
});

export type LinkLinearTeamSchemaType = z.infer<typeof LinkLinearTeamSchema>;
