import type { AreaSelectionGeometry, FeedbackItem } from "@fasterfixes/core";
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

import { dragAcross } from "./area-drag";
import {
  selectOutsideDismissableDrawer,
  submitInsideFocusTrap,
} from "./host-dialog";
import {
  REVIEWER_TOKEN,
  seedReviewerToken,
  STORAGE_KEY_TOKEN,
  URL_PARAM_TOKEN,
} from "./reviewer-token";
import { stubWidgetApi } from "./widget-api-stub";
import { WIDGET_FIXTURES } from "./widget-fixtures";

function stubbedItem(
  pageUrl: string,
  overrides: Partial<FeedbackItem> = {},
): FeedbackItem {
  return {
    id: "fb_stubbed",
    status: "new",
    comment: "The heading is misaligned",
    pageUrl,
    clickX: 10,
    clickY: 10,
    selector: "h1",
    screenshotUrl: null,
    reviewer: { id: "e2e-reviewer", name: "E2E Reviewer" },
    createdAt: new Date().toISOString(),
    metadata: {
      pinAnchor: { x: 0.5, y: 0.5 },
      pinPlacement: { mode: "document", targetKind: "normal" },
    },
    ...overrides,
  };
}

// The pin sits on or just right of its anchor, vertically centred on it.
async function expectPinAt(pin: Locator, target: Locator, anchorX: number) {
  const pinBox = await pin.boundingBox();
  const targetBox = await target.boundingBox();
  expect(pinBox).not.toBeNull();
  expect(targetBox).not.toBeNull();
  if (!pinBox || !targetBox) return;
  expect(pinBox.x).toBeGreaterThanOrEqual(targetBox.x);
  expect(pinBox.x).toBeLessThanOrEqual(
    targetBox.x + targetBox.width * anchorX + 6,
  );
  const pinCenter = pinBox.y + pinBox.height / 2;
  expect(pinCenter).toBeGreaterThanOrEqual(targetBox.y - 1);
  expect(pinCenter).toBeLessThanOrEqual(targetBox.y + targetBox.height + 1);
}

