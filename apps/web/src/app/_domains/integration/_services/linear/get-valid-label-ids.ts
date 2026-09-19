import type { LinearClient } from "@linear/sdk";

import { getTeamLabels } from "./get-team-labels";

export async function getValidLabelIds(
  client: LinearClient,
  teamId: string,
  candidateIds: string[],
): Promise<{ valid: string[]; droppedCount: number }> {
  if (candidateIds.length === 0) return { valid: [], droppedCount: 0 };
  const labels = await getTeamLabels(client, teamId);
  const validSet = new Set(labels.map((l) => l.id));
  const valid = candidateIds.filter((id) => validSet.has(id));
  return { valid, droppedCount: candidateIds.length - valid.length };
}

export type GetValidLabelIdsOutput = Awaited<
  ReturnType<typeof getValidLabelIds>
>;
