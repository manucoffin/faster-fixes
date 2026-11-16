import { getStorageObject } from "@/server/storage/objects";
import {
  createCardAttachment,
  TRELLO_ATTACHMENT_MAX_BYTES,
} from "./trello-client";
import { withTrelloAccessToken } from "./token-access";

type ScreenshotForCover = {
  key: string;
  filename: string;
  mimeType: string;
  size: bigint | number;
};

type CreateTrelloCardCoverInput = {
  organizationId: string;
  cardId: string;
  screenshot: ScreenshotForCover | null;
};

type CreateTrelloCardCoverDeps = {
  readFile: (key: string) => Promise<Buffer | null>;
  uploadAttachment: (
    organizationId: string,
    cardId: string,
    file: { file: Buffer; name: string; mimeType: string },
  ) => Promise<unknown>;
};

const defaultDeps: CreateTrelloCardCoverDeps = {
  readFile: (key) => getStorageObject({ key }),
  uploadAttachment: (organizationId, cardId, file) =>
    withTrelloAccessToken(organizationId, (token) =>
      createCardAttachment(token, cardId, { ...file, setCover: true }),
    ),
};

/**
 * Attaches the Feedback's Screenshot to its card as a file set as cover, so
 * it outlives any signed URL. Never throws: a card without its cover still
 * links to the Feedback in the dashboard, so a failed upload must not fail
 * or retry the card.
 */
export async function createTrelloCardCover(
  { organizationId, cardId, screenshot }: CreateTrelloCardCoverInput,
  deps: CreateTrelloCardCoverDeps = defaultDeps,
) {
  if (!screenshot) return { attached: false, reason: "no_screenshot" } as const;
  if (Number(screenshot.size) > TRELLO_ATTACHMENT_MAX_BYTES) {
    return { attached: false, reason: "screenshot_too_large" } as const;
  }

  try {
    const file = await deps.readFile(screenshot.key);
    if (!file) {
      return { attached: false, reason: "screenshot_missing" } as const;
    }

    await deps.uploadAttachment(organizationId, cardId, {
      file,
      name: screenshot.filename,
      mimeType: screenshot.mimeType,
    });
    return { attached: true } as const;
  } catch {
    return { attached: false, reason: "upload_failed" } as const;
  }
}

export type CreateTrelloCardCoverOutput = Awaited<
  ReturnType<typeof createTrelloCardCover>
>;
