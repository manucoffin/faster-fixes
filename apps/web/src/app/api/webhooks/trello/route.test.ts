/**
 * Contract tests: they pin what Trello observes (status, JSON body) on every
 * row of the webhook failure policy, like the Jira and Linear route tests. They
 * assert on responses only, never on how the handler reaches them.
 *
 * A test here that has to change is a broken contract, not a test to update: a
 * 410 makes Trello delete the webhook, and any other refusal starts retries.
 */

import { createHash, createHmac } from "crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CLIENT_SECRET = "trello_client_secret_contract";
const BASE_URL = "https://app.test";
const LINK_ID = "link-1";
const BOARD_ID = "board-1";
const ACTION_ID = "action-1";
const CALLBACK_URL = `${BASE_URL}/api/webhooks/trello?link=${LINK_ID}`;

const trelloWebhookPrisma = {
  rateLimit: { create: vi.fn() },
  projectTrelloLink: { findUnique: vi.fn() },
};

const inngestSendDouble = vi.fn();

vi.mock("@workspace/db", () => ({ prisma: trelloWebhookPrisma }));

vi.mock("@/server/inngest", () => ({
  inngest: { send: inngestSendDouble },
}));

const { HEAD, POST } = await import("./route");

type WebhookRequestInit = {
  linkId?: string | null;
  rawBody?: string;
  signature?: string | null;
};

function webhookRequest(init: WebhookRequestInit = {}) {
  const {
    linkId = LINK_ID,
    rawBody = cardPayload("updateCard", { idList: "list-new" }),
    signature,
  } = init;

  const url = linkId
    ? `${BASE_URL}/api/webhooks/trello?link=${linkId}`
    : `${BASE_URL}/api/webhooks/trello`;

  const headers = new Headers({ "content-type": "application/json" });
  const resolvedSignature =
    signature === undefined ? sign(rawBody, url) : signature;
  if (resolvedSignature) headers.set("x-trello-webhook", resolvedSignature);

  return new NextRequest(url, { method: "POST", headers, body: rawBody });
}

function sign(rawBody: string, callbackUrl: string) {
  return createHmac("sha1", CLIENT_SECRET)
    .update(rawBody + callbackUrl, "utf8")
    .digest("base64");
}

