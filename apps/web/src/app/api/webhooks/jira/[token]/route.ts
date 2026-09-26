import { findJiraInstallationByWebhookToken } from "@/app/_domains/integration/_services/jira/find-jira-installation-by-webhook-token";
import { handleJiraWebhook } from "@/app/_domains/integration/_services/jira/handle-jira-webhook";
import { type NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ token: string }> };

/**
 * Inbound Jira Cloud webhooks.
 *
 * Jira dynamic webhooks carry no signature, so authenticity rests entirely on the
 * unguessable per-installation token in the path (ADR-0008) and, because a URL can
 * leak, on the receiver treating the body as an untrusted hint. The route owns that
 * token check and the HTTP mapping; everything after it belongs to the
 * orchestration service.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  const installation = await findJiraInstallationByWebhookToken(token);

  if (!installation) {
    return NextResponse.json({ error: "Unknown webhook" }, { status: 401 });
  }

  const rawBody = await req.text();

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const outcome = await handleJiraWebhook({
    installationId: installation.id,
    deliveryId: req.headers.get("x-atlassian-webhook-identifier"),
    rawBody,
    payload,
  });

  if (outcome.status === "skipped") {
    return NextResponse.json({ ok: true, skipped: outcome.reason });
  }

  // Like Linear and unlike GitHub, Jira's ignored deliveries carry their reason
  // in the body. It is echoed verbatim so an already registered webhook sees no
  // difference.
  if (outcome.status === "ignored") {
    return NextResponse.json({ ok: true, ignored: outcome.reason });
  }

  return NextResponse.json({ ok: true });
}
