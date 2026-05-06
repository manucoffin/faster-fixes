import type { FeedbackStatus } from "@/types/feedback-status";
import type { LinearClient } from "@linear/sdk";
import {
  type LinearStateType,
  linearStateTypeForFeedbackStatus,
} from "./state-mapping";

type ProjectLinearLinkLite = {
  teamId: string;
  defaultStateId: string;
};

type TeamState = {
  id: string;
  name: string;
  type: LinearStateType;
  color: string;
};

type TeamLabel = {
  id: string;
  name: string;
  color: string;
};

const teamStateCache = new Map<
  string,
  { fetchedAt: number; states: TeamState[] }
>();
const teamLabelCache = new Map<
  string,
  { fetchedAt: number; labels: TeamLabel[] }
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

export type ResolvedState = {
  stateId: string;
  fellBack: boolean;
};

export async function resolveStateIdForFeedback(args: {
  client: LinearClient;
  link: ProjectLinearLinkLite;
  feedbackStatus: FeedbackStatus;
}): Promise<ResolvedState | null> {
  const { client, link, feedbackStatus } = args;
  const states = await getTeamStates(client, link.teamId);
  if (states.length === 0) return null;

  // For "new", prefer the link's defaultStateId (user-picked); otherwise pick by type.
  if (feedbackStatus === "new") {
    const explicit = states.find((s) => s.id === link.defaultStateId);
    if (explicit) return { stateId: explicit.id, fellBack: false };
    const fallback = states.find(
      (s) =>
        s.type === "unstarted" || s.type === "backlog" || s.type === "triage",
    );
    if (fallback) return { stateId: fallback.id, fellBack: true };
    return { stateId: states[0]!.id, fellBack: true };
  }

  const preferredType = linearStateTypeForFeedbackStatus(feedbackStatus);
  const match = states.find((s) => s.type === preferredType);
  if (match) return { stateId: match.id, fellBack: false };

  // Type-bucket fallbacks for `in_progress` / `resolved` / `closed` if the team
  // doesn't have that exact type configured (rare but possible).
  if (preferredType === "started") {
    const alt = states.find((s) => s.type === "started");
    if (alt) return { stateId: alt.id, fellBack: true };
  }
  if (preferredType === "completed") {
    const alt = states.find((s) => s.type === "completed");
    if (alt) return { stateId: alt.id, fellBack: true };
  }
  if (preferredType === "canceled") {
    const alt = states.find(
      (s) => s.type === "canceled" || s.type === "completed",
    );
    if (alt) return { stateId: alt.id, fellBack: true };
  }
  return { stateId: states[0]!.id, fellBack: true };
}

export async function filterValidLabelIds(
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
