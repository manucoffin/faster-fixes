import { getTeamStates } from "@/app/_domains/integration/_services/linear/get-team-states";
import { prisma } from "@workspace/db";
import { getLinearAccess } from "./get-linear-access";
import { ListLinearTeamStatesInput } from "./list-linear-team-states.schema";

export async function listLinearTeamStates(
  { teamId, userId }: ListLinearTeamStatesInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { client } = await getLinearAccess({ userId }, db);
  return getTeamStates(client, teamId);
}

export type ListLinearTeamStatesOutput = Awaited<
  ReturnType<typeof listLinearTeamStates>
>;
