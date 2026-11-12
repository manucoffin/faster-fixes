import { expect, type Page, test } from "@playwright/test";

import {
  FIXTURE_PATH,
  locateReplayedPage,
  openLoadedPlayer,
  readPlayerMessages,
  readTypes,
  sendToPlayer,
} from "./recording-player-fixture";

// The sample Recording the fixture plays.
const SAMPLE_DURATION = 3_837;
const SAMPLE_VIEWPORT = { width: 1280, height: 720 };

async function readTimes(page: Page) {
  const messages = await readPlayerMessages(page);
  return messages.flatMap((message) =>
    message.type === "time" && message.time !== undefined ? [message.time] : [],
  );
}

async function readLastState(page: Page) {
  const messages = await readPlayerMessages(page);
  return messages.filter((message) => message.type === "state").at(-1)?.state;
}

// Seeks while paused and waits for the player to report the new playhead.
async function seekTo(page: Page, time: number) {
  await sendToPlayer(page, { type: "seek", time });
  await expect.poll(async () => (await readTimes(page)).at(-1)).toBe(time);
}

test.describe("Recording player document", () => {
  test("completes the handshake, loads the sample Recording and plays it", async ({
    page,
  }) => {
    await page.goto(FIXTURE_PATH);

    await expect.poll(() => readTypes(page)).toContain("ready");

    await expect(
      locateReplayedPage(page).getByText("Billing").first(),
    ).toBeVisible();

    await sendToPlayer(page, { type: "play" });

    await expect
      .poll(async () => (await readTimes(page)).length)
      .toBeGreaterThan(1);
    await expect
      .poll(async () => {
        const times = await readTimes(page);
        return (times.at(-1) ?? 0) - (times[0] ?? 0);
      })
      .toBeGreaterThan(500);
    expect(await readLastState(page)).toBe("playing");
  });

  test("reports the duration and the recorded viewport once loaded", async ({
    page,
  }) => {
    await openLoadedPlayer(page);

    const loaded = (await readPlayerMessages(page)).find(
      (message) => message.type === "loaded",
    );
    expect(loaded).toMatchObject({
      duration: SAMPLE_DURATION,
      viewport: SAMPLE_VIEWPORT,
    });
  });

  test("seeks to the last instant and stays paused there", async ({ page }) => {
    await openLoadedPlayer(page);

    await seekTo(page, SAMPLE_DURATION);
    // rrweb finishes on its own a moment after reaching the last event.
    await page.waitForTimeout(500);

    expect((await readTimes(page)).at(-1)).toBe(SAMPLE_DURATION);
    expect(await readLastState(page)).not.toBe("playing");
    expect(await readLastState(page)).not.toBe("ended");
  });

  test("lands a seek on the requested time", async ({ page }) => {
    await openLoadedPlayer(page);

    await seekTo(page, 1_500);
    await seekTo(page, 250);

    expect((await readTimes(page)).at(-1)).toBe(250);
  });

  test("advances the playhead faster at a higher speed", async ({ page }) => {
    await openLoadedPlayer(page);
    await sendToPlayer(page, { type: "speed", speed: 4 });
    await sendToPlayer(page, { type: "play" });

    await expect.poll(() => readLastState(page)).toBe("ended");

    const playing = (await readPlayerMessages(page)).filter(
      (message) =>
        message.type === "time" &&
        message.time !== undefined &&
        message.time < SAMPLE_DURATION,
    );
    const first = playing[0];
    const last = playing.at(-1);
    if (!first || !last) throw new Error("The player reported no playhead");
    const rate =
      ((last.time ?? 0) - (first.time ?? 0)) /
      (last.receivedAt - first.receivedAt);
    expect(rate).toBeGreaterThan(2.5);
  });

  test("reports the end and keeps the playhead on the last instant", async ({
    page,
  }) => {
    await openLoadedPlayer(page);
    await seekTo(page, SAMPLE_DURATION - 500);
    await sendToPlayer(page, { type: "play" });

    await expect.poll(() => readLastState(page)).toBe("ended");
    expect((await readTimes(page)).at(-1)).toBe(SAMPLE_DURATION);

    const count = (await readPlayerMessages(page)).length;
    await page.waitForTimeout(500);
    expect((await readPlayerMessages(page)).length).toBe(count);
  });

  test("completes the handshake when the player is ready first", async ({
    page,
  }) => {
    await openLoadedPlayer(page, `${FIXTURE_PATH}?listen=late`);

    // The first `ready` went unheard; the player answered `listening` instead.
    expect((await readTypes(page)).slice(0, 2)).toEqual(["ready", "loaded"]);
  });

  test("ignores a message of an unknown shape", async ({ page }) => {
    await openLoadedPlayer(page);
    await seekTo(page, 1_000);
    const count = (await readPlayerMessages(page)).length;

    await sendToPlayer(page, { type: "seek" });
    await sendToPlayer(page, { type: "seek", time: -1 });
    await sendToPlayer(page, { type: "speed", speed: 0 });
    await sendToPlayer(page, { type: "stop" });
    await page.evaluate(() => {
      document
        .querySelector<HTMLIFrameElement>("#player")
        ?.contentWindow?.postMessage({ type: "play" }, location.origin);
    });
    await page.waitForTimeout(300);

    expect((await readPlayerMessages(page)).length).toBe(count);
  });

  for (const sameOrigin of [false, true]) {
    test(`ignores a message from ${sameOrigin ? "another frame of the same origin" : "another origin"}`, async ({
      page,
    }) => {
      await openLoadedPlayer(page);
      await seekTo(page, 1_000);
      const count = (await readPlayerMessages(page)).length;

      await page.evaluate(
        (options) => window.postFromStranger({ type: "play" }, options),
        { sameOrigin },
      );
      await page.evaluate(
        (options) =>
          window.postFromStranger({ type: "seek", time: 0 }, options),
        { sameOrigin },
      );
      await page.waitForTimeout(300);

      expect((await readPlayerMessages(page)).length).toBe(count);
    });
  }

  test("reports a Recording it cannot play as failed, without an error in the page", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto(`${FIXTURE_PATH}?recording=unplayable`);

    await expect.poll(() => readTypes(page)).toContain("failed");
    expect(await readTypes(page)).not.toContain("loaded");

    // A failed player answers nothing more.
    const count = (await readPlayerMessages(page)).length;
    await sendToPlayer(page, { type: "play" });
    await sendToPlayer(page, { type: "seek", time: 1_000 });
    await page.waitForTimeout(300);
    expect((await readPlayerMessages(page)).length).toBe(count);
    expect(pageErrors).toEqual([]);
  });
});
