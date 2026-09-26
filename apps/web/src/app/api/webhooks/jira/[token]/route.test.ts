/**
 * Characterization tests: they pin what Jira observes today (status, JSON body,
 * headers) on every row of the webhook failure policy, so the move to a
 * `handle-` orchestration service can be proven byte-compatible. They assert on
 * responses only, never on how the handler reaches them.
 *
 * A test here that has to change is a broken contract, not a test to update: a
 * newly rejected delivery starts a retry storm on Jira's side.
 */

import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const WEBHOOK_TOKEN = "jira_webhook_token_characterization";
const DELIVERY_ID = "delivery_1";
const INSTALLATION_ID = "installation-1";
const ISSUE_ID = "10001";
const ROUTE_URL = "https://app.test/api/webhooks/jira";

const jiraWebhookPrisma = {
  rateLimit: { create: vi.fn() },
  jiraInstallation: { findUnique: vi.fn() },
};

const inngestSendDouble = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: jiraWebhookPrisma }));

vi.mock("@/server/inngest", () => ({
  inngest: { send: inngestSendDouble },
}));

const { POST } = await import("./route");

type WebhookRequestInit = {
  token?: string;
  deliveryId?: string | null;
  rawBody?: string;
};

function webhookRequest(init: WebhookRequestInit = {}) {
  const {
    token = WEBHOOK_TOKEN,
    deliveryId = DELIVERY_ID,
    rawBody = issuePayload("jira:issue_updated"),
  } = init;

  const headers = new Headers({ "content-type": "application/json" });
  if (deliveryId) headers.set("x-atlassian-webhook-identifier", deliveryId);

  const request = new NextRequest(`${ROUTE_URL}/${token}`, {
    method: "POST",
    headers,
    body: rawBody,
  });

  return [request, { params: Promise.resolve({ token }) }] as const;
}

function issuePayload(webhookEvent: string) {
  return JSON.stringify({ webhookEvent, issue: { id: ISSUE_ID } });
}

beforeEach(() => {
  vi.clearAllMocks();
  jiraWebhookPrisma.jiraInstallation.findUnique.mockResolvedValue({
    id: INSTALLATION_ID,
  });
  jiraWebhookPrisma.rateLimit.create.mockResolvedValue({});
  inngestSendDouble.mockResolvedValue(undefined);
});

describe("POST /api/webhooks/jira/[token]", () => {
  it("refuses a delivery whose token matches no installation", async () => {
    jiraWebhookPrisma.jiraInstallation.findUnique.mockResolvedValue(null);

    const response = await POST(...webhookRequest({ token: "unknown_token" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unknown webhook",
    });
    expect(jiraWebhookPrisma.rateLimit.create).not.toHaveBeenCalled();
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("looks the installation up by the token in the path", async () => {
    await POST(...webhookRequest());

    expect(jiraWebhookPrisma.jiraInstallation.findUnique).toHaveBeenCalledWith({
      where: { webhookToken: WEBHOOK_TOKEN },
      select: { id: true },
    });
  });

  it("rejects a body it cannot read as JSON", async () => {
    const response = await POST(...webhookRequest({ rawBody: "not json" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON" });
    expect(jiraWebhookPrisma.rateLimit.create).not.toHaveBeenCalled();
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("answers a replayed delivery with the skipped marker", async () => {
    jiraWebhookPrisma.rateLimit.create.mockRejectedValue(
      new Error("Unique constraint failed on the fields: (`key`)"),
    );

    const response = await POST(...webhookRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      skipped: "duplicate_delivery",
    });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("records the delivery identifier so the next replay is recognised", async () => {
    await POST(...webhookRequest());

    expect(jiraWebhookPrisma.rateLimit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ key: `webhook:jira:${DELIVERY_ID}` }),
    });
  });

  it("falls back to a hash of the body when the identifier header is missing", async () => {
    const rawBody = issuePayload("jira:issue_updated");
    const bodyHash = createHash("sha256").update(rawBody).digest("hex");

    const response = await POST(
      ...webhookRequest({ deliveryId: null, rawBody }),
    );

    expect(response.status).toBe(200);
    expect(jiraWebhookPrisma.rateLimit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ key: `webhook:jira:${bodyHash}` }),
    });
  });

  it("ignores an event type it does not handle", async () => {
    const response = await POST(
      ...webhookRequest({ rawBody: issuePayload("jira:issue_created") }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ignored: "event:jira:issue_created",
    });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("ignores a delivery that names no event at all", async () => {
    const response = await POST(
      ...webhookRequest({
        rawBody: JSON.stringify({ issue: { id: ISSUE_ID } }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ignored: "event:undefined",
    });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("ignores a handled event that carries no issue id", async () => {
    const response = await POST(
      ...webhookRequest({
        rawBody: JSON.stringify({ webhookEvent: "jira:issue_updated" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ignored: "no_issue_id",
    });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("mirrors an issue update to the status sync job", async () => {
    const response = await POST(...webhookRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "jira/webhook.issue",
      data: {
        installationId: INSTALLATION_ID,
        issueId: ISSUE_ID,
        webhookEvent: "jira:issue_updated",
      },
    });
  });

  it("mirrors an issue deletion to the status sync job", async () => {
    const response = await POST(
      ...webhookRequest({ rawBody: issuePayload("jira:issue_deleted") }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "jira/webhook.issue",
      data: {
        installationId: INSTALLATION_ID,
        issueId: ISSUE_ID,
        webhookEvent: "jira:issue_deleted",
      },
    });
  });
});
