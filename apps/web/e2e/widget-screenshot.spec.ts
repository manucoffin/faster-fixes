import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";

import { seedReviewerToken } from "./reviewer-token";
import { stubWidgetApi } from "./widget-api-stub";

const TALL_PAGE_PATH = "/e2e/script-embed?tall";
const SCREENSHOT_PATH = /^\/api\/v1\/feedback\/[^/]+\/screenshot$/;

// The upload is multipart; the image is the bytes between its part headers and the next boundary.
function readUploadedPng(body: Buffer, contentType: string) {
  const boundary = /boundary=([^;]+)/.exec(contentType)?.[1];
  expect(boundary).toBeDefined();
  const start = body.indexOf("\x89PNG", 0, "latin1");
  expect(start).toBeGreaterThan(-1);
  const end = body.indexOf(`\r\n--${boundary ?? ""}`, start, "latin1");
  return PNG.sync.read(body.subarray(start, end));
}

function isUniformColour({ data }: PNG) {
  for (let offset = 4; offset < data.length; offset += 4) {
    if (data.readUInt32BE(offset) !== data.readUInt32BE(0)) return false;
  }
  return true;
}

test.describe("screenshot capture", () => {
  test("captures the scrolled viewport of a tall page", async ({ page }) => {
    const api = await stubWidgetApi(page);
    await seedReviewerToken(page);
    await page.goto(TALL_PAGE_PATH);

    await page.getByRole("button", { name: "Start feedback" }).click();
    const target = page.locator("#below-fold-target");
    await target.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await target.click();
    await page.getByPlaceholder("Describe the issue...").fill("Below the fold");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect.poll(() => api.createdIds()).toHaveLength(1);
    await expect
      .poll(() => api.requestsTo("PUT", SCREENSHOT_PATH).length, {
        timeout: 20_000,
      })
      .toBe(1);
    const [attach] = api.requestsTo("PUT", SCREENSHOT_PATH);
    expect(attach?.path).toBe(
      `/api/v1/feedback/${api.createdIds()[0]}/screenshot`,
    );

    const image = readUploadedPng(
      attach?.body ?? Buffer.alloc(0),
      attach?.headers["content-type"] ?? "",
    );
    expect(image.width).toBeGreaterThan(0);
    expect(isUniformColour(image)).toBe(false);
  });
});
