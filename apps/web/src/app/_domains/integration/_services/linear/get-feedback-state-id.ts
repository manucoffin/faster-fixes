import type { FeedbackStatus } from "@/app/_domains/feedback";
import type { LinearClient } from "@linear/sdk";

import { resolveLinearStateToWrite } from "../../_helpers/linear/state-mapping";
import { getTeamStates } from "./get-team-states";

type ProjectLinearLinkLite = {
  teamId: string;
  defaultStateId: string;
};

export async function getFeedbackStateId(args: {
  client: LinearClient;
  link: ProjectLinearLinkLite;
  feedbackStatus: FeedbackStatus;
}) {
  const { client, link, feedbackStatus } = args;
  const states = await getTeamStates(client, link.teamId);
  return resolveLinearStateToWrite({
    states,
    defaultStateId: link.defaultStateId,
    status: feedbackStatus,
  });
}

export type GetFeedbackStateIdOutput = Awaited<
  ReturnType<typeof getFeedbackStateId>
>;
