import { expect, type Page, type Request, test } from "@playwright/test";

import {
  FIXTURE_PATH,
  locateReplayedPage,
  openLoadedPlayer,
  readTypes,
  sendToPlayer,
} from "./recording-player-fixture";

// The host the fixture Recordings load their images and fonts from.
const ASSET_ORIGIN = "http://assets.recording-fixture.test";

// A 1x1 transparent PNG.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/**
 * Answers every request for the asset host: the logo loads, anything missing
 * is a 404. Returns every request that left for it, with its referrer.
 */
async function routeAssets(page: Page) {
  const requests: { url: string; referer: string | null }[] = [];
  await page.context().route(`${ASSET_ORIGIN}/**`, async (route) => {
    const request = route.request();
    requests.push({
      url: request.url(),
      referer: await request.headerValue("referer"),
    });
    if (request.url() === `${ASSET_ORIGIN}/logo.png`) {
      await route.fulfill({ contentType: "image/png", body: PIXEL });
    } else {
      await route.fulfill({ status: 404 });
    }
  });
  return requests;
}

test.describe("Recording player document, isolation", () => {
  test("runs no script and lets nothing leave a Recording built to attack", async ({
    page,
  }) => {
    const requests = await routeAssets(page);
    const otherRequests: Request[] = [];
    page.context().on("request", (request) => {
      if (!request.url().startsWith("http://localhost")) {
        otherRequests.push(request);
      }
    });
    const openedPages: Page[] = [];
    page.context().on("page", (opened) => openedPages.push(opened));

    await openLoadedPlayer(page, `${FIXTURE_PATH}?recording=attack`);
    await sendToPlayer(page, { type: "seek", time: 1_000 });

    const replayedPage = locateReplayedPage(page);
    await expect(
      replayedPage.getByRole("heading", { name: "Attack" }),
    ).toBeVisible();
    await replayedPage
      .getByRole("link", { name: "Script link" })
      .dispatchEvent("click");
    await replayedPage
      .getByRole("link", { name: "Window link" })
      .dispatchEvent("click");
    await replayedPage
      .getByRole("button", { name: "Send" })
      .dispatchEvent("click");
    // Long enough for the meta refresh, the toggle event and any request to fire.
    await page.waitForTimeout(1_500);

    expect(requests).toEqual([]);
    expect(otherRequests.map((request) => request.url())).toEqual([]);
    expect(openedPages).toEqual([]);
    await expect(replayedPage.locator("body")).not.toHaveAttribute(
      "data-ran",
      /.*/,
    );
    // Nothing navigated: the fixture, the player and the replayed page are where they were.
    expect(new URL(page.url()).pathname).toBe(FIXTURE_PATH);
    expect(
      page.frames().map((frame) => new URL(frame.url(), page.url()).pathname),
    ).toContain("/recording-player");
    await expect(
      replayedPage.getByRole("heading", { name: "Attack" }),
    ).toBeVisible();
    expect(await readTypes(page)).not.toContain("failed");
  });

  test("loads an image from another host and sends it no referrer", async ({
    page,
  }) => {
    const requests = await routeAssets(page);

    await openLoadedPlayer(page, `${FIXTURE_PATH}?recording=page`);

    const logo = locateReplayedPage(page).getByRole("img", { name: "Logo" });
    await expect
      .poll(() =>
        logo.evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBe(1);
    expect(requests).toEqual([
      { url: `${ASSET_ORIGIN}/logo.png`, referer: null },
    ]);
    expect(await readTypes(page)).not.toContain("resourcesMissing");
  });

  for (const missing of ["image", "font"]) {
    test(`reports a ${missing} that fails to load as missing, once, and keeps playing`, async ({
      page,
    }) => {
      await routeAssets(page);

      await openLoadedPlayer(
        page,
        `${FIXTURE_PATH}?recording=page-missing-${missing}`,
      );
      await expect.poll(() => readTypes(page)).toContain("resourcesMissing");

      await sendToPlayer(page, { type: "play" });
      await expect.poll(() => readTypes(page)).toContain("state");
      const types = await readTypes(page);
      expect(types.filter((type) => type === "resourcesMissing")).toHaveLength(
        1,
      );
      expect(types).not.toContain("failed");
    });
  }

  test("plays masked content as recorded", async ({ page }) => {
    await routeAssets(page);

    await openLoadedPlayer(page, `${FIXTURE_PATH}?recording=page`);

    const replayedPage = locateReplayedPage(page);
    await expect(replayedPage.locator("#name")).toHaveValue("*******");
    await expect(replayedPage.locator("#masked")).toHaveText("**** *****");

    const blocked = replayedPage.locator(".blocked");
    await expect(blocked).toBeEmpty();
    // Measured inside the replayed page, which the player scales to fit.
    const size = await blocked.evaluate((box) => {
      const { width, height } = box.getBoundingClientRect();
      return { width, height };
    });
    expect(size).toEqual({ width: 320, height: 180 });
  });
});
