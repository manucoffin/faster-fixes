import { expect, type Page } from "@playwright/test";

/**
 * Drives the player document's fixture page, which frames the real player and
 * plays the dashboard's side of the protocol (`src/app/e2e/recording-player`).
 */

export const FIXTURE_PATH = "/e2e/recording-player";

type PlayerMessage = {
  type: string;
  time?: number;
  state?: string;
  receivedAt: number;
};

declare global {
  interface Window {
    playerMessages: PlayerMessage[];
    sendToPlayer: (message: Record<string, unknown>) => void;
    postFromStranger: (
      message: Record<string, unknown>,
      options?: { sameOrigin?: boolean },
    ) => Promise<void>;
  }
}

export function readPlayerMessages(page: Page) {
  return page.evaluate(() => window.playerMessages);
}

export async function readTypes(page: Page) {
  return (await readPlayerMessages(page)).map((message) => message.type);
}

export function sendToPlayer(page: Page, message: Record<string, unknown>) {
  return page.evaluate((sent) => {
    window.sendToPlayer(sent);
  }, message);
}

export async function openLoadedPlayer(page: Page, path = FIXTURE_PATH) {
  await page.goto(path);
  await expect.poll(() => readTypes(page)).toContain("loaded");
}

/** The recorded page, which rrweb rebuilds into a frame of its own inside the player. */
export function locateReplayedPage(page: Page) {
  return page.frameLocator("#player").frameLocator(".replayer-wrapper iframe");
}
