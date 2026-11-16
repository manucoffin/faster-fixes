import { getTrelloWebhookCallbackUrl } from "../../_helpers/trello/webhook-callback-url";
import { withTrelloAccessToken } from "./token-access";
import { createWebhook } from "./trello-client";

/**
 * Registers the one webhook a Project link listens on and returns its id, so
 * unlinking and disconnecting can remove it. The link must already exist:
 * Trello calls the callback before accepting, and a delivery for a link the
 * route cannot find is answered so that Trello deletes the webhook.
 */
export async function registerTrelloBoardWebhook(
  organizationId: string,
  { linkId, boardId }: { linkId: string; boardId: string },
): Promise<string> {
  const callbackUrl = getTrelloWebhookCallbackUrl(linkId);

  const webhook = await withTrelloAccessToken(organizationId, (accessToken) =>
    createWebhook(accessToken, { callbackUrl, boardId }),
  );

  return webhook.id;
}
