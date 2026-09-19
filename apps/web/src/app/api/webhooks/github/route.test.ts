/**
 * Characterization tests: they pin what GitHub observes today (status, JSON
 * body, headers) on every row of the webhook failure policy, so the move to a
 * `handle-` orchestration service can be proven byte-compatible. They assert on
 * responses only, never on how the handler reaches them.
 *
 * A test here that has to change is a broken contract, not a test to update: a
 * newly rejected delivery starts a retry storm on GitHub's side.
 */

import { createHmac } from "crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const WEBHOOK_SECRET = "webhook_secret_characterization";
const DELIVERY_ID = "delivery_1";
const INSTALLATION_ID = 42;
const ROUTE_URL = "https://app.test/api/webhooks/github";

const githubWebhookPrisma = {
  rateLimit: { create: vi.fn() },
  gitHubInstallation: { deleteMany: vi.fn(), findUnique: vi.fn() },
};

const inngestSendDouble = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: githubWebhookPrisma }));

vi.mock("@/server/inngest", () => ({
  inngest: { send: inngestSendDouble },
}));

const { POST } = await import("./route");

type WebhookRequestInit = {
  event?: string | null;
  deliveryId?: string | null;
  rawBody?: string;
  signature?: string | null;
};

function webhookRequest(init: WebhookRequestInit = {}) {
  const {
    event = "issues",
    deliveryId = DELIVERY_ID,
    rawBody = "{}",
    signature,
  } = init;

  const headers = new Headers({ "content-type": "application/json" });
  if (event) headers.set("x-github-event", event);
  if (deliveryId) headers.set("x-github-delivery", deliveryId);

  const resolvedSignature =
    signature === undefined ? signWithSecret(rawBody) : signature;
  if (resolvedSignature) {
    headers.set("x-hub-signature-256", resolvedSignature);
  }

  return new NextRequest(ROUTE_URL, { method: "POST", headers, body: rawBody });
}

function signWithSecret(rawBody: string) {
  return `sha256=${createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody, "utf8")
    .digest("hex")}`;
}

function issuesPayload(action: string) {
  return JSON.stringify({
    action,
    issue: { number: 7, state: action === "closed" ? "closed" : "open" },
    repository: { full_name: "acme/site" },
    installation: { id: INSTALLATION_ID },
  });
}

function installationPayload(action: string) {
  return JSON.stringify({
    action,
    installation: {
      id: INSTALLATION_ID,
      account: { login: "acme", type: "Organization" },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  githubWebhookPrisma.rateLimit.create.mockResolvedValue({});
  githubWebhookPrisma.gitHubInstallation.deleteMany.mockResolvedValue({
    count: 1,
  });
  githubWebhookPrisma.gitHubInstallation.findUnique.mockResolvedValue(null);
  inngestSendDouble.mockResolvedValue(undefined);
  vi.stubEnv("GITHUB_WEBHOOK_SECRET", WEBHOOK_SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/webhooks/github", () => {
  it("refuses a delivery whose signature does not match", async () => {
    const response = await POST(
      webhookRequest({ signature: "sha256=deadbeef" }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid signature",
    });
    expect(githubWebhookPrisma.rateLimit.create).not.toHaveBeenCalled();
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("refuses a delivery with no signature header at all", async () => {
    const response = await POST(webhookRequest({ signature: null }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid signature",
    });
  });

  it("rejects a body it cannot read as JSON", async () => {
    const response = await POST(webhookRequest({ rawBody: "not json" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON payload",
    });
    expect(githubWebhookPrisma.rateLimit.create).not.toHaveBeenCalled();
  });

  it("answers a replayed delivery with the skipped marker", async () => {
    githubWebhookPrisma.rateLimit.create.mockRejectedValue(
      new Error("Unique constraint failed on the fields: (`key`)"),
    );

    const response = await POST(
      webhookRequest({ rawBody: issuesPayload("closed") }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      skipped: "duplicate delivery",
    });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("records the delivery id so the next replay is recognised", async () => {
    await POST(webhookRequest({ rawBody: issuesPayload("closed") }));

    expect(githubWebhookPrisma.rateLimit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ key: `webhook:github:${DELIVERY_ID}` }),
    });
  });

  it("accepts a delivery that carries no delivery id", async () => {
    const response = await POST(
      webhookRequest({ deliveryId: null, rawBody: issuesPayload("closed") }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(githubWebhookPrisma.rateLimit.create).not.toHaveBeenCalled();
    expect(inngestSendDouble).toHaveBeenCalledTimes(1);
  });

  it("ignores an event type it does not handle", async () => {
    const response = await POST(
      webhookRequest({ event: "push", rawBody: "{}" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(inngestSendDouble).not.toHaveBeenCalled();
    expect(
      githubWebhookPrisma.gitHubInstallation.deleteMany,
    ).not.toHaveBeenCalled();
  });

  it("ignores a delivery with no event header", async () => {
    const response = await POST(webhookRequest({ event: null }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("mirrors a closed issue to the status sync job", async () => {
    const response = await POST(
      webhookRequest({ rawBody: issuesPayload("closed") }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "github/webhook.issues",
      data: {
        action: "closed",
        issueNumber: 7,
        issueState: "closed",
        repoFullName: "acme/site",
      },
    });
  });

  it("mirrors a reopened issue to the status sync job", async () => {
    const response = await POST(
      webhookRequest({ rawBody: issuesPayload("reopened") }),
    );

    expect(response.status).toBe(200);
    expect(inngestSendDouble).toHaveBeenCalledWith({
      name: "github/webhook.issues",
      data: {
        action: "reopened",
        issueNumber: 7,
        issueState: "open",
        repoFullName: "acme/site",
      },
    });
  });

  it("ignores an issue action other than closed or reopened", async () => {
    const response = await POST(
      webhookRequest({ rawBody: issuesPayload("edited") }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("removes the installation when the app is uninstalled", async () => {
    const response = await POST(
      webhookRequest({
        event: "installation",
        rawBody: installationPayload("deleted"),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(
      githubWebhookPrisma.gitHubInstallation.deleteMany,
    ).toHaveBeenCalledWith({ where: { installationId: INSTALLATION_ID } });
  });

  it("answers an installation created with no matching record without writing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await POST(
      webhookRequest({
        event: "installation",
        rawBody: installationPayload("created"),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(
      githubWebhookPrisma.gitHubInstallation.findUnique,
    ).toHaveBeenCalledWith({ where: { installationId: INSTALLATION_ID } });
    expect(
      githubWebhookPrisma.gitHubInstallation.deleteMany,
    ).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it("ignores an installation action it does not handle", async () => {
    const response = await POST(
      webhookRequest({
        event: "installation",
        rawBody: installationPayload("suspend"),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(
      githubWebhookPrisma.gitHubInstallation.deleteMany,
    ).not.toHaveBeenCalled();
    expect(
      githubWebhookPrisma.gitHubInstallation.findUnique,
    ).not.toHaveBeenCalled();
  });
});