for (const fixture of WIDGET_FIXTURES) {
  test.describe(fixture.name, () => {
    // The app's auth client asks for a session on load; answering it here keeps
    // the dev server from reaching for a database the suite does not have.
    test.beforeEach(async ({ page }) => {
      await page.route("**/api/auth/get-session", (route) =>
        route.fulfill({ contentType: "application/json", body: "null" }),
      );
    });

    test("stays hidden and silent without a Reviewer token", async ({
      page,
    }) => {
      const api = await stubWidgetApi(page);

      await page.goto(fixture.path);
      await page.waitForLoadState("networkidle");

      await expect(page.locator("[data-ff-widget]")).toHaveCount(0);
      expect(api.requestsTo("GET", "/api/v1/widget/config")).toHaveLength(0);
    });

    test("stores the token from the URL and strips the parameter", async ({
      page,
    }) => {
      await stubWidgetApi(page);

      await page.goto(`${fixture.path}?${URL_PARAM_TOKEN}=${REVIEWER_TOKEN}`);

      await expect(page).not.toHaveURL(new RegExp(URL_PARAM_TOKEN));
      await expect
        .poll(() =>
          page.evaluate(
            (key) => window.localStorage.getItem(key),
            STORAGE_KEY_TOKEN,
          ),
        )
        .toBe(REVIEWER_TOKEN);
    });

    test("shows the floating button when the config is enabled", async ({
      page,
    }) => {
      await stubWidgetApi(page, {
        config: { enabled: true, branding: false },
      });
      await seedReviewerToken(page);

      await page.goto(fixture.path);

      await expect(
        page.getByRole("button", { name: "Start feedback" }),
      ).toBeVisible();
    });

    test("annotates an element and submits Feedback", async ({
      page,
      browserName,
    }) => {
      const api = await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      await expect(
        page.getByRole("button", { name: "Exit feedback mode" }),
      ).toBeVisible();

      const target = page.locator("h1");
      await target.hover();
      await target.click();

      const comment = page.getByPlaceholder("Describe the issue...");
      await expect(comment).toBeFocused();
      await comment.fill("The heading overlaps the logo");
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(comment).toBeHidden();
      await expect.poll(() => api.createdFeedback().length).toBe(1);

      const [created] = api.createdFeedback();
      expect(created).toMatchObject({
        comment: "The heading overlaps the logo",
        pageUrl: page.url(),
        clickX: expect.any(Number),
        clickY: expect.any(Number),
        selector: expect.any(String),
        browserName: browserName === "firefox" ? "Firefox" : "Chrome",
        viewportWidth: page.viewportSize()?.width,
        metadata: {
          elementDescription: expect.stringContaining("h1"),
          selectors: expect.any(Object),
          pinAnchor: { x: expect.any(Number), y: expect.any(Number) },
          pinPlacement: { mode: "document", targetKind: "normal" },
        },
        diagnosticTrail: expect.any(Object),
      });
      // The selector must find the annotated element again.
      expect(
        await page.evaluate(
          (selector) => document.querySelector(selector)?.tagName,
          created?.selector ?? "",
        ),
      ).toBe("H1");
    });

    test("selects an area by dragging and submits Feedback", async ({
      page,
    }) => {
      const api = await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      const box = await page.locator("h1").boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      // Whole pixels, so the sent area can be compared exactly.
      const from = { x: Math.ceil(box.x) + 4, y: Math.ceil(box.y) + 4 };
      const to = {
        x: from.x + Math.min(Math.floor(box.width) - 10, 80),
        y: Math.floor(box.y + box.height) - 4,
      };

      const area = page.locator('[part="area"]');
      await page.mouse.move(from.x, from.y);
      await expect(page.locator('[part="overlay"]')).toBeVisible();
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 8 });
      await expect(area).toBeVisible();
      await expect(page.locator('[part="overlay"]')).toBeHidden();
      await page.mouse.up();

      const comment = page.getByPlaceholder("Describe the issue...");
      await expect(comment).toBeFocused();
      // Kept drawn while the Reviewer writes, with the form anchored to it.
      await expect(area).toBeVisible();
      const areaBox = await area.boundingBox();
      const formBox = await page.locator('[part="popover"]').boundingBox();
      expect(areaBox).not.toBeNull();
      expect(formBox).not.toBeNull();
      if (!areaBox || !formBox) return;
      expect(formBox.y).toBeGreaterThanOrEqual(areaBox.y + areaBox.height);
      await comment.fill("The heading is too close to the text");
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(comment).toBeHidden();
      await expect(area).toBeHidden();
      await expect.poll(() => api.createdFeedback().length).toBe(1);
      const [created] = api.createdFeedback();
      expect(created).not.toHaveProperty("clickX");
      expect(created).not.toHaveProperty("clickY");
      expect(created?.metadata).not.toHaveProperty("nearbyText");
      expect(created?.metadata).toMatchObject({
        elementDescription: expect.any(String),
        selectors: expect.any(Object),
        pinAnchor: { x: expect.any(Number), y: expect.any(Number) },
        pinPlacement: { mode: "document", targetKind: "normal" },
      });
      const selection = created?.metadata?.selection as AreaSelectionGeometry;
      expect(selection.viewport).toEqual({
        width: page.viewportSize()?.width,
        height: page.viewportSize()?.height,
      });
      expect(selection.area.left).toBeCloseTo(from.x, 0);
      expect(selection.area.top).toBeCloseTo(from.y, 0);
      expect(selection.area.width).toBeCloseTo(to.x - from.x, 0);
      expect(selection.area.height).toBeCloseTo(to.y - from.y, 0);
      expect(selection).not.toHaveProperty("click");
      // The selector names the container, whose box holds the whole area.
      const container = await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const { left, top, right, bottom } = element.getBoundingClientRect();
        return { left, top, right, bottom };
      }, created?.selector ?? "");
      expect(container).not.toBeNull();
      if (!container) return;
      expect(container.left).toBeLessThanOrEqual(from.x + 1);
      expect(container.top).toBeLessThanOrEqual(from.y + 1);
      expect(container.right).toBeGreaterThanOrEqual(to.x - 1);
      expect(container.bottom).toBeGreaterThanOrEqual(to.y - 1);
    });

    test("treats a press that travels less than 6 pixels as a click", async ({
      page,
    }) => {
      const api = await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      const box = await page.locator("h1").boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      const from = { x: box.x + 10, y: box.y + box.height / 2 };
      await dragAcross(page, from, { x: from.x + 3, y: from.y + 3 });

      await page.getByPlaceholder("Describe the issue...").fill("Small move");
      await expect(page.locator('[part="area"]')).toBeHidden();
      await page.getByRole("button", { name: "Submit" }).click();

      await expect.poll(() => api.createdFeedback().length).toBe(1);
      const [created] = api.createdFeedback();
      expect(created).toMatchObject({
        clickX: expect.any(Number),
        clickY: expect.any(Number),
        metadata: { elementDescription: expect.stringContaining("h1") },
      });
      expect(created?.metadata?.selection).toHaveProperty("click");
    });

    test("discards a drag on Escape and stays in annotation mode", async ({
      page,
    }) => {
      await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      const box = await page.locator("h1").boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      const area = page.locator('[part="area"]');
      await page.mouse.move(box.x + 2, box.y + 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 60, box.y + 30, { steps: 8 });
      await expect(area).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(area).toBeHidden();
      await page.mouse.move(box.x + 90, box.y + 40, { steps: 4 });
      await page.mouse.up();

      const comment = page.getByPlaceholder("Describe the issue...");
      await expect(area).toBeHidden();
      await expect(comment).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Exit feedback mode" }),
      ).toBeVisible();
      // Still annotating: the next click selects.
      await page.locator("h1").click();
      await expect(comment).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.mouse.move(box.x + 2, box.y + 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 60, box.y + 30, { steps: 8 });
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
      await page.mouse.up();
      await expect(
        page.getByRole("button", { name: "Start feedback" }),
      ).toBeVisible();
      await expect(comment).toHaveCount(0);
    });

    test("shows the hint by the cursor and hides it while dragging", async ({
      page,
    }) => {
      await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      const hint = page.locator('[part="hint"]');
      const box = await page.locator("h1").boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      const from = { x: box.x + 2, y: box.y + 2 };
      await page.mouse.move(from.x, from.y);
      await expect(hint).toBeHidden();

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.mouse.move(from.x, from.y, { steps: 4 });
      await expect(hint).toBeVisible();
      await expect(hint).toHaveText(
        "Click an element, or drag to select an area.",
      );
      const hintBox = await hint.boundingBox();
      expect(hintBox).not.toBeNull();
      if (!hintBox) return;
      expect(Math.abs(hintBox.x - from.x)).toBeLessThan(40);
      expect(Math.abs(hintBox.y - from.y)).toBeLessThan(40);
      // A hit test through the hint reaches the page, not the Widget.
      const hit = await page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y)?.hasAttribute("data-ff-widget"),
        { x: hintBox.x + hintBox.width / 2, y: hintBox.y + hintBox.height / 2 },
      );
      expect(hit).toBe(false);

      await page.mouse.down();
      await page.mouse.move(from.x + 80, from.y + 30, { steps: 8 });
      await expect(page.locator('[part="area"]')).toBeVisible();
      await expect(hint).toBeHidden();
      await page.keyboard.press("Escape");
      await page.mouse.up();
      await page.mouse.move(from.x + 90, from.y + 40, { steps: 4 });
      await expect(hint).toBeVisible();

      await page.locator("h1").click();
      await expect(
        page.getByPlaceholder("Describe the issue..."),
      ).toBeVisible();
      await expect(hint).toBeHidden();
    });

    test("selects no text while dragging", async ({ page }) => {
      await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      const box = await page.locator("h1").boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      await page.mouse.move(box.x + 1, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, {
        steps: 8,
      });
      expect(
        await page.evaluate(() => window.getSelection()?.toString() ?? ""),
      ).toBe("");
      await page.mouse.up();
      await expect(
        page.getByPlaceholder("Describe the issue..."),
      ).toBeVisible();
    });

    test("ignores a drag that starts on the Widget's own interface", async ({
      page,
    }) => {
      await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      const exit = page.getByRole("button", { name: "Exit feedback mode" });
      // Waits for the toolbar to settle, so the press lands on the control.
      await exit.hover();
      const box = await exit.boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      await dragAcross(page, from, { x: from.x - 120, y: from.y - 120 });

      await expect(page.locator('[part="area"]')).toBeHidden();
      await expect(page.getByPlaceholder("Describe the issue...")).toHaveCount(
        0,
      );
    });

    test.describe("on a touch screen", () => {
      test.use({ hasTouch: true });

      test("scrolls on a drag and selects an element on a tap", async ({
        page,
        browserName,
      }) => {
        test.skip(
          browserName !== "chromium",
          "Touch input is dispatched through the Chrome DevTools Protocol.",
        );
        await stubWidgetApi(page);
        await seedReviewerToken(page);
        await page.goto(fixture.path);
        await page.evaluate(() => {
          document.body.style.minHeight = "4000px";
        });

        await page.getByRole("button", { name: "Start feedback" }).click();
        const client = await page.context().newCDPSession(page);
        const x = 200;
        await client.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x, y: 400 }],
        });
        for (let y = 380; y >= 100; y -= 20) {
          await client.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [{ x, y }],
          });
        }
        await client.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });

        await expect
          .poll(() => page.evaluate(() => window.scrollY))
          .toBeGreaterThan(0);
        await expect(page.locator('[part="area"]')).toBeHidden();
        await expect(
          page.getByPlaceholder("Describe the issue..."),
        ).toHaveCount(0);

        await expect(page.locator('[part="hint"]')).toBeHidden();
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.locator("h1").tap();
        await expect(
          page.getByPlaceholder("Describe the issue..."),
        ).toBeVisible();
        await expect(page.locator('[part="area"]')).toBeHidden();
        await expect(page.locator('[part="hint"]')).toBeHidden();
      });
    });

    test("sends Custom metadata read at submission, not at init", async ({
      page,
    }) => {
      const api = await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      const start = page.getByRole("button", { name: "Start feedback" });
      await expect(start).toBeVisible();
      // Stands in for a sign-in: the host state changes once the Widget is running.
      await page.evaluate(() => {
        document.documentElement.classList.add("dark");
      });

      await start.click();
      await page.locator("h1").click();
      await page.getByPlaceholder("Describe the issue...").fill("Wrong theme");
      await page.getByRole("button", { name: "Submit" }).click();

      await expect.poll(() => api.createdFeedback().length).toBe(1);
      expect(api.createdFeedback()[0]?.customMetadata).toEqual({
        app: fixture.customMetadataApp,
        colorScheme: "dark",
      });
    });

    test("attaches a screenshot to the created Feedback", async ({ page }) => {
      const api = await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.locator("h1").click();
      const comment = page.getByPlaceholder("Describe the issue...");
      await comment.fill("The heading overlaps the logo");
      await page.getByRole("button", { name: "Submit" }).click();

      // The success state does not wait for the upload.
      await expect(comment).toBeHidden();
      expect(api.createdIds()).toHaveLength(1);

      const screenshotPath = /^\/api\/v1\/feedback\/[^/]+\/screenshot$/;
      await expect
        .poll(() => api.requestsTo("PUT", screenshotPath).length, {
          timeout: 15_000,
        })
        .toBe(1);
      const [attach] = api.requestsTo("PUT", screenshotPath);
      expect(attach?.path).toBe(
        `/api/v1/feedback/${api.createdIds()[0]}/screenshot`,
      );
      const body = attach?.body?.toString("latin1") ?? "";
      expect(body).toContain('name="screenshot"; filename="screenshot.png"');
      expect(body).toContain("Content-Type: image/png");
      // PNG signature
      expect(body).toContain("\x89PNG");
      // The capture sandbox is gone once the image is uploaded.
      await expect(
        page.locator('iframe[data-ff-widget], iframe[id^="__SANDBOX__"]'),
      ).toHaveCount(0);
    });

    test("leaves annotation mode on Escape without selecting", async ({
      page,
    }) => {
      await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.keyboard.press("Escape");

      await expect(
        page.getByRole("button", { name: "Start feedback" }),
      ).toBeVisible();
      await page.locator("h1").click();
      await expect(page.getByPlaceholder("Describe the issue...")).toHaveCount(
        0,
      );
    });

    test("shows a submitted Feedback as a pin on its element", async ({
      page,
    }) => {
      await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      const target = page.locator("h1");
      await target.click();
      await page
        .getByPlaceholder("Describe the issue...")
        .fill("The heading overlaps the logo");
      await page.getByRole("button", { name: "Submit" }).click();

      const pin = page.getByRole("button", {
        name: "Feedback: The heading overlaps the logo",
      });
      await expect(pin).toBeVisible();
      await expectPinAt(pin, target, 1);
    });

    test("renders the open Feedback of the page as pins on load", async ({
      page,
      baseURL,
    }) => {
      const pageUrl = new URL(fixture.path, baseURL).href;
      await stubWidgetApi(page, {
        feedback: [
          stubbedItem(pageUrl),
          stubbedItem(pageUrl, {
            id: "fb_resolved",
            status: "resolved",
            comment: "Already fixed",
          }),
          stubbedItem(new URL("/elsewhere", baseURL).href, {
            id: "fb_elsewhere",
            comment: "On another page",
          }),
        ],
      });
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      const pin = page.getByRole("button", {
        name: "Feedback: The heading is misaligned",
      });
      await expect(pin).toBeVisible();
      await expect(pin.locator(".pin-dot")).toHaveCSS(
        "background-color",
        "rgb(239, 68, 68)",
      );
      await expectPinAt(pin, page.locator("h1"), 0.5);
      await expect(
        page.getByRole("button", { name: /^Feedback: / }),
      ).toHaveCount(1);
    });

    test("places the pin of a dragged area at its top-left corner", async ({
      page,
    }) => {
      await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      const box = await page.locator("h1").boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;
      const from = { x: box.x + 20, y: box.y + 4 };
      await dragAcross(page, from, {
        x: from.x + Math.min(box.width - 30, 80),
        y: box.y + box.height - 4,
      });
      await page
        .getByPlaceholder("Describe the issue...")
        .fill("The heading is too close to the text");
      await page.getByRole("button", { name: "Submit" }).click();

      const dot = page
        .getByRole("button", {
          name: "Feedback: The heading is too close to the text",
        })
        .locator(".pin-dot");
      await expect(dot).toBeVisible();
      const dotBox = await dot.boundingBox();
      expect(dotBox).not.toBeNull();
      if (!dotBox) return;
      expect(dotBox.x + dotBox.width / 2).toBeCloseTo(from.x, -1);
      expect(dotBox.y + dotBox.height / 2).toBeCloseTo(from.y, -1);
    });

    test("redraws the area of an area Feedback from its pin", async ({
      page,
      baseURL,
    }) => {
      const pageUrl = new URL(fixture.path, baseURL).href;
      await stubWidgetApi(page, {
        feedback: [
          stubbedItem(pageUrl, {
            id: "fb_area",
            comment: "The gap is too wide",
            clickX: null,
            clickY: null,
            metadata: {
              pinAnchor: { x: 0.1, y: 0.2 },
              pinPlacement: { mode: "document", targetKind: "normal" },
              selection: {
                viewport: { width: 1280, height: 720 },
                area: { left: 0, top: 0, width: 60, height: 20 },
              },
            },
          }),
          stubbedItem(pageUrl, { id: "fb_element" }),
        ],
      });
      await seedReviewerToken(page);
      await page.goto(fixture.path);
      // Room to scroll, so the area can be seen following its container.
      await page.addStyleTag({
        content: "body { padding-bottom: 200vh !important; }",
      });

      const area = page.locator('[part~="pin-area"]');
      const highlight = page.locator(".highlight");
      // Drawn at the stored anchor in the heading's current box, at its stored size.
      const expectAreaAtAnchor = () =>
        expect
          .poll(async () => {
            const [areaBox, headingBox] = await Promise.all([
              area.boundingBox(),
              page.locator("h1").boundingBox(),
            ]);
            if (!areaBox || !headingBox) return null;
            return {
              // `abs` keeps a rounded -0 equal to 0.
              left: Math.abs(
                Math.round(areaBox.x - (headingBox.x + headingBox.width * 0.1)),
              ),
              top: Math.abs(
                Math.round(
                  areaBox.y - (headingBox.y + headingBox.height * 0.2),
                ),
              ),
              width: Math.round(areaBox.width),
              height: Math.round(areaBox.height),
            };
          })
          .toEqual({ left: 0, top: 0, width: 60, height: 20 });

      const areaPin = page.getByRole("button", {
        name: "Feedback: The gap is too wide",
      });
      await expect(areaPin).toBeVisible();
      await expect(area).toBeHidden();

      await areaPin.hover();
      await expect(area).toBeVisible();
      await expect(highlight).toBeHidden();
      await expectAreaAtAnchor();

      // An element pin still outlines its element.
      await page
        .getByRole("button", { name: "Feedback: The heading is misaligned" })
        .hover();
      await expect(highlight).toBeVisible();
      await expect(area).toBeHidden();

      await areaPin.click();
      await expect(page.locator('[part="popover"]')).toBeVisible();
      await page.mouse.move(1, 1);
      await expect(area).toBeVisible();
      await expectAreaAtAnchor();

      await page.evaluate(() => window.scrollBy(0, 40));
      await expectAreaAtAnchor();
      await page.setViewportSize({ width: 900, height: 700 });
      await expectAreaAtAnchor();
    });

    test("hides and shows the pins with the markers control", async ({
      page,
      baseURL,
    }) => {
      await stubWidgetApi(page, {
        feedback: [stubbedItem(new URL(fixture.path, baseURL).href)],
      });
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      const pin = page.getByRole("button", {
        name: "Feedback: The heading is misaligned",
      });
      await expect(pin).toBeVisible();

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.getByRole("button", { name: "Hide markers" }).click();
      await expect(pin).toBeHidden();

      await page.getByRole("button", { name: "Show markers" }).click();
      await expect(pin).toBeVisible();
    });

    test("lists the submitted Feedback and reveals resolved items on request", async ({
      page,
      baseURL,
    }) => {
      await stubWidgetApi(page, {
        feedback: [
          stubbedItem(new URL(fixture.path, baseURL).href, {
            id: "fb_resolved",
            status: "resolved",
            comment: "Already fixed",
          }),
        ],
      });
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.locator("h1").click();
      await page
        .getByPlaceholder("Describe the issue...")
        .fill("The heading overlaps the logo");
      await page.getByRole("button", { name: "Submit" }).click();
      await expect(
        page.getByRole("button", {
          name: "Feedback: The heading overlaps the logo",
        }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.getByRole("button", { name: "Show feedback list" }).click();
      await expect(
        page.getByRole("button", { name: "Hide feedback list" }),
      ).toBeVisible();

      // The pin label repeats the comment, so match the list row by its name.
      const row = page.getByRole("button", {
        name: /^The heading overlaps the logo/,
      });
      await expect(row).toBeVisible();
      const resolved = page.getByText("Already fixed", { exact: true });
      await expect(resolved).toBeHidden();

      await page.getByRole("button", { name: "Show resolved" }).click();
      await expect(resolved).toBeVisible();
      await page.getByRole("button", { name: "Hide resolved" }).click();
      await expect(resolved).toBeHidden();

      await page.getByRole("button", { name: "Hide feedback list" }).click();
      await expect(row).toBeHidden();
    });

    test("activates a list row of the current page", async ({
      page,
      baseURL,
    }) => {
      await stubWidgetApi(page, {
        feedback: [stubbedItem(new URL(fixture.path, baseURL).href)],
      });
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.getByRole("button", { name: "Show feedback list" }).click();
      await page
        .getByRole("button", { name: /^The heading is misaligned/ })
        .click();

      await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
      await expect(page.locator("h1")).toBeInViewport();
    });

    test("shows the pins of the new page after an in-app navigation", async ({
      page,
      baseURL,
    }) => {
      await stubWidgetApi(page, {
        feedback: [
          stubbedItem(new URL(fixture.path, baseURL).href),
          stubbedItem(new URL(fixture.otherPage.path, baseURL).href, {
            id: "fb_other",
            comment: "The other heading is too small",
          }),
        ],
      });
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      const pin = page.getByRole("button", {
        name: "Feedback: The heading is misaligned",
      });
      const otherPin = page.getByRole("button", {
        name: "Feedback: The other heading is too small",
      });
      await expect(pin).toBeVisible();
      await expect(otherPin).toHaveCount(0);

      await page
        .getByRole("link", { name: fixture.otherPage.linkName })
        .click();
      // The dev server compiles the other page on its first request.
      await expect(page).toHaveURL(
        new URL(fixture.otherPage.path, baseURL).href,
        { timeout: 30_000 },
      );
      await expect(otherPin).toBeVisible();
      await expect(pin).toHaveCount(0);

      // A popstate, not a click: nothing but the route change can close the popover.
      await otherPin.click();
      await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
      await page.goBack();
      await expect(page).toHaveURL(new URL(fixture.path, baseURL).href);
      await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
      await expect(pin).toBeVisible();
      await expect(otherPin).toHaveCount(0);
    });

    test("opens a list row of another page after navigating there", async ({
      page,
      baseURL,
    }) => {
      await stubWidgetApi(page, {
        feedback: [
          stubbedItem(new URL(fixture.otherPage.path, baseURL).href, {
            id: "fb_other",
            comment: "The other heading is too small",
          }),
        ],
      });
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.getByRole("button", { name: "Show feedback list" }).click();
      await page
        .getByText("The other heading is too small", { exact: true })
        .click();

      // The dev server compiles the other page on its first request.
      await expect(page).toHaveURL(
        new URL(fixture.otherPage.path, baseURL).href,
        { timeout: 30_000 },
      );
      await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
      await expect(page.locator("h1")).toBeInViewport();
      expect(
        await page.evaluate(() =>
          window.sessionStorage.getItem("ff_pending_feedback"),
        ),
      ).toBeNull();
    });

    test("links to the product site only when the config asks for branding", async ({
      page,
    }) => {
      await stubWidgetApi(page, { config: { enabled: true, branding: true } });
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.getByRole("button", { name: "Show feedback list" }).click();

      const link = page.getByRole("link", { name: "Powered by FasterFixes" });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute(
        "href",
        "https://faster-fixes.com?ref=widget",
      );
    });

    test("shows no branding link without branding in the config", async ({
      page,
    }) => {
      await stubWidgetApi(page);
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.getByRole("button", { name: "Show feedback list" }).click();

      await expect(page.getByText("No feedback on this page")).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Powered by FasterFixes" }),
      ).toHaveCount(0);
    });

    test("views, edits and deletes Feedback from its pin", async ({
      page,
      baseURL,
    }) => {
      const api = await stubWidgetApi(page, {
        feedback: [stubbedItem(new URL(fixture.path, baseURL).href)],
      });
      await seedReviewerToken(page);
      await page.goto(fixture.path);

      const pin = page.getByRole("button", {
        name: "Feedback: The heading is misaligned",
      });
      await pin.click();
      await expect(
        page
          .getByRole("paragraph")
          .filter({ hasText: "The heading is misaligned" }),
      ).toBeVisible();
      await expect(page.getByText("E2E Reviewer")).toBeVisible();

      await page.mouse.click(5, 300);
      await expect(page.getByText("E2E Reviewer")).toBeHidden();

      await pin.click();
      await page.getByRole("button", { name: "Edit" }).click();
      await page.locator("textarea").fill("The heading overlaps the logo");
      await page.getByRole("button", { name: "Save" }).click();

      await expect
        .poll(() => api.requestsTo("PUT", "/api/v1/feedback/fb_stubbed"))
        .toHaveLength(1);
      expect(
        JSON.parse(
          api
            .requestsTo("PUT", "/api/v1/feedback/fb_stubbed")[0]
            ?.body?.toString() ?? "null",
        ),
      ).toEqual({ comment: "The heading overlaps the logo" });
      const editedPin = page.getByRole("button", {
        name: "Feedback: The heading overlaps the logo",
      });
      await expect(editedPin).toBeVisible();
      await expect(page.getByText("E2E Reviewer")).toBeHidden();

      await editedPin.click();
      await page.getByRole("button", { name: "Delete" }).click();
      await expect(page.getByText("Delete this feedback?")).toBeVisible();
      expect(
        api.requestsTo("DELETE", "/api/v1/feedback/fb_stubbed"),
      ).toHaveLength(0);
      await page.getByRole("button", { name: "Delete" }).click();

      await expect
        .poll(() => api.requestsTo("DELETE", "/api/v1/feedback/fb_stubbed"))
        .toHaveLength(1);
      await expect(editedPin).toHaveCount(0);
      await expect(page.getByText("Delete this feedback?")).toBeHidden();
    });

    test("shows a server error in the pin popover", async ({
      page,
      baseURL,
    }) => {
      await stubWidgetApi(page, {
        feedback: [stubbedItem(new URL(fixture.path, baseURL).href)],
      });
      await seedReviewerToken(page);
      // Registered after the stub, so it answers first.
      await page.route("**/api/v1/feedback/fb_stubbed", (route) => {
        if (route.request().method() !== "PUT") return route.fallback();
        return route.fulfill({
          status: 500,
          headers: {
            "Access-Control-Allow-Origin":
              route.request().headers()["origin"] ?? "*",
          },
          contentType: "application/json",
          body: JSON.stringify({ error: "Storage unavailable" }),
        });
      });
      await page.goto(fixture.path);

      await page
        .getByRole("button", { name: "Feedback: The heading is misaligned" })
        .click();
      await page.getByRole("button", { name: "Edit" }).click();
      await page.locator("textarea").fill("Will not be saved");
      await page.getByRole("button", { name: "Save" }).click();

      await expect(page.getByText("Storage unavailable")).toBeVisible();
      await expect(page.locator("textarea")).toHaveValue("Will not be saved");
    });

    test("shows the server error with retry and cancel", async ({ page }) => {
      const api = await stubWidgetApi(page);
      await seedReviewerToken(page);
      let failNext = true;
      // Registered after the stub, so it answers first; the retry falls through.
      await page.route("**/api/v1/feedback", (route) => {
        if (route.request().method() !== "POST" || !failNext) {
          return route.fallback();
        }
        failNext = false;
        return route.fulfill({
          status: 500,
          headers: {
            "Access-Control-Allow-Origin":
              route.request().headers()["origin"] ?? "*",
          },
          contentType: "application/json",
          body: JSON.stringify({ error: "Storage unavailable" }),
        });
      });
      await page.goto(fixture.path);

      await page.getByRole("button", { name: "Start feedback" }).click();
      await page.locator("h1").click();
      await page
        .getByPlaceholder("Describe the issue...")
        .fill("Retry after a failure");
      await page.getByRole("button", { name: "Submit" }).click();

      await expect(page.getByText("Storage unavailable")).toBeVisible();
      await page.getByRole("button", { name: "Retry" }).click();

      await expect.poll(() => api.createdFeedback().length).toBe(1);
      expect(api.createdFeedback()[0]?.comment).toBe("Retry after a failure");
    });

    test("keeps focus in the comment popover inside a focus-trapping dialog", async ({
      page,
    }) => {
      await submitInsideFocusTrap(page, fixture.path, "bubble");
    });

    test("selecting an element does not close a drawer that closes on outside presses", async ({
      page,
    }) => {
      await selectOutsideDismissableDrawer(page, fixture.path, "bubble");
    });

    test("keeps focus in the comment popover after a drag inside a focus-trapping dialog", async ({
      page,
    }) => {
      await submitInsideFocusTrap(page, fixture.path, "bubble", "drag");
    });

    test("a drag does not close a drawer that closes on outside presses", async ({
      page,
    }) => {
      await selectOutsideDismissableDrawer(
        page,
        fixture.path,
        "bubble",
        "drag",
      );
    });
  });
}
