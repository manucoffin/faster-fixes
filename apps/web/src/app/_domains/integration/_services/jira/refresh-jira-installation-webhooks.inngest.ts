import { JiraNotConnectedError, JiraReauthRequiredError } from "./jira-errors";
import { isJiraUnauthorizedError } from "./jira-rest-client";
import { getValidJiraAccessToken } from "./token-access";
import { refreshProjectJiraWebhook } from "./webhook-registration";
import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";

export const refreshJiraInstallationWebhooks = inngest.createFunction(
  {
    id: "refresh-jira-installation-webhooks",
    retries: 2,
    concurrency: { key: "event.data.installationId", limit: 1 },
    triggers: [{ event: "jira/webhooks.refresh-requested" }],
  },
  async ({ event }) => {
    const { installationId } = event.data as { installationId: string };
    if (!installationId) return { skipped: "no_installation_id" };

    const installation = await prisma.jiraInstallation.findUnique({
      where: { id: installationId },
      select: {
        id: true,
        cloudId: true,
        organizationId: true,
        healthState: true,
        projectLinks: {
          where: { webhookRegistrationId: { not: null } },
          select: {
            id: true,
            webhookRegistrationId: true,
            linkHealthIssue: true,
          },
        },
      },
    });

    if (!installation) return { skipped: "installation_not_found" };
    if (installation.healthState !== "connected") {
      return { skipped: "installation_unhealthy" };
    }
    if (installation.projectLinks.length === 0) {
      return { skipped: "no_registered_webhooks" };
    }

    let accessToken: string;
    try {
      accessToken = await getValidJiraAccessToken(installation.organizationId);
    } catch (error) {
      // Both are terminal for this run and already surfaced: the token path flips
      // the installation and emits jira/oauth.revoked itself. Retrying would only
      // repeat a call that cannot succeed until a human reconnects.
      if (
        error instanceof JiraReauthRequiredError ||
        error instanceof JiraNotConnectedError
      ) {
        return { skipped: "reauthorization_required" };
      }
      throw error;
    }

    let refreshed = 0;
    const failedLinkIds: string[] = [];

    for (const link of installation.projectLinks) {
      try {
        await refreshProjectJiraWebhook(
          {
            id: link.id,
            webhookRegistrationId: link.webhookRegistrationId!,
            linkHealthIssue: link.linkHealthIssue,
          },
          accessToken,
          installation.cloudId,
        );
        refreshed += 1;
      } catch (error) {
        // A 401 mid-loop means the grant died between the token check and now.
        // Nothing else on this site can succeed, so report it once and stop
        // rather than flagging every remaining link with a misleading reason.
        if (isJiraUnauthorizedError(error)) {
          await inngest.send({
            name: "jira/oauth.revoked",
            data: { installationId: installation.id },
          });
          return { refreshed, revoked: true };
        }

        // Anything else is specific to this link. Recorded on the link rather than
        // rethrown: one broken registration must not stop the others, and the
        // settings UI is where a user can act on it.
        await prisma.projectJiraLink.update({
          where: { id: link.id },
          data: { linkHealthIssue: "webhook_refresh_failed" },
        });
        failedLinkIds.push(link.id);
      }
    }

    return { refreshed, failed: failedLinkIds.length };
  },
);
