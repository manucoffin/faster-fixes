import z from "zod";

export const ListLinearTeamStatesSchema = z.object({
  teamId: z.string(),
});

export type ListLinearTeamStatesInput = z.infer<
  typeof ListLinearTeamStatesSchema
>;
