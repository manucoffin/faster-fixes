import z from "zod";

export const ListLinearTeamLabelsSchema = z.object({
  teamId: z.string(),
});

export type ListLinearTeamLabelsInput = z.infer<
  typeof ListLinearTeamLabelsSchema
>;
