import { inngest } from "@/server/inngest";
import { verifyLinearWebhookSignature } from "@/server/linear/verify-webhook";
import { prisma } from "@workspace/db";
import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";

type LinearWebhookPayload = {
  action: string;
  type: string;
  organizationId?: string;
  data?: Record<string, unknown>;
  webhookId?: string;
  webhookTimestamp?: number;
  url?: string;
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("linear-signature");

  let signatureValid: boolean;
  try {
    signatureValid = verifyLinearWebhookSignature(rawBody, signature);
  } catch (e) {
    console.error("[linear-webhook] verifier threw", e);
    return NextResponse.json(
      { error: "webhook secret not configured" },
      { status: 500 },
    );
  }
  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LinearWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LinearWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Replay protection. Linear's `linear-delivery` header isn't always present;
  // fall back to a hash of the body when missing.
  const deliveryId =
    req.headers.get("linear-delivery") ??
    crypto.createHash("sha256").update(rawBody).digest("hex");

  try {
    await prisma.rateLimit.create({
      data: {
        id: crypto.randomUUID(),
        key: `webhook:linear:${deliveryId}`,
        count: 1,
        lastRequest: BigInt(Date.now()),
      },
    });
  } catch {
    return NextResponse.json({ ok: true, skipped: "duplicate_delivery" });
  }

  const organizationId = payload.organizationId;
  if (!organizationId) {
    return NextResponse.json({ ok: true, ignored: "no_organization_id" });
  }

  const installation = await prisma.linearInstallation.findUnique({
    where: { linearOrgId: organizationId },
    select: { id: true },
  });

  if (!installation) {
    // Either a stale webhook from a disconnected workspace, or a workspace that
    // hasn't completed install. Acknowledge so Linear stops retrying.
    return NextResponse.json({ ok: true, ignored: "no_installation" });
  }

  if (payload.type === "Issue") {
    await inngest.send({
      name: "linear/webhook.issue",
      data: {
        action: payload.action,
        organizationId,
        installationId: installation.id,
        issue: payload.data,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (payload.type === "AppUserAuthentication") {
    if (payload.action === "remove" || payload.action === "revoke") {
      await inngest.send({
        name: "linear/oauth.revoked",
        data: { organizationId, installationId: installation.id },
      });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, ignored: `type:${payload.type}` });
}
