import { IntegrationConfigurationError } from "../../_services/integration-configuration-error";

/**
 * Where Trello delivers one Project link's webhook. Trello refuses a second
 * webhook with the same token, callback and board, so the link id in the query
 * keeps two Projects linked to one Trello board apart, and tells the route which
 * link a delivery is for. Trello signs this exact string, so registration and
 * verification must both build it here.
 *
 * Trello must be able to reach it, which localhost is not, hence the
 * TRELLO_WEBHOOK_BASE_URL override for tunnelled local development.
 */
export function getTrelloWebhookCallbackUrl(linkId: string): string {
  const base =
    process.env.TRELLO_WEBHOOK_BASE_URL ??
    process.env.BETTER_AUTH_URL ??
    process.env.BASE_URL;

  if (!base) {
    throw new IntegrationConfigurationError(
      "Cannot resolve the Trello webhook URL: set TRELLO_WEBHOOK_BASE_URL or BETTER_AUTH_URL.",
    );
  }

  return `${base.replace(/\/$/, "")}/api/webhooks/trello?link=${encodeURIComponent(linkId)}`;
}
