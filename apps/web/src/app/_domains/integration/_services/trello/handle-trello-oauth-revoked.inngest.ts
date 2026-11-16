import { mailer } from "@/lib/mailer/client";
import { SENDER_EMAIL } from "@/lib/mailer/constants";
import {
  TrelloReconnectRequired,
  type TrelloReconnectRequiredProps,
} from "../../_components/trello/trello-reconnect-required";
import { getAppUrl } from "@/utils/url/get-app-url";
import { render } from "@react-email/components";
import { prisma } from "@workspace/db";
import { createElement } from "react";
import { inngest } from "@/server/inngest";
import { trelloOAuthRevokedEvent } from "@/server/inngest/events";

export const handleTrelloOAuthRevoked = inngest.createFunction(
  {
    id: "handle-trello-oauth-revoked",
    retries: 2,
    // Every failing sync re-reports the same revocation. Serializing per
    // installation is what makes the reconnectNotifiedAt check a real guard
    // instead of a race two concurrent runs both pass.
    concurrency: { key: "event.data.installationId", limit: 1 },
    triggers: [{ event: trelloOAuthRevokedEvent }],
  },
  async ({ event }) => {
    const { installationId } = event.data;
    if (!installationId) return { skipped: "no_installation_id" };

    const installation = await prisma.trelloInstallation.findUnique({
      where: { id: installationId },
      select: {
        id: true,
        memberDisplayName: true,
        healthState: true,
        reconnectNotifiedAt: true,
        organizationId: true,
        organization: { select: { name: true } },
      },
    });

    if (!installation) return { skipped: "installation_not_found" };

    // Token access flips the row before emitting, so a connected row means a
    // re-authorization landed since: emailing would ask to fix a healthy link.
    if (installation.healthState !== "reconnect_required") {
      return { skipped: "reconnected" };
    }

    if (installation.reconnectNotifiedAt) {
      return { skipped: "already_notified" };
    }

    // Only owners and admins can complete the OAuth flow (/api/trello/install
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
      createElement<TrelloReconnectRequiredProps>(TrelloReconnectRequired, {
        organizationName: installation.organization.name,
        memberDisplayName: installation.memberDisplayName,
        integrationsLink: `${getAppUrl()}/integrations`,
      }),
    );

    await Promise.all(
      recipients.map((to) =>
        mailer.emails.send({
          from: SENDER_EMAIL,
          to,
          subject: "Action required: reconnect Trello",
          body,
        }),
      ),
    );

    // Written only after the sends resolve: a mailer outage should leave the
    // marker unset so the retry actually delivers.
    await prisma.trelloInstallation.update({
      where: { id: installation.id },
      data: { reconnectNotifiedAt: new Date() },
    });

    return { installationId, notified: recipients.length };
  },
);
