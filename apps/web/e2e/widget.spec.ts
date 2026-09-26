import type { FeedbackItem } from "@fasterfixes/core";
import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";

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

// The pin sits just right of its anchor, vertically centred on it.
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

    test("annotates an element and submits Feedback", async ({ page }) => {
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
        browserName: "Chrome",
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
      await expect(pin).toHaveCSS("background-color", "rgb(239, 68, 68)");
      await expectPinAt(pin, page.locator("h1"), 0.5);
      await expect(
        page.getByRole("button", { name: /^Feedback: / }),
      ).toHaveCount(1);
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
  });
}
