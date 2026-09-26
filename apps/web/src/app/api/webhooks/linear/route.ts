import { handleLinearWebhook } from "@/app/_domains/integration/_services/linear/handle-linear-webhook";
import { verifyLinearWebhookSignature } from "@/app/_domains/integration/_helpers/linear/verify-webhook-signature";
import { type NextRequest, NextResponse } from "next/server";

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

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const outcome = await handleLinearWebhook({
    deliveryId: req.headers.get("linear-delivery"),
    rawBody,
    payload,
  });

  if (outcome.status === "skipped") {
    return NextResponse.json({ ok: true, skipped: outcome.reason });
  }

  // Unlike GitHub, Linear's ignored deliveries carry their reason in the body.
  // It is echoed verbatim so an already deployed webhook sees no difference.
  if (outcome.status === "ignored") {
    return NextResponse.json({ ok: true, ignored: outcome.reason });
  }

  return NextResponse.json({ ok: true });
}
