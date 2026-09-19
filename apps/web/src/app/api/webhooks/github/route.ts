import { handleGitHubWebhook } from "@/app/_domains/integration/_services/github/handle-github-webhook";
import { verifyWebhookSignature } from "@/app/_domains/integration/_helpers/github/verify-webhook-signature";
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
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const outcome = await handleGitHubWebhook({
    event: req.headers.get("x-github-event"),
    deliveryId: req.headers.get("x-github-delivery"),
    payload,
  });

  if (outcome.status === "skipped") {
    return NextResponse.json({ ok: true, skipped: outcome.reason });
  }

  // An ignored delivery answers exactly like an accepted one: GitHub is told
  // the delivery arrived, and the reason stays in the outcome rather than the
  // body. A 4xx here would start a retry storm on a delivery we never want.
  return NextResponse.json({ ok: true });
}
