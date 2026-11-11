import { expect, type Page, test } from "@playwright/test";

const FIXTURE_PATH = "/e2e/recording-player";

type PlayerMessage = { type: string; time?: number };

declare global {
  interface Window {
    playerMessages: PlayerMessage[];
    sendToPlayer: (message: { type: string }) => void;
  }
}

function readPlayerMessages(page: Page) {
  return page.evaluate(() => window.playerMessages);
}

async function readTimes(page: Page) {
  const messages = await readPlayerMessages(page);
  return messages.flatMap((message) =>
    message.type === "time" && message.time !== undefined ? [message.time] : [],
  );
}

test.describe("Recording player document", () => {
  test("completes the handshake, loads the sample Recording and plays it", async ({
    page,
  }) => {
    await page.goto(FIXTURE_PATH);

    await expect
      .poll(async () =>
        (await readPlayerMessages(page)).map((message) => message.type),
      )
      .toContain("ready");

    // rrweb rebuilds the recorded page into a frame of its own inside the player.
    const replayedPage = page
      .frameLocator("#player")
      .frameLocator(".replayer-wrapper iframe");
    await expect(replayedPage.getByText("Billing").first()).toBeVisible();

    await page.evaluate(() => {
      window.sendToPlayer({ type: "play" });
    });

    await expect
      .poll(async () => (await readTimes(page)).length)
      .toBeGreaterThan(1);
    await expect
      .poll(async () => {
        const times = await readTimes(page);
        return (times.at(-1) ?? 0) - (times[0] ?? 0);
      })
      .toBeGreaterThan(500);
  });
});
