import { z } from "zod";
import { TrelloListMappingSchema } from "./trello-list-mapping.schema";

// `safeExtend` keeps the distinct-lists refinement, which `extend` refuses.
export const LinkTrelloBoardSchema = TrelloListMappingSchema.safeExtend({
  projectId: z.string(),
  boardId: z.string().min(1, "Select a Trello board."),
  boardName: z.string().min(1),
  boardUrl: z.url(),
});

export type LinkTrelloBoardInput = z.infer<typeof LinkTrelloBoardSchema>;
