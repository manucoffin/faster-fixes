import { inngest } from "@/server/inngest";
import { buildEvent, githubWebhookIssuesEvent } from "@/server/inngest/events";
import { prisma } from "@workspace/db";
import crypto from "crypto";
import type { TrackerWebhookOutcome } from "../../_types/webhook-outcome";

type HandleGitHubWebhookInput = {
  /** The `x-github-event` header, as the route read it. */
  event: string | null;
  /** The `x-github-delivery` header: GitHub's replay protection key. */
  deliveryId: string | null;
  /** The parsed body. GitHub's own payload types are not installed. */
  payload: unknown;
};

/**
 * Owns what happens after a GitHub delivery is authentic: replay protection,
 * the Installation lookup and the event emission. The route keeps the signature
 * verification and maps the outcome to HTTP.
 */
export async function handleGitHubWebhook({
  event,
  deliveryId,
  payload,
}: HandleGitHubWebhookInput): Promise<TrackerWebhookOutcome> {
  if (deliveryId && !(await isFirstDelivery(deliveryId))) {
    return { status: "skipped", reason: "duplicate delivery" };
  }

  if (event === "installation") {
    return handleInstallationEvent(payload as InstallationPayload);
  }

  if (event === "issues") {
    return handleIssuesEvent(payload as IssuesPayload);
  }

  return { status: "ignored", reason: `unhandled event type: ${event ?? ""}` };
}

/**
 * The delivery row is the only durable record that a delivery was seen, so a
 * unique constraint violation on its key is the replay signal.
 */
async function isFirstDelivery(deliveryId: string) {
  try {
    await prisma.rateLimit.create({
      data: {
        id: crypto.randomUUID(),
        key: `webhook:github:${deliveryId}`,
        count: 1,
        lastRequest: BigInt(Date.now()),
      },
    });
    return true;
  } catch {
    return false;
  }
}

type InstallationPayload = {
  action: string;
  installation: {
    id: number;
    account: { login: string; type: string; avatar_url?: string };
  };
};

async function handleInstallationEvent(
  payload: InstallationPayload,
): Promise<TrackerWebhookOutcome> {
  const { action, installation } = payload;

  if (action === "deleted") {
    await prisma.gitHubInstallation.deleteMany({
      where: { installationId: installation.id },
    });
    return { status: "accepted" };
  }

  // "created" is handled by the setup URL callback, but handle as fallback
  if (action === "created") {
    const existing = await prisma.gitHubInstallation.findUnique({
      where: { installationId: installation.id },
    });
    if (!existing) {
      // Cannot create without org context — the setup URL is the primary path.
      // Log for debugging only.
      console.warn(
        `[github-webhook] installation.created for ${installation.id} but no matching record found. User should complete setup via the app.`,
      );
      return { status: "ignored", reason: "no matching installation record" };
    }
    return { status: "accepted" };
  }

  return {
    status: "ignored",
    reason: `unhandled installation action: ${action}`,
  };
}

type IssuesPayload = {
  action: string;
  issue: {
    number: number;
    state: string;
    state_reason?: string | null;
    node_id?: string;
  };
  repository: { full_name: string };
  installation?: { id: number };
};

async function handleIssuesEvent(
  payload: IssuesPayload,
): Promise<TrackerWebhookOutcome> {
  const { action, issue, repository } = payload;

  if (action !== "closed" && action !== "reopened") {
    return { status: "ignored", reason: `unhandled issues action: ${action}` };
  }

  await inngest.send(
    buildEvent(githubWebhookIssuesEvent, {
      action,
      issueNumber: issue.number,
      issueState: issue.state,
      repoFullName: repository.full_name,
    }),
  );

  return { status: "accepted" };
}
