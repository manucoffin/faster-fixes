import { InvalidInputLinearError } from "@linear/sdk";
import { prisma } from "@workspace/db";
import {
  feedbackStatusFromLinearStateType,
  isLinearStateTypeMirroring,
} from "../../_helpers/linear/state-mapping";
import type { TrackerAdapter } from "../apply-observed-issue-state";
import { getLinearClient } from "./linear-client";
import { LinearRequestError } from "./linear-request-error";
import { decryptToken } from "./token-crypto";

/** Linear behind Status convergence: one Status per state type (ADR-0025). */
export function linearTrackerAdapter(
  db: typeof prisma = prisma,
): TrackerAdapter<"linear"> {
  return {
    tracker: "linear",
    async readIssue({ id }) {
      const link = await db.feedbackLinearIssueLink.findUniqueOrThrow({
        where: { id },
        select: {
          issueId: true,
          projectLinearLink: {
            select: { linearInstallation: { select: { accessToken: true } } },
          },
        },
      });
      const client = getLinearClient(
        decryptToken(link.projectLinearLink.linearInstallation.accessToken),
      );

      try {
        const issue = await client.issue(link.issueId);
        // Deleting an issue in Linear moves it to the trash, where it stays readable.
        if (issue.trashed) return "missing";

        const state = await issue.state;
        if (!state) {
          throw new LinearRequestError(
            `Linear issue ${link.issueId} has no workflow state.`,
          );
        }
        return {
          state: { issueStateId: state.id, issueStateType: state.type },
        };
      } catch (error) {
        if (isNotFoundError(error)) return "missing";
        throw error;
      }
    },
    isMirroring: (state, status) =>
      isLinearStateTypeMirroring(state.issueStateType, status),
    getImpliedStatus: (state) =>
      feedbackStatusFromLinearStateType(state.issueStateType),
  };
}

// Linear answers a purged issue with an invalid input error, "Entity not found".
function isNotFoundError(error: unknown) {
  return (
    error instanceof InvalidInputLinearError &&
    /entity not found/i.test(error.message)
  );
}
