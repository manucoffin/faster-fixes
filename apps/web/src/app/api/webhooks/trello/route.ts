import {
  handleTrelloWebhook,
  TRELLO_WEBHOOK_NO_PROJECT_LINK,
} from "@/app/_domains/integration/_services/trello/handle-trello-webhook";
import { verifyTrelloWebhookSignature } from "@/app/_domains/integration/_helpers/trello/verify-webhook-signature";
import { getTrelloWebhookCallbackUrl } from "@/app/_domains/integration/_helpers/trello/webhook-callback-url";
import { type NextRequest, NextResponse } from "next/server";

// Trello sends an unsigned HEAD to the callback URL before it accepts a new
// webhook, and refuses the registration unless it gets a 200.
export function HEAD() {
  return new Response(null, { status: 200 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const linkId = req.nextUrl.searchParams.get("link");
  const signature = req.headers.get("x-trello-webhook");

  // Rebuilt from configuration rather than read from the request: behind a
  // proxy the request URL is not the one Trello signed.
  let signatureValid: boolean;
  try {
    signatureValid = verifyTrelloWebhookSignature(
      rawBody,
      getTrelloWebhookCallbackUrl(linkId ?? ""),
      signature,
    );
  } catch (e) {
    console.error("[trello-webhook] verifier threw", e);
    return NextResponse.json(
      { error: "webhook secret not configured" },
      { status: 500 },
    );
  }
  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const outcome = await handleTrelloWebhook({ linkId, rawBody, payload });

  if (outcome.status === "skipped") {
    return NextResponse.json({ ok: true, skipped: outcome.reason });
  }

  if (outcome.status === "ignored") {
    // 410 is the one answer that makes Trello delete the webhook.
    if (outcome.reason === TRELLO_WEBHOOK_NO_PROJECT_LINK) {
      return NextResponse.json({ error: "Unknown webhook" }, { status: 410 });
    }
    return NextResponse.json({ ok: true, ignored: outcome.reason });
  }

  return NextResponse.json({ ok: true });
}
