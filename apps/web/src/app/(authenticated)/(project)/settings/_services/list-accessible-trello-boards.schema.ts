import z from "zod";

export const ListAccessibleTrelloBoardsSchema = z.object({
  projectId: z.string(),
});

export type ListAccessibleTrelloBoardsInput = z.infer<
  typeof ListAccessibleTrelloBoardsSchema
>;
