import { z } from "zod";
import { LinearPrioritySchema } from "../link-team/link-team.schema";

// Discriminated union: when the team changes, the dependent IDs (defaultStateId,
// defaultLabelIds) MUST be re-picked in the same payload to avoid stale-ID corruption.
// When team stays the same, all other fields are independently optional partials.

const TeamChangeUpdateSchema = z.object({
  projectId: z.string(),
  kind: z.literal("team_change"),
  teamId: z.string(),
  teamKey: z.string(),
  teamName: z.string(),
  defaultStateId: z.string(),
  defaultLabelIds: z.array(z.string()),
  defaultPriority: LinearPrioritySchema,
  autoCreateIssues: z.boolean(),
});

const PartialUpdateSchema = z.object({
  projectId: z.string(),
  kind: z.literal("partial"),
  defaultStateId: z.string().optional(),
  defaultLabelIds: z.array(z.string()).optional(),
  defaultPriority: LinearPrioritySchema.optional(),
  autoCreateIssues: z.boolean().optional(),
});

export const UpdateProjectLinearLinkSchema = z.discriminatedUnion("kind", [
  TeamChangeUpdateSchema,
  PartialUpdateSchema,
]);

export type UpdateProjectLinearLinkSchemaType = z.infer<
  typeof UpdateProjectLinearLinkSchema
>;
