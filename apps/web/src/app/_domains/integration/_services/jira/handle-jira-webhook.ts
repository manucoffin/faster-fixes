import { inngest } from "@/server/inngest";
import { buildEvent, jiraWebhookIssueEvent } from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import crypto from "crypto";
import type { TrackerWebhookOutcome } from "../../_types/webhook-outcome";

type HandleJiraWebhookInput = {
  /** The Installation the token in the path resolved to, as the route read it. */
  installationId: string;
  /** The `x-atlassian-webhook-identifier` header. Jira omits it on some retries. */
  deliveryId: string | null;
  /** The raw body, kept for the replay key the missing header leaves us to derive. */
  rawBody: string;
  /** The parsed body. Jira's own payload types are not installed. */
  payload: unknown;
};

type JiraWebhookPayload = {
  webhookEvent?: string;
  issue?: { id?: string };
};

const HANDLED_EVENTS = new Set(["jira:issue_updated", "jira:issue_deleted"]);

/**
 * Owns what happens after a Jira delivery is authentic: replay protection and
 * the event emission. The route keeps the token verification and maps the
 * outcome to HTTP.
 *
 * Nothing here reads state out of the payload beyond *which* issue to look at;
 * the sync job re-fetches that issue from Jira before touching a Feedback. The
 * worst a forged payload with a valid token can achieve is a wasted read.
 */
export async function handleJiraWebhook({
  installationId,
  deliveryId,
  rawBody,
  payload,
}: HandleJiraWebhookInput): Promise<TrackerWebhookOutcome> {
  const { webhookEvent, issue } = payload as JiraWebhookPayload;

  if (!(await isFirstDelivery(deliveryId ?? hashOfBody(rawBody)))) {
    return { status: "skipped", reason: "duplicate_delivery" };
  }

  if (!webhookEvent || !HANDLED_EVENTS.has(webhookEvent)) {
    return { status: "ignored", reason: `event:${webhookEvent}` };
  }

  const issueId = issue?.id;
  if (!issueId) {
    return { status: "ignored", reason: "no_issue_id" };
  }

  await inngest.send(
    buildEvent(jiraWebhookIssueEvent, {
      installationId,
      issueId,
      webhookEvent,
    }),
  );

  return { status: "accepted" };
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
        key: `webhook:jira:${deliveryKey}`,
        count: 1,
        lastRequest: BigInt(Date.now()),
      },
    });
    return true;
  } catch {
    return false;
  }
}

/** Jira sets the identifier header on dynamic webhook deliveries, but not always. */
function hashOfBody(rawBody: string) {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}
