import { withTrelloAccessToken } from "./token-access";
import { deleteWebhook } from "./trello-client";
import { TrelloRequestError } from "./trello-request-error";

/**
 * Removes webhooks Faster Fixes registered, before their links are deleted.
 * Best effort by design: unlinking and disconnecting must still work while
 * Trello is down or the grant is dead. A webhook left behind converges anyway,
 * since the route answers a delivery for a deleted link with the 410 that makes
 * Trello delete the webhook.
 */
export async function deleteTrelloBoardWebhooks(
  organizationId: string,
  webhookIds: string[],
): Promise<void> {
  if (webhookIds.length === 0) return;

  try {
    await withTrelloAccessToken(organizationId, async (accessToken) => {
      for (const webhookId of webhookIds) {
        try {
          await deleteWebhook(accessToken, webhookId);
        } catch (error) {
          // A 401 is the grant, so it ends the loop through token access.
          if (error instanceof TrelloRequestError && error.status === 401) {
            throw error;
          }
          // A 404 means already gone: Trello deletes a board's webhooks on its
          // own when the member's grant is revoked.
          if (!(error instanceof TrelloRequestError && error.status === 404)) {
            console.error(
              "[trello] could not remove webhook",
              webhookId,
              error,
            );
          }
        }
      }
    });
  } catch (error) {
    console.error("[trello] could not remove board webhooks", error);
  }
}
