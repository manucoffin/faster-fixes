import { InvalidInputLinearError } from "@linear/sdk";
import { prisma } from "@workspace/db";
import {
  feedbackStatusFromLinearStateType,
  isLinearStateTypeMirroring,
} from "../../_helpers/linear/state-mapping";
import type { TrackerAdapter } from "../apply-observed-issue-state";
import type { TrackerWriter } from "../converge-tracker";
import { getFeedbackStateId } from "./get-feedback-state-id";
import { getLinearClient } from "./linear-client";
import { LinearRequestError } from "./linear-request-error";
import { decryptToken } from "./token-crypto";

/** Linear behind Status convergence: one Status per state type (ADR-0025). */
export function linearTrackerAdapter(
  db: typeof prisma = prisma,
): TrackerAdapter<"linear"> & TrackerWriter<"linear"> {
  async function readAccess(id: string) {
    const link = await db.feedbackLinearIssueLink.findUniqueOrThrow({
      where: { id },
      select: {
        issueId: true,
        projectLinearLink: {
          select: {
            id: true,
            teamId: true,
            defaultStateId: true,
            linearInstallation: { select: { accessToken: true } },
          },
        },
      },
    });
    const client = getLinearClient(
      decryptToken(link.projectLinearLink.linearInstallation.accessToken),
    );

    return { link, client };
  }

  return {
    tracker: "linear",
    async readIssue({ id }) {
      const { link, client } = await readAccess(id);

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
    async writeStatus({ id, issueState }, status) {
      if (isLinearStateTypeMirroring(issueState.issueStateType, status)) {
        return "nothing_to_write";
      }

      const { link, client } = await readAccess(id);
      const resolved = await getFeedbackStateId({
        client,
        link: link.projectLinearLink,
        feedbackStatus: status,
      });
      if (!resolved) return "cannot_write";
      // A team with no state of the Status's type falls back to one that may
      // already be the Issue's.
      if (resolved.stateId === issueState.issueStateId) {
        return "nothing_to_write";
      }

      try {
        await client.updateIssue(link.issueId, { stateId: resolved.stateId });
      } catch (error) {
        if (isNotFoundError(error)) return "missing";
        throw error;
      }

      if (resolved.fellBack) {
        await db.projectLinearLink.update({
          where: { id: link.projectLinearLink.id },
          data: { linkHealthIssue: "stale_default_state" },
        });
      }

      return {
        state: {
          issueStateId: resolved.stateId,
          issueStateType: resolved.stateType,
        },
      };
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
