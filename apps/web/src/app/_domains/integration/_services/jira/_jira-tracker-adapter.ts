import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import { prisma } from "@workspace/db";
import {
  feedbackStatusFromJiraStatusCategory,
  isJiraStatusCategoryMirroring,
  resolveJiraTransition,
} from "../../_helpers/jira/transition-mapping";
import type { TrackerAdapter } from "../apply-observed-issue-state";
import type { TrackerWriter } from "../converge-tracker";
import {
  fetchJiraIssueStatus,
  JiraRequestError,
  listJiraTransitions,
  transitionJiraIssue,
} from "./jira-rest-client";
import { getValidJiraAccessToken } from "./token-access";

/** Jira behind Status convergence: two states, Done or not Done (ADR-0025). */
export function jiraTrackerAdapter(
  db: typeof prisma = prisma,
): TrackerAdapter<"jira"> & TrackerWriter<"jira"> {
  async function readAccess(id: string) {
    const link = await db.feedbackJiraIssueLink.findUniqueOrThrow({
      where: { id },
      select: {
        issueId: true,
        issueKey: true,
        projectJiraLink: { select: { jiraInstallation: true } },
      },
    });
    const installation = link.projectJiraLink.jiraInstallation;

    // A disconnected or refused Installation is a fact about the data, so the
    // next attempt reads the same row; an Atlassian outage still retries.
    const accessToken = await getValidJiraAccessToken(
      installation.organizationId,
    ).catch(rethrowDomainErrorsAsNonRetriable);

    return { link, installation, accessToken };
  }

  return {
    tracker: "jira",
    async readIssue({ id }) {
      const { link, installation, accessToken } = await readAccess(id);

      const issue = await fetchJiraIssueStatus(
        accessToken,
        installation.cloudId,
        link.issueId,
      );
      if (!issue) return "missing";

      // Moving an issue between Jira projects reissues its key (PAY-123 ->
      // ENG-45) and its browse URL. The id we sync on never changes, so this
      // is a display-only repair of the denormalized columns.
      if (issue.key !== link.issueKey) {
        await db.feedbackJiraIssueLink.update({
          where: { id },
          data: {
            issueKey: issue.key,
            issueUrl: `${installation.siteUrl}/browse/${issue.key}`,
          },
        });
      }

      return { state: { issueStatusCategory: issue.statusCategory } };
    },
    async writeStatus({ id, issueState }, status) {
      // An issue already outside Done mirrors `new` and In progress alike, so
      // shuffling it between To Do and In Progress would be churn in Jira.
      if (
        isJiraStatusCategoryMirroring(issueState.issueStatusCategory, status)
      ) {
        return "nothing_to_write";
      }

      const { link, installation, accessToken } = await readAccess(id);

      try {
        const transitions = await listJiraTransitions(
          accessToken,
          installation.cloudId,
          link.issueId,
        );
        const resolved = resolveJiraTransition({
          transitions,
          feedbackStatus: status,
        });
        // A workflow with no path to the target category is a customer choice,
        // not a broken link, so no retries are burnt on it.
        if (!resolved) return "cannot_write";

        await transitionJiraIssue(
          accessToken,
          installation.cloudId,
          link.issueId,
          {
            transitionId: resolved.transitionId,
            resolutionName: resolved.resolutionName,
          },
        );

        return { state: { issueStatusCategory: resolved.toStatusCategory } };
      } catch (error) {
        if (error instanceof JiraRequestError && error.status === 404) {
          return "missing";
        }
        throw error;
      }
    },
    isMirroring: (state, status) =>
      isJiraStatusCategoryMirroring(state.issueStatusCategory, status),
    getImpliedStatus: (state) =>
      feedbackStatusFromJiraStatusCategory(state.issueStatusCategory),
  };
}
