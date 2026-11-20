import { rethrowDomainErrorsAsNonRetriable } from "@/server/errors/non-retriable";
import { prisma } from "@workspace/db";
import {
  feedbackStatusFromJiraStatusCategory,
  isJiraStatusCategoryMirroring,
} from "../../_helpers/jira/transition-mapping";
import type { TrackerAdapter } from "../apply-observed-issue-state";
import { fetchJiraIssueStatus } from "./jira-rest-client";
import { getValidJiraAccessToken } from "./token-access";

/** Jira behind Status convergence: two states, Done or not Done (ADR-0025). */
export function jiraTrackerAdapter(db: typeof prisma = prisma): TrackerAdapter {
  return {
    tracker: "jira",
    async readIssue({ id }) {
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
    isMirroring: (state, status) =>
      isJiraStatusCategoryMirroring(state.issueStatusCategory, status),
    getImpliedStatus: (state) =>
      feedbackStatusFromJiraStatusCategory(state.issueStatusCategory),
  };
}
