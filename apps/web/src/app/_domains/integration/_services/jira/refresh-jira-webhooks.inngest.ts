import { prisma } from "@workspace/db";
import { inngest } from "@/server/inngest";
import {
  buildEvent,
  jiraWebhooksRefreshRequestedEvent,
} from "@/server/inngest/events";

/**
 * Jira expires dynamic webhook registrations 30 days after they are created, and
 * an expired registration fails silently: outbound mirroring keeps working while
 * inbound status sync simply goes quiet.
 *
 * Weekly rather than monthly so the schedule has headroom — two consecutive failed
 * runs still leave more than a fortnight before the cliff.
 *
 * This run only fans out. Doing the Jira calls inline would put every organization
 * in one execution, where a single slow site eats the 50s checkpoint budget and one
 * dead grant fails the batch for everyone.
 */
export const refreshJiraWebhooks = inngest.createFunction(
  {
    id: "refresh-jira-webhooks",
    retries: 1,
    triggers: [{ cron: "0 4 * * 1" }],
  },
  async () => {
    const installations = await prisma.jiraInstallation.findMany({
      // An installation already awaiting reconnection has no working token; its
      // webhooks are re-registered by the link flow once the user comes back.
      where: {
        healthState: "connected",
        projectLinks: { some: { webhookRegistrationId: { not: null } } },
      },
      select: { id: true },
    });

    if (installations.length === 0) return { requested: 0 };

    await inngest.send(
      installations.map((installation) =>
        buildEvent(jiraWebhooksRefreshRequestedEvent, {
          installationId: installation.id,
        }),
      ),
    );

    return { requested: installations.length };
  },
);
