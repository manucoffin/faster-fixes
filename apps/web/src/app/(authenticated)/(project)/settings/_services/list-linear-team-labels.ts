import { getTeamLabels } from "@/app/_domains/integration/_services/linear/get-team-labels";
import { prisma } from "@workspace/db";
import { getLinearAccess } from "./get-linear-access";
import { ListLinearTeamLabelsInput } from "./list-linear-team-labels.schema";

export async function listLinearTeamLabels(
  { teamId, userId }: ListLinearTeamLabelsInput & { userId: string },
  db: typeof prisma = prisma,
) {
  const { client } = await getLinearAccess({ userId }, db);
  return getTeamLabels(client, teamId);
}

export type ListLinearTeamLabelsOutput = Awaited<
  ReturnType<typeof listLinearTeamLabels>
>;
