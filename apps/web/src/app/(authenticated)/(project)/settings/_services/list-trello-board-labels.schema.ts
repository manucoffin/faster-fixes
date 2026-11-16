import z from "zod";

export const ListTrelloBoardLabelsSchema = z.object({
  projectId: z.string(),
});

export type ListTrelloBoardLabelsInput = z.infer<
  typeof ListTrelloBoardLabelsSchema
>;