function cardPayload(
  type: string,
  old?: Record<string, unknown>,
  { actionId = ACTION_ID, boardId = BOARD_ID } = {},
) {
  return JSON.stringify({
    action: {
      id: actionId,
      type,
      data: { card: { id: "card-1" }, ...(old ? { old } : {}) },
    },
    model: { id: boardId },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("TRELLO_CLIENT_SECRET", CLIENT_SECRET);
  vi.stubEnv("TRELLO_WEBHOOK_BASE_URL", BASE_URL);
  trelloWebhookPrisma.projectTrelloLink.findUnique.mockResolvedValue({
    id: LINK_ID,
    boardId: BOARD_ID,
  });
  trelloWebhookPrisma.rateLimit.create.mockResolvedValue({});
  inngestSendDouble.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("HEAD /api/webhooks/trello", () => {
  it("answers the validation request Trello sends before accepting a webhook", () => {
    const response = HEAD();

    expect(response.status).toBe(200);
  });
});

describe("POST /api/webhooks/trello", () => {
  it("rejects a delivery with no signature", async () => {
    const response = await POST(webhookRequest({ signature: null }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid signature",
    });
    expect(trelloWebhookPrisma.rateLimit.create).not.toHaveBeenCalled();
  });

  it("rejects a delivery signed with another secret", async () => {
    const rawBody = cardPayload("deleteCard");
    const signature = createHmac("sha1", "another_secret")
      .update(rawBody + CALLBACK_URL, "utf8")
      .digest("base64");

    const response = await POST(webhookRequest({ rawBody, signature }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid signature",
    });
  });

  it("rejects a delivery signed for another link's callback URL", async () => {
    const rawBody = cardPayload("deleteCard");
    const signature = sign(
      rawBody,
      `${BASE_URL}/api/webhooks/trello?link=link-2`,
    );

    const response = await POST(webhookRequest({ rawBody, signature }));

    expect(response.status).toBe(401);
  });

  it("answers 500 when the client secret is not configured", async () => {
    vi.stubEnv("TRELLO_CLIENT_SECRET", "");

    const response = await POST(webhookRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "webhook secret not configured",
    });
  });

  it("rejects a body it cannot read as JSON", async () => {
    const response = await POST(webhookRequest({ rawBody: "not json" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid JSON" });
  });

  it("answers 410 for a link that no longer exists, so Trello deletes the webhook", async () => {
    trelloWebhookPrisma.projectTrelloLink.findUnique.mockResolvedValue(null);

    const response = await POST(webhookRequest());

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      error: "Unknown webhook",
    });
    expect(trelloWebhookPrisma.rateLimit.create).not.toHaveBeenCalled();
  });

  // Every callback URL Faster Fixes registers names a link, so one without it
  // cannot carry a valid signature.
  it("rejects a callback URL that names no link", async () => {
    const response = await POST(webhookRequest({ linkId: null }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid signature",
    });
    expect(
      trelloWebhookPrisma.projectTrelloLink.findUnique,
    ).not.toHaveBeenCalled();
  });

  it("answers 410 for a board that is not the link's board", async () => {
    const response = await POST(
      webhookRequest({
        rawBody: cardPayload("deleteCard", undefined, { boardId: "board-2" }),
      }),
    );

    expect(response.status).toBe(410);
  });

  it("looks the link up by the id in the callback URL", async () => {
    await POST(webhookRequest());

    expect(
      trelloWebhookPrisma.projectTrelloLink.findUnique,
    ).toHaveBeenCalledWith({
      where: { id: LINK_ID },
      select: { id: true, boardId: true },
    });
  });

  it("answers a replayed delivery with the skipped marker", async () => {
    trelloWebhookPrisma.rateLimit.create.mockRejectedValue(
      new Error("Unique constraint failed on the fields: (`key`)"),
    );

    const response = await POST(webhookRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      skipped: "duplicate_delivery",
    });
  });

  it("records the action id per link so the next replay is recognised", async () => {
    await POST(webhookRequest());

    expect(trelloWebhookPrisma.rateLimit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        key: `webhook:trello:${LINK_ID}:${ACTION_ID}`,
      }),
    });
  });

  it("falls back to a hash of the body when the action has no id", async () => {
    const rawBody = JSON.stringify({
      action: { type: "deleteCard", data: { card: { id: "card-1" } } },
      model: { id: BOARD_ID },
    });
    const bodyHash = createHash("sha256").update(rawBody).digest("hex");

    const response = await POST(webhookRequest({ rawBody }));

    expect(response.status).toBe(200);
    expect(trelloWebhookPrisma.rateLimit.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        key: `webhook:trello:${LINK_ID}:${bodyHash}`,
      }),
    });
  });

  it.each([
    ["a card moved to another list", "updateCard", { idList: "list-old" }],
    ["a card archived or unarchived", "updateCard", { closed: false }],
    ["a card deleted", "deleteCard", undefined],
    ["a card moved to another board", "moveCardFromBoard", undefined],
  ])("accepts %s", async (_label, type, old) => {
    const response = await POST(
      webhookRequest({ rawBody: cardPayload(type, old) }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("hands an accepted delivery to the Status sync with the link and the card", async () => {
    await POST(webhookRequest());

    expect(inngestSendDouble).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "trello/webhook.card",
        data: { projectTrelloLinkId: LINK_ID, cardId: "card-1" },
      }),
    );
  });

  it("hands nothing to the Status sync for an ignored delivery", async () => {
    await POST(
      webhookRequest({
        rawBody: cardPayload("updateCard", { name: "Old title" }),
      }),
    );

    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("hands nothing to the Status sync for a replayed delivery", async () => {
    trelloWebhookPrisma.rateLimit.create.mockRejectedValue(
      new Error("Unique constraint failed on the fields: (`key`)"),
    );

    await POST(webhookRequest());

    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it("hands nothing to the Status sync for an unknown link", async () => {
    trelloWebhookPrisma.projectTrelloLink.findUnique.mockResolvedValue(null);

    await POST(webhookRequest());

    expect(inngestSendDouble).not.toHaveBeenCalled();
  });

  it.each([
    ["a renamed card", { name: "Old title" }, "card_change:name"],
    ["an edited description", { desc: "Old" }, "card_change:desc"],
    ["a complete mark", { dueComplete: false }, "card_change:dueComplete"],
    ["a reordered card", { pos: 1024 }, "card_change:pos"],
  ])("ignores %s", async (_label, old, reason) => {
    const response = await POST(
      webhookRequest({ rawBody: cardPayload("updateCard", old) }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ignored: reason,
    });
  });

  it.each([
    ["a comment", "commentCard"],
    ["a new card", "createCard"],
    ["a card moved in from another board", "moveCardToBoard"],
  ])("ignores %s", async (_label, type) => {
    const response = await POST(webhookRequest({ rawBody: cardPayload(type) }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ignored: `action:${type}`,
    });
  });

  it("ignores a board action that names no card", async () => {
    const rawBody = JSON.stringify({
      action: { id: ACTION_ID, type: "updateList", data: {} },
      model: { id: BOARD_ID },
    });

    const response = await POST(webhookRequest({ rawBody }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      ignored: "action:updateList",
    });
  });
});
