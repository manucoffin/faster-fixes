import { prisma } from "@workspace/db";
import crypto from "crypto";
import {
  deleteJiraWebhook,
  JiraRequestError,
  refreshJiraWebhook,
  registerJiraWebhook,
} from "./jira-rest-client";
import { getValidJiraAccessToken } from "./token-access";
import { IntegrationConfigurationError } from "../integration-configuration-error";

// Jira expires dynamic webhook registrations 30 days after creation and does not
// report the expiry on the create response, so it is derived here. The refresh
// cron renews registrations before this date.
const WEBHOOK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Where Jira delivers this installation's webhooks, supplied to Jira at
 * registration time — unlike Connect apps, a 3LO app declares no base URL in the
 * developer console, so this value is the only thing that routes deliveries.
 *
 * Atlassian must be able to reach it, which localhost is not, hence the
 * JIRA_WEBHOOK_BASE_URL override for tunnelled local development. Production
 * falls through to the app's own public URL.
 */
export function getJiraWebhookUrl(webhookToken: string): string {
  const base =
    process.env.JIRA_WEBHOOK_BASE_URL ??
    process.env.BETTER_AUTH_URL ??
    process.env.BASE_URL;

  if (!base) {
    throw new IntegrationConfigurationError(
      "Cannot resolve the Jira webhook URL: set JIRA_WEBHOOK_BASE_URL or BETTER_AUTH_URL.",
    );
  }

  return `${base.replace(/\/$/, "")}/api/webhooks/jira/${webhookToken}`;
}

// Minted on first use rather than at install time so existing installations pick
// one up without a backfill.
async function ensureWebhookToken(installation: {
  id: string;
  webhookToken: string | null;
}): Promise<string> {
  if (installation.webhookToken) return installation.webhookToken;

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.jiraInstallation.update({
    where: { id: installation.id },
    data: { webhookToken: token },
  });

  return token;
}

/**
 * Points a fresh Jira webhook at the link's Jira project, replacing any previous
 * registration. Registration is scoped by JQL so an Organization mirroring into
 * several Jira projects gets one registration per Project link.
 *
 * Throws on failure — callers decide whether an unregistered webhook is fatal.
 * It generally is not: outbound mirroring keeps working, only inbound sync is
 * missing, and the health cron re-registers later.
 */
export async function registerProjectJiraWebhook(
  projectJiraLinkId: string,
): Promise<void> {
  const link = await prisma.projectJiraLink.findUnique({
    where: { id: projectJiraLinkId },
    include: { jiraInstallation: true },
  });

  if (!link) return;

  const { jiraInstallation: installation } = link;
  const accessToken = await getValidJiraAccessToken(
    installation.organizationId,
  );

  // A re-link may point at a different Jira project, which would leave the old
  // JQL-scoped registration delivering issues we no longer mirror.
  if (link.webhookRegistrationId) {
    await deleteJiraWebhook(
      accessToken,
      installation.cloudId,
      link.webhookRegistrationId,
    ).catch((error: unknown) => {
      console.warn(
        `[jira] could not delete stale webhook ${link.webhookRegistrationId}`,
        error,
      );
    });
  }

  const webhookToken = await ensureWebhookToken(installation);

  // Filter on the project id, not the key: Jira reissues keys when a project is
  // renamed, which would silently narrow the filter to nothing.
  const { webhookId } = await registerJiraWebhook(
    accessToken,
    installation.cloudId,
    {
      url: getJiraWebhookUrl(webhookToken),
      jqlFilter: `project = ${link.jiraProjectId}`,
    },
  );

  await prisma.projectJiraLink.update({
    where: { id: link.id },
    data: {
      webhookRegistrationId: webhookId,
      webhookExpiresAt: new Date(Date.now() + WEBHOOK_TTL_MS),
      ...(link.linkHealthIssue === "webhook_refresh_failed"
        ? { linkHealthIssue: null }
        : {}),
    },
  });
}

/**
 * Extends one link's registration so inbound sync survives the 30-day cliff, and
 * clears the health flag a previous failure may have set.
 *
 * Jira answers 400/404 for an id it no longer knows — the registration already
 * expired, or someone deleted it in Jira. Refreshing cannot bring it back, so the
 * link is re-registered instead; that is the difference between "inbound sync is
 * quiet for a week" and "inbound sync is quiet forever".
 *
 * Throws on unauthorized and on any other failure: the caller distinguishes a dead
 * grant (whole installation) from one bad link.
 */
export async function refreshProjectJiraWebhook(
  link: {
    id: string;
    webhookRegistrationId: string;
    linkHealthIssue: string | null;
  },
  accessToken: string,
  cloudId: string,
): Promise<void> {
  let expiresAt: Date;

  try {
    ({ expiresAt } = await refreshJiraWebhook(
      accessToken,
      cloudId,
      link.webhookRegistrationId,
    ));
  } catch (error) {
    const isUnknownRegistration =
      error instanceof JiraRequestError &&
      (error.status === 400 || error.status === 404);

    if (!isUnknownRegistration) throw error;

    await registerProjectJiraWebhook(link.id);
    return;
  }

  await prisma.projectJiraLink.update({
    where: { id: link.id },
    data: {
      webhookExpiresAt: expiresAt,
      // Only this slice's own flag is cleared; configuration drift recorded by the
      // creation slice is unrelated and stays until the link is re-picked.
      ...(link.linkHealthIssue === "webhook_refresh_failed"
        ? { linkHealthIssue: null }
        : {}),
    },
  });
}

/**
 * Best-effort removal of the Jira-side registration. Never throws: unlinking and
 * disconnecting must stay possible when the installation is already gone or needs
 * re-authorization, and a stranded registration only ever delivers events the
 * receiver drops for having no matching link.
 */
export async function deregisterProjectJiraWebhook(link: {
  webhookRegistrationId: string | null;
  jiraInstallation: { cloudId: string; organizationId: string };
}): Promise<void> {
  if (!link.webhookRegistrationId) return;

  try {
    const accessToken = await getValidJiraAccessToken(
      link.jiraInstallation.organizationId,
    );
    await deleteJiraWebhook(
      accessToken,
      link.jiraInstallation.cloudId,
      link.webhookRegistrationId,
    );
  } catch (error) {
    console.warn(
      `[jira] could not deregister webhook ${link.webhookRegistrationId}`,
      error,
    );
  }
}
