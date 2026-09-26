import type { FeedbackStatus } from "@/app/_domains/feedback";
import type { LinearClient } from "@linear/sdk";

import { linearStateTypeForFeedbackStatus } from "../../_helpers/linear/state-mapping";
import { getTeamStates } from "./get-team-states";

type ProjectLinearLinkLite = {
  teamId: string;
  defaultStateId: string;
};

export type ResolvedState = {
  stateId: string;
  fellBack: boolean;
};

export async function getFeedbackStateId(args: {
  client: LinearClient;
  link: ProjectLinearLinkLite;
  feedbackStatus: FeedbackStatus;
}): Promise<ResolvedState | null> {
  const { client, link, feedbackStatus } = args;
  const states = await getTeamStates(client, link.teamId);
  const [firstState] = states;
  if (!firstState) return null;

  // For "new", prefer the link's defaultStateId (user-picked); otherwise pick by type.
  if (feedbackStatus === "new") {
    const explicit = states.find((s) => s.id === link.defaultStateId);
    if (explicit) return { stateId: explicit.id, fellBack: false };
    const fallback = states.find(
      (s) =>
        s.type === "unstarted" || s.type === "backlog" || s.type === "triage",
    );
    if (fallback) return { stateId: fallback.id, fellBack: true };
    return { stateId: firstState.id, fellBack: true };
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
  return { stateId: firstState.id, fellBack: true };
}

export type GetFeedbackStateIdOutput = Awaited<
  ReturnType<typeof getFeedbackStateId>
>;
