import z from "zod";

export const ListTrelloBoardListsSchema = z.object({
  projectId: z.string(),
  boardId: z.string().min(1),
});

export type ListTrelloBoardListsInput = z.infer<
  typeof ListTrelloBoardListsSchema
>;
