import { describe, expect, it, vi } from "vitest";
import { createTrelloCardCover } from "./create-trello-card-cover";
import { TRELLO_ATTACHMENT_MAX_BYTES } from "./trello-client";
import { TrelloRequestError } from "./trello-request-error";

const SCREENSHOT = {
  key: "feedback-screenshots/project_1/shot.png",
  filename: "screenshot.png",
  mimeType: "image/png",
  size: BigInt(2048),
};

const FILE = Buffer.from("png-bytes");

function makeDeps(
  overrides: Partial<Parameters<typeof createTrelloCardCover>[1]> = {},
) {
  return {
    readFile: vi.fn(async () => FILE),
    uploadAttachment: vi.fn(async () => ({ id: "attachment_1" })),
    ...overrides,
  };
}

describe("createTrelloCardCover", () => {
  it("uploads the Screenshot to the card", async () => {
    const deps = makeDeps();

    const result = await createTrelloCardCover(
      {
        organizationId: "organization_1",
        cardId: "card_1",
        screenshot: SCREENSHOT,
      },
      deps,
    );

    expect(result).toEqual({ attached: true });
    expect(deps.uploadAttachment).toHaveBeenCalledWith(
      "organization_1",
      "card_1",
      {
        file: FILE,
        name: "screenshot.png",
        mimeType: "image/png",
      },
    );
  });

  it("does nothing for a Feedback without a Screenshot", async () => {
    const deps = makeDeps();

    const result = await createTrelloCardCover(
      { organizationId: "organization_1", cardId: "card_1", screenshot: null },
      deps,
    );

    expect(result).toEqual({ attached: false, reason: "no_screenshot" });
    expect(deps.uploadAttachment).not.toHaveBeenCalled();
  });

  it("skips a Screenshot over Trello's attachment limit", async () => {
    const deps = makeDeps();

    const result = await createTrelloCardCover(
      {
        organizationId: "organization_1",
        cardId: "card_1",
        screenshot: { ...SCREENSHOT, size: TRELLO_ATTACHMENT_MAX_BYTES + 1 },
      },
      deps,
    );

    expect(result).toEqual({ attached: false, reason: "screenshot_too_large" });
    expect(deps.uploadAttachment).not.toHaveBeenCalled();
  });

  it("skips a Screenshot missing from storage", async () => {
    const deps = makeDeps({ readFile: vi.fn(async () => null) });

    const result = await createTrelloCardCover(
      {
        organizationId: "organization_1",
        cardId: "card_1",
        screenshot: SCREENSHOT,
      },
      deps,
    );

    expect(result).toEqual({ attached: false, reason: "screenshot_missing" });
  });

  it("never throws when the upload fails", async () => {
    const deps = makeDeps({
      uploadAttachment: vi.fn(async () => {
        throw new TrelloRequestError(
          413,
          "File too large",
          "/cards/card_1/attachments",
        );
      }),
    });

    const result = await createTrelloCardCover(
      {
        organizationId: "organization_1",
        cardId: "card_1",
        screenshot: SCREENSHOT,
      },
      deps,
    );

    expect(result).toEqual({ attached: false, reason: "upload_failed" });
  });
});
