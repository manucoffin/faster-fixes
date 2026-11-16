import { z } from "zod";
import { TrelloListMappingSchema } from "./trello-list-mapping.schema";

// No board field: changing the board means unlinking and linking again, which
// makes it obvious that the existing cards stop being tracked. The mapping is
// sent whole so the distinct-lists check always sees all three lists.
export const UpdateProjectTrelloLinkSchema = z.object({
  projectId: z.string(),
  lists: TrelloListMappingSchema.optional(),
  defaultLabelIds: z.array(z.string().min(1)).optional(),
  autoCreateIssues: z.boolean().optional(),
});

export type UpdateProjectTrelloLinkInput = z.infer<
  typeof UpdateProjectTrelloLinkSchema
>;
