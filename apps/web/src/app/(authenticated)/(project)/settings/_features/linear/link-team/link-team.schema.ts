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
  teamId: z.string().min(1, "Select a team."),
  teamKey: z.string().min(1),
  teamName: z.string().min(1),
  defaultStateId: z.string().min(1, "Select a default state."),
  defaultLabelIds: z.array(z.string()),
  defaultPriority: LinearPrioritySchema,
  autoCreateIssues: z.boolean(),
});

export type LinkLinearTeamSchemaType = z.infer<typeof LinkLinearTeamSchema>;
