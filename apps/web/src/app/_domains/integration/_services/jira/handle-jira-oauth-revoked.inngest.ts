import { mailer } from "@/lib/mailer/client";
import { SENDER_EMAIL } from "@/lib/mailer/constants";
import {
  JiraReconnectRequired,
  type JiraReconnectRequiredProps,
} from "../../_components/jira/jira-reconnect-required";
import { getAppUrl } from "@/utils/url/get-app-url";
import { render } from "@react-email/components";
import { prisma } from "@workspace/db";
import { createElement } from "react";
import { inngest } from "@/server/inngest";
import { jiraOAuthRevokedEvent } from "@/server/inngest/events";

export const handleJiraOAuthRevoked = inngest.createFunction(
  {
    id: "handle-jira-oauth-revoked",
    retries: 2,
    // Every failing sync re-reports the same revocation. Serializing per
    // installation is what makes the reconnectNotifiedAt check a real guard
    // instead of a race two concurrent runs both pass.
    concurrency: { key: "event.data.installationId", limit: 1 },
    triggers: [{ event: jiraOAuthRevokedEvent }],
  },
  async ({ event }) => {
    const { installationId } = event.data;
    if (!installationId) return { skipped: "no_installation_id" };

    const installation = await prisma.jiraInstallation.findUnique({
      where: { id: installationId },
      select: {
        id: true,
        siteName: true,
        healthState: true,
        reconnectNotifiedAt: true,
        organizationId: true,
        organization: { select: { name: true } },
      },
    });

    if (!installation) return { skipped: "installation_not_found" };

    // The token path flips the row inside its own transaction, but a revocation
    // detected elsewhere (the webhook refresh cron) reaches here unflipped.
    if (installation.healthState !== "reconnect_required") {
      await prisma.jiraInstallation.update({
        where: { id: installation.id },
        data: { healthState: "reconnect_required" },
      });
    }

    if (installation.reconnectNotifiedAt) {
      return { skipped: "already_notified" };
    }

    // Only owners and admins can complete the OAuth flow (/api/jira/install
    // rejects everyone else), so notifying members would be a dead end.
    const admins = await prisma.member.findMany({
      where: {
        organizationId: installation.organizationId,
        role: { in: ["owner", "admin"] },
      },
      select: { user: { select: { email: true } } },
    });

    const recipients = [
      ...new Set(
        admins
          .map((member) => member.user.email.toLowerCase().trim())
          .filter(Boolean),
      ),
    ];

    if (recipients.length === 0) return { skipped: "no_recipients" };

    // createElement (not JSX) so this file stays .ts, matching the other
    // Inngest functions in this directory.
    const body = await render(
      createElement<JiraReconnectRequiredProps>(JiraReconnectRequired, {
        organizationName: installation.organization.name,
        siteName: installation.siteName,
        integrationsLink: `${getAppUrl()}/integrations`,
      }),
    );

    await Promise.all(
      recipients.map((to) =>
        mailer.emails.send({
          from: SENDER_EMAIL,
          to,
          subject: "Action required: reconnect Jira",
          body,
        }),
      ),
    );

    // Written only after the sends resolve: a mailer outage should leave the
    // marker unset so the retry actually delivers.
    await prisma.jiraInstallation.update({
      where: { id: installation.id },
      data: { reconnectNotifiedAt: new Date() },
    });

    return { installationId, notified: recipients.length };
  },
);
