import { prisma } from "@workspace/db";

/**
 * The per-installation token in a Jira webhook URL is the whole of its
 * authenticity: Jira dynamic webhooks carry no signature (ADR-0008). Finding the
 * Installation it belongs to is therefore the authentication step, which is why
 * it stays a read the route calls itself rather than part of the orchestration
 * service: a token that matches nothing is a 401 and never reaches the handler.
 */
export async function findJiraInstallationByWebhookToken(token: string) {
  return prisma.jiraInstallation.findUnique({
    where: { webhookToken: token },
    select: { id: true },
  });
}

export type FindJiraInstallationByWebhookTokenOutput = Awaited<
  ReturnType<typeof findJiraInstallationByWebhookToken>
>;
