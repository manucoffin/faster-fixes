import { prisma } from "@workspace/db";
import crypto from "crypto";
import type { TrackerWebhookOutcome } from "../../_types/webhook-outcome";

/**
 * The reason the route turns into a 410, the one answer that makes Trello
 * delete the webhook. Trello disables a failing webhook only after 30 days, so
 * any other answer would keep a dead link's webhook calling us for a month.
 */
export const TRELLO_WEBHOOK_NO_PROJECT_LINK = "no_project_link";

type HandleTrelloWebhookInput = {
  /** The `link` query parameter of the callback URL. */
  linkId: string | null;
  /** The raw body, kept for the replay key when the action has no id. */
  rawBody: string;
  /** The parsed body. Trello's own payload types are not installed. */
  payload: unknown;
};

type TrelloWebhookPayload = {
  action?: {
    id?: string;
    type?: string;
    data?: {
      card?: { id?: string };
      old?: Record<string, unknown>;
    };
  };
  model?: { id?: string };
};

// The card changes the Status sync reads. A rename, a description edit, a due
// date or the complete mark change neither.
const TRACKED_CARD_FIELDS = ["idList", "closed"];

/**
 * Owns what happens after a Trello delivery is authentic: the Project link
 * lookup, replay protection and the action filter. The route keeps the
 * validation request, the signature and the HTTP mapping.
 *
 * The payload is a hint only: the Status sync re-reads the card from Trello, so
 * only the action type and the card id are taken from it.
 */
export async function handleTrelloWebhook({
  linkId,
  rawBody,
  payload,
}: HandleTrelloWebhookInput): Promise<TrackerWebhookOutcome> {
  const { action, model } = payload as TrelloWebhookPayload;

  if (!linkId) {
    return { status: "ignored", reason: TRELLO_WEBHOOK_NO_PROJECT_LINK };
  }

  const link = await prisma.projectTrelloLink.findUnique({
    where: { id: linkId },
    select: { id: true, boardId: true },
  });

  // Unlinked, disconnected, or a webhook whose removal failed. Also a webhook
  // on another board than the link's, which Faster Fixes never registers.
  if (!link || model?.id !== link.boardId) {
    return { status: "ignored", reason: TRELLO_WEBHOOK_NO_PROJECT_LINK };
  }

  if (!(await isFirstDelivery(link.id, action?.id ?? hashOfBody(rawBody)))) {
    return { status: "skipped", reason: "duplicate_delivery" };
  }

  const type = action?.type;

  if (!action?.data?.card?.id) {
    return { status: "ignored", reason: `action:${type}` };
  }

  if (type === "deleteCard" || type === "moveCardFromBoard") {
    return { status: "accepted" };
  }

  if (type === "updateCard") {
    const changed = Object.keys(action.data.old ?? {});
    if (changed.some((field) => TRACKED_CARD_FIELDS.includes(field))) {
      return { status: "accepted" };
    }
    return {
      status: "ignored",
      reason: `card_change:${changed.sort().join(",")}`,
    };
  }

  return { status: "ignored", reason: `action:${type}` };
}

/**
 * The delivery row is the only durable record that a delivery was seen, so a
 * unique constraint violation on its key is the replay signal. The link id is
 * part of the key because one board action reaches every link on that board,
 * each through its own webhook.
 */
async function isFirstDelivery(linkId: string, deliveryKey: string) {
  try {
    await prisma.rateLimit.create({
      data: {
        id: crypto.randomUUID(),
        key: `webhook:trello:${linkId}:${deliveryKey}`,
        count: 1,
        lastRequest: BigInt(Date.now()),
      },
    });
    return true;
  } catch {
    return false;
  }
}

function hashOfBody(rawBody: string) {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}
