import { inngest } from "@/server/inngest";
import { prisma } from "@workspace/db";
import crypto from "crypto";
import type { TrackerWebhookOutcome } from "../../_types/webhook-outcome";

type HandleLinearWebhookInput = {
  /** The `linear-delivery` header, as the route read it. Linear omits it. */
  deliveryId: string | null;
  /** The raw body, kept for the replay key Linear leaves us to derive. */
  rawBody: string;
  /** The parsed body. Linear's own payload types are not installed. */
  payload: unknown;
};

type LinearWebhookPayload = {
  action: string;
  type: string;
  organizationId?: string;
  data?: Record<string, unknown>;
  webhookId?: string;
  webhookTimestamp?: number;
  url?: string;
};

/**
 * Owns what happens after a Linear delivery is authentic: replay protection,
 * the Installation lookup and the event emission. The route keeps the signature
 * verification and maps the outcome to HTTP.
 */
export async function handleLinearWebhook({
  deliveryId,
  rawBody,
  payload,
}: HandleLinearWebhookInput): Promise<TrackerWebhookOutcome> {
  const { action, type, organizationId, data } =
    payload as LinearWebhookPayload;

  if (!(await isFirstDelivery(deliveryId ?? hashOfBody(rawBody)))) {
    return { status: "skipped", reason: "duplicate_delivery" };
  }

  if (!organizationId) {
    return { status: "ignored", reason: "no_organization_id" };
  }

  const installation = await prisma.linearInstallation.findUnique({
    where: { linearOrgId: organizationId },
    select: { id: true },
  });

  if (!installation) {
    // Either a stale webhook from a disconnected workspace, or a workspace that
    // hasn't completed install. Acknowledge so Linear stops retrying.
    return { status: "ignored", reason: "no_installation" };
  }

  if (type === "Issue") {
    await inngest.send({
      name: "linear/webhook.issue",
      data: {
        action,
        organizationId,
        installationId: installation.id,
        issue: data,
      },
    });
    return { status: "accepted" };
  }

  if (type === "AppUserAuthentication") {
    if (action === "remove" || action === "revoke") {
      await inngest.send({
        name: "linear/oauth.revoked",
        data: { organizationId, installationId: installation.id },
      });
    }
    return { status: "accepted" };
  }

  return { status: "ignored", reason: `type:${type}` };
}

/**
 * The delivery row is the only durable record that a delivery was seen, so a
 * unique constraint violation on its key is the replay signal.
 */
async function isFirstDelivery(deliveryKey: string) {
  try {
    await prisma.rateLimit.create({
      data: {
        id: crypto.randomUUID(),
        key: `webhook:linear:${deliveryKey}`,
        count: 1,
        lastRequest: BigInt(Date.now()),
      },
    });
    return true;
  } catch {
    return false;
  }
}

/** Linear's `linear-delivery` header isn't always present. */
function hashOfBody(rawBody: string) {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}
