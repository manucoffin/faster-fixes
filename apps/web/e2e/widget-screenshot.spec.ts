import type {
  AreaSelectionGeometry,
  ElementSelectionGeometry,
} from "@fasterfixes/core";
import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";

import { dragAcross } from "./area-drag";
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

function countPixels({ data }: PNG, [red, green, blue]: number[]) {
  let count = 0;
  for (let offset = 0; offset < data.length; offset += 4) {
    if (
      data[offset] === red &&
      data[offset + 1] === green &&
      data[offset + 2] === blue
    ) {
      count += 1;
    }
  }
  return count;
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

  test("sends the Selection geometry of the clicked element", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "The geometry is browser-agnostic");
    const api = await stubWidgetApi(page);
    await seedReviewerToken(page);
    await page.goto(TALL_PAGE_PATH);

    await page.getByRole("button", { name: "Start feedback" }).click();
    const target = page.locator("#below-fold-target");
    // Scrolled, so viewport and document coordinates differ.
    await target.scrollIntoViewIfNeeded();
    await target.click();
    const box = await target.evaluate((element) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      return { left, top, width, height };
    });
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
    await page.getByPlaceholder("Describe the issue...").fill("Below the fold");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect.poll(() => api.createdFeedback().length).toBe(1);
    const selection = api.createdFeedback()[0]?.metadata?.selection as
      | ElementSelectionGeometry
      | undefined;
    expect(selection).toBeDefined();
    if (!selection) return;
    expect(selection.viewport).toEqual(viewport);
    expect(selection.element.left).toBeCloseTo(box.left, 1);
    expect(selection.element.top).toBeCloseTo(box.top, 1);
    expect(selection.element.width).toBeCloseTo(box.width, 1);
    expect(selection.element.height).toBeCloseTo(box.height, 1);
    const { click, element } = selection;
    expect(click.x).toBeGreaterThanOrEqual(element.left);
    expect(click.x).toBeLessThanOrEqual(element.left + element.width);
    expect(click.y).toBeGreaterThanOrEqual(element.top);
    expect(click.y).toBeLessThanOrEqual(element.top + element.height);
  });

  test("clamps an area to the viewport and widens a thin one", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "The geometry is browser-agnostic");
    const api = await stubWidgetApi(page);
    await seedReviewerToken(page);
    await page.goto(TALL_PAGE_PATH);
    const { width, height } = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    const submitArea = async (comment: string) => {
      await page.getByPlaceholder("Describe the issue...").fill(comment);
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(page.getByPlaceholder("Describe the issue...")).toBeHidden();
    };
    const start = page.getByRole("button", { name: "Start feedback" });

    await start.click();
    // Released past the bottom right corner, outside the page.
    await dragAcross(
      page,
      { x: width - 100, y: height - 80 },
      { x: width + 50, y: height + 50 },
    );
    await submitArea("Past the edge");

    await start.click();
    // A horizontal stroke with no height.
    await dragAcross(page, { x: 200, y: 300 }, { x: 260, y: 300 });
    await submitArea("Along one axis");

    await expect.poll(() => api.createdFeedback().length).toBe(2);
    const [clamped, thin] = api
      .createdFeedback()
      .map((created) => created?.metadata?.selection as AreaSelectionGeometry);
    expect(clamped?.area).toEqual({
      left: width - 100,
      top: height - 80,
      width: 100,
      height: 80,
    });
    expect(thin?.area).toEqual({ left: 200, top: 300, width: 60, height: 8 });
  });

  test("captures the full, unframed viewport for an area", async ({ page }) => {
    const api = await stubWidgetApi(page);
    await seedReviewerToken(page);
    await page.goto(TALL_PAGE_PATH);
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
    }));

    await page.getByRole("button", { name: "Start feedback" }).click();
    await dragAcross(page, { x: 40, y: 40 }, { x: 240, y: 200 });
    await page.getByPlaceholder("Describe the issue...").fill("An area");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect
      .poll(() => api.requestsTo("PUT", SCREENSHOT_PATH).length, {
        timeout: 20_000,
      })
      .toBe(1);
    const [attach] = api.requestsTo("PUT", SCREENSHOT_PATH);
    const image = readUploadedPng(
      attach?.body ?? Buffer.alloc(0),
      attach?.headers["content-type"] ?? "",
    );
    const scale = image.width / viewport.width;
    expect(image.height / scale).toBeCloseTo(viewport.height, 0);
    expect(isUniformColour(image)).toBe(false);
  });

  test("leaves the cursor hint out of the Screenshot", async ({ page }) => {
    const api = await stubWidgetApi(page);
    await seedReviewerToken(page);
    await page.goto(TALL_PAGE_PATH);
    await page.addStyleTag({
      content:
        "[data-ff-widget]::part(hint) { background: rgb(255, 0, 255); box-shadow: none; }",
    });

    await page.getByRole("button", { name: "Start feedback" }).click();
    const target = page.locator("#below-fold-target");
    await target.scrollIntoViewIfNeeded();
    await target.hover();
    await expect(page.locator('[part="hint"]')).toBeVisible();
    await target.click();
    await page.getByPlaceholder("Describe the issue...").fill("No hint");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect
      .poll(() => api.requestsTo("PUT", SCREENSHOT_PATH).length, {
        timeout: 20_000,
      })
      .toBe(1);
    const [attach] = api.requestsTo("PUT", SCREENSHOT_PATH);
    const image = readUploadedPng(
      attach?.body ?? Buffer.alloc(0),
      attach?.headers["content-type"] ?? "",
    );
    expect(isUniformColour(image)).toBe(false);
    expect(countPixels(image, [255, 0, 255])).toBe(0);
  });

  test("leaves out an element under data-ff-block", async ({ page }) => {
    const api = await stubWidgetApi(page);
    await seedReviewerToken(page);
    await page.goto(TALL_PAGE_PATH);
    await page.evaluate(() => {
      const box = (colour: string, left: number, blocked: boolean) => {
        const element = document.createElement("div");
        if (blocked) element.setAttribute("data-ff-block", "");
        element.style.cssText = `position: fixed; top: 100px; left: ${String(left)}px; width: 80px; height: 80px; z-index: 1; background: ${colour};`;
        document.body.appendChild(element);
      };
      box("rgb(255, 0, 0)", 100, true);
      box("rgb(0, 0, 255)", 300, false);
    });

    await page.getByRole("button", { name: "Start feedback" }).click();
    await page.locator("#below-fold-target").click();
    await page.getByPlaceholder("Describe the issue...").fill("Blocked");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect
      .poll(() => api.requestsTo("PUT", SCREENSHOT_PATH).length, {
        timeout: 20_000,
      })
      .toBe(1);
    const [attach] = api.requestsTo("PUT", SCREENSHOT_PATH);
    const image = readUploadedPng(
      attach?.body ?? Buffer.alloc(0),
      attach?.headers["content-type"] ?? "",
    );
    expect(countPixels(image, [0, 0, 255])).toBeGreaterThan(0);
    expect(countPixels(image, [255, 0, 0])).toBe(0);
  });
});
