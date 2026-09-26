import type { LinearClient } from "@linear/sdk";

import type { LinearStateType } from "../../_helpers/linear/state-mapping";

type TeamState = {
  id: string;
  name: string;
  type: LinearStateType;
  color: string;
};

const teamStateCache = new Map<
  string,
  { fetchedAt: number; states: TeamState[] }
>();
const CACHE_TTL_MS = 60_000;

export async function getTeamStates(
  client: LinearClient,
  teamId: string,
): Promise<TeamState[]> {
  const cached = teamStateCache.get(teamId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.states;
  }
  const team = await client.team(teamId);
  const states = await team.states();
  const mapped: TeamState[] = states.nodes.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type as LinearStateType,
    color: s.color,
  }));
  teamStateCache.set(teamId, { fetchedAt: Date.now(), states: mapped });
  return mapped;
}

export type GetTeamStatesOutput = Awaited<ReturnType<typeof getTeamStates>>;
