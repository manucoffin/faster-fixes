/**
 * Characterization tests: they pin what Linear observes today (status, JSON
 * body, headers) on every row of the webhook failure policy, so the move to a
 * `handle-` orchestration service can be proven byte-compatible. They assert on
 * responses only, never on how the handler reaches them.
 *
 * A test here that has to change is a broken contract, not a test to update: a
 * newly rejected delivery starts a retry storm on Linear's side.
 */

import { createHash, createHmac } from "crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SIGNING_SECRET = "linear_signing_secret_characterization";
const DELIVERY_ID = "delivery_1";
const LINEAR_ORG_ID = "linear-org-1";
const INSTALLATION_ID = "installation-1";
const ROUTE_URL = "https://app.test/api/webhooks/linear";

const linearWebhookPrisma = {
  rateLimit: { create: vi.fn() },
  linearInstallation: { findUnique: vi.fn() },
};

const inngestSendDouble = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: linearWebhookPrisma }));

vi.mock("@/server/inngest", () => ({
  inngest: { send: inngestSendDouble },
}));

const { POST } = await import("./route");

type WebhookRequestInit = {
  deliveryId?: string | null;
  rawBody?: string;
  signature?: string | null;
};

function webhookRequest(init: WebhookRequestInit = {}) {
  const {
    deliveryId = DELIVERY_ID,
    rawBody = issuePayload("update"),
    signature,
  } = init;

  const headers = new Headers({ "content-type": "application/json" });
  if (deliveryId) headers.set("linear-delivery", deliveryId);

  const resolvedSignature =
    signature === undefined ? signWithSecret(rawBody) : signature;
  if (resolvedSignature) headers.set("linear-signature", resolvedSignature);

  return new NextRequest(ROUTE_URL, { method: "POST", headers, body: rawBody });
}

function signWithSecret(rawBody: string) {
  return createHmac("sha256", SIGNING_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");
}

function issuePayload(action: string) {
  return JSON.stringify({
    action,
    type: "Issue",
    organizationId: LINEAR_ORG_ID,
    data: { id: "issue-1", state: { type: "completed" } },
  });
}

function authenticationPayload(action: string) {
  return JSON.stringify({
    action,
    type: "AppUserAuthentication",
    organizationId: LINEAR_ORG_ID,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  linearWebhookPrisma.rateLimit.create.mockResolvedValue({});
  linearWebhookPrisma.linearInstallation.findUnique.mockResolvedValue({
    id: INSTALLATION_ID,
  });
  inngestSendDouble.mockResolvedValue(undefined);
  vi.stubEnv("LINEAR_WEBHOOK_SIGNING_SECRET", SIGNING_SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/webhooks/linear", () => {
  it("refuses a delivery whose signature does not match", async () => {
    const response = await POST(webhookRequest({ signature: "deadbeef" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid signature",
    });
    expect(linearWebhookPrisma.rateLimit.create).not.toHaveBeenCalled();
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("refuses a delivery with no signature header at all", async () => {
    const response = await POST(webhookRequest({ signature: null }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid signature",
    });
  });

  it("answers a missing signing secret with the configuration failure", async () => {
    vi.stubEnv("LINEAR_WEBHOOK_SIGNING_SECRET", "");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(webhookRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "webhook secret not configured",
    });
    expect(inngestSendDouble).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalled();

    error.mockRestore();
  });

  it("rejects a body it cannot read as JSON", async () => {
    const response = await POST(webhookRequest({ rawBody: "not json" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON" });
    expect(linearWebhookPrisma.rateLimit.create).not.toHaveBeenCalled();
  });

  it("answers a replayed delivery with the skipped marker", async () => {
    linearWebhookPrisma.rateLimit.create.mockRejectedValue(
      new Error("Unique constraint failed on the fields: (`key`)"),
    );

    const response = await POST(webhookRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      skipped: "duplicate_delivery",
    });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("records the delivery id so the next replay is recognised", async () => {
    await POST(webhookRequest());

    expect(linearWebhookPrisma.rateLimit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ key: `webhook:linear:${DELIVERY_ID}` }),
    });
  });

  it("falls back to a hash of the body when the delivery header is missing", async () => {
    const rawBody = issuePayload("update");
    const bodyHash = createHash("sha256").update(rawBody).digest("hex");

    const response = await POST(webhookRequest({ deliveryId: null, rawBody }));

    expect(response.status).toBe(200);
    expect(linearWebhookPrisma.rateLimit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ key: `webhook:linear:${bodyHash}` }),
    });
  });

  it("ignores a delivery that carries no organization id", async () => {
    const rawBody = JSON.stringify({ action: "update", type: "Issue" });

    const response = await POST(webhookRequest({ rawBody }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ignored: "no_organization_id",
    });
    expect(
      linearWebhookPrisma.linearInstallation.findUnique,
    ).not.toHaveBeenCalled();
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("ignores a delivery from a workspace with no installation", async () => {
    linearWebhookPrisma.linearInstallation.findUnique.mockResolvedValue(null);

    const response = await POST(webhookRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ignored: "no_installation",
    });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("ignores an event type it does not handle", async () => {
    const rawBody = JSON.stringify({
      action: "create",
      type: "Comment",
      organizationId: LINEAR_ORG_ID,
    });

    const response = await POST(webhookRequest({ rawBody }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ignored: "type:Comment",
    });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("mirrors an issue delivery to the status sync job", async () => {
    const response = await POST(webhookRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(
      linearWebhookPrisma.linearInstallation.findUnique,
    ).toHaveBeenCalledWith({
      where: { linearOrgId: LINEAR_ORG_ID },
      select: { id: true },
    });
    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "linear/webhook.issue",
      data: {
        action: "update",
        organizationId: LINEAR_ORG_ID,
        installationId: INSTALLATION_ID,
        issue: { id: "issue-1", state: { type: "completed" } },
      },
    });
  });

  it("queues the revocation job when the app authentication is removed", async () => {
    const response = await POST(
      webhookRequest({ rawBody: authenticationPayload("remove") }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "linear/oauth.revoked",
      data: {
        organizationId: LINEAR_ORG_ID,
        installationId: INSTALLATION_ID,
      },
    });
  });

  it("queues the revocation job when the app authentication is revoked", async () => {
    const response = await POST(
      webhookRequest({ rawBody: authenticationPayload("revoke") }),
    );

    expect(response.status).toBe(200);
    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "linear/oauth.revoked",
      data: {
        organizationId: LINEAR_ORG_ID,
        installationId: INSTALLATION_ID,
      },
    });
  });

  it("accepts another app authentication action without queueing anything", async () => {
    const response = await POST(
      webhookRequest({ rawBody: authenticationPayload("create") }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });
});
