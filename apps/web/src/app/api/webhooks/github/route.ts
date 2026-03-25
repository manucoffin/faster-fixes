import { inngest } from "@/server/inngest";
import { verifyWebhookSignature } from "@/server/github/verify-webhook";
import { prisma } from "@workspace/db";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;

  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Replay protection: reject duplicate deliveries
  const deliveryId = req.headers.get("x-github-delivery");
  if (deliveryId) {
    try {
      await prisma.rateLimit.create({
        data: {
          id: crypto.randomUUID(),
          key: `webhook:github:${deliveryId}`,
          count: 1,
          lastRequest: BigInt(Date.now()),
        },
      });
    } catch {
      // Unique constraint violation — already processed this delivery
      return NextResponse.json({ ok: true, skipped: "duplicate delivery" });
    }
  }

  const event = req.headers.get("x-github-event");

  if (event === "installation") {
    await handleInstallationEvent(payload as InstallationPayload);
  }

  if (event === "issues") {
    await handleIssuesEvent(payload as IssuesPayload);
  }

  return NextResponse.json({ ok: true });
}

type InstallationPayload = {
  action: string;
  installation: {
    id: number;
    account: { login: string; type: string; avatar_url?: string };
  };
};

async function handleInstallationEvent(payload: InstallationPayload) {
  const { action, installation } = payload;

  if (action === "deleted") {
    await prisma.gitHubInstallation.deleteMany({
      where: { installationId: installation.id },
    });
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
    }
  }
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

async function handleIssuesEvent(payload: IssuesPayload) {
  const { action, issue, repository } = payload;

  if (action !== "closed" && action !== "reopened") return;

  await inngest.send({
    name: "github/webhook.issues",
    data: {
      action,
      issueNumber: issue.number,
      issueState: issue.state,
      repoFullName: repository.full_name,
    },
  });
}
