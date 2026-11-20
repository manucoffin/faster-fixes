import { prisma } from "@workspace/db";
import {
  feedbackStatusFromGitHubIssueState,
  isGitHubIssueStateMirroring,
} from "../../_helpers/github/status-mapping";
import type { TrackerAdapter } from "../apply-observed-issue-state";
import { getInstallationOctokit } from "./github-app";

/** GitHub behind Status convergence: two states, open or closed (ADR-0025). */
export function gitHubTrackerAdapter(
  db: typeof prisma = prisma,
): TrackerAdapter<"github"> {
  return {
    tracker: "github",
    async readIssue({ id }) {
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
      const { repoOwner, repoName, gitHubInstallation } =
        link.projectGitHubLink;
      const octokit = getInstallationOctokit(gitHubInstallation.installationId);

      try {
        const { data } = await octokit.request(
          "GET /repos/{owner}/{repo}/issues/{issue_number}",
          { owner: repoOwner, repo: repoName, issue_number: link.issueNumber },
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
