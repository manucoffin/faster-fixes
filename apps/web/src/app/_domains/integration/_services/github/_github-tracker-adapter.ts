import { prisma } from "@workspace/db";
import {
  feedbackStatusFromGitHubIssueState,
  isGitHubIssueStateMirroring,
  resolveGitHubStateToWrite,
} from "../../_helpers/github/status-mapping";
import type { TrackerAdapter } from "../apply-observed-issue-state";
import type { TrackerWriter } from "../converge-tracker";
import { getInstallationOctokit } from "./github-app";

/** GitHub behind Status convergence: two states, open or closed (ADR-0025). */
export function gitHubTrackerAdapter(
  db: typeof prisma = prisma,
): TrackerAdapter<"github"> & TrackerWriter<"github"> {
  async function readAccess(id: string) {
    const link = await db.feedbackIssueLink.findUniqueOrThrow({
      where: { id },
      select: {
        issueNumber: true,
        projectGitHubLink: {
          select: {
            repoOwner: true,
            repoName: true,
            gitHubInstallation: { select: { installationId: true } },
          },
        },
      },
    });
    const { repoOwner, repoName, gitHubInstallation } = link.projectGitHubLink;

    return {
      octokit: getInstallationOctokit(gitHubInstallation.installationId),
      issue: {
        owner: repoOwner,
        repo: repoName,
        issue_number: link.issueNumber,
      },
    };
  }

  return {
    tracker: "github",
    async readIssue({ id }) {
      const { octokit, issue } = await readAccess(id);

      try {
        const { data } = await octokit.request(
          "GET /repos/{owner}/{repo}/issues/{issue_number}",
          issue,
        );
        return {
          state: { issueState: data.state === "closed" ? "closed" : "open" },
        };
      } catch (error) {
        // GitHub answers 410 for a deleted Issue and 404 for one it no longer has.
        if (isGoneError(error)) return "missing";
        throw error;
      }
    },
    async writeStatus({ id, issueState }, status) {
      const { state, stateReason } = resolveGitHubStateToWrite(status);
      // Closed already mirrors Archived as well as Resolved, so the close
      // reason is left as it was.
      if (issueState.issueState === state) return "nothing_to_write";

      const { octokit, issue } = await readAccess(id);

      try {
        await octokit.request(
          "PATCH /repos/{owner}/{repo}/issues/{issue_number}",
          {
            ...issue,
            state,
            ...(stateReason && { state_reason: stateReason }),
          },
        );
        return { state: { issueState: state } };
      } catch (error) {
        if (isGoneError(error)) return "missing";
        throw error;
      }
    },
    isMirroring: (state, status) =>
      isGitHubIssueStateMirroring(state.issueState, status),
    getImpliedStatus: (state) =>
      feedbackStatusFromGitHubIssueState(state.issueState),
  };
}

function isGoneError(error: unknown) {
  return (
    error instanceof Error &&
    "status" in error &&
    (error.status === 404 || error.status === 410)
  );
}
