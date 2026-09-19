import type { LinearClient } from "@linear/sdk";

type TeamLabel = {
  id: string;
  name: string;
  color: string;
};

const teamLabelCache = new Map<
  string,
  { fetchedAt: number; labels: TeamLabel[] }
>();
const CACHE_TTL_MS = 60_000;

export async function getTeamLabels(
  client: LinearClient,
  teamId: string,
): Promise<TeamLabel[]> {
  const cached = teamLabelCache.get(teamId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.labels;
  }
  const team = await client.team(teamId);
  const labels = await team.labels();
  const mapped: TeamLabel[] = labels.nodes.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
  }));
  teamLabelCache.set(teamId, { fetchedAt: Date.now(), labels: mapped });
  return mapped;
}

export type GetTeamLabelsOutput = Awaited<ReturnType<typeof getTeamLabels>>;
