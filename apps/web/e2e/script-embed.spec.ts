import { expect, test } from "@playwright/test";

import { seedReviewerToken } from "./reviewer-token";
import {
  stubWidgetApi,
  WIDGET_API_ORIGIN,
  WIDGET_PROJECT_ID,
} from "./widget-api-stub";

const FIXTURE_PATH = "/e2e/script-embed";

// Scenarios only the script embed has: the React Embed has no script tag.
test.describe("script embed", () => {
  test.beforeEach(async ({ page }) => {
    await stubWidgetApi(page);
    await seedReviewerToken(page);
  });

  test("auto-initialises from the data-* attributes of its tag", async ({
    page,
  }) => {
    await page.goto(
      `${FIXTURE_PATH}?color=${encodeURIComponent("#16a34a")}&position=top-left`,
    );

    const button = page.getByRole("button", { name: "Start feedback" });
    await expect(button).toBeVisible();
    await expect(button).toHaveCSS("background-color", "rgb(22, 163, 74)");

    const box = await button.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (!box || !viewport) return;
    expect(box.x).toBeLessThan(viewport.width / 2);
    expect(box.y).toBeLessThan(viewport.height / 2);
  });

  test("mounts nothing without data-project-id until init is called", async ({
    page,
  }) => {
    await page.goto(`${FIXTURE_PATH}?manual`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("[data-ff-widget]")).toHaveCount(0);
    expect(await page.evaluate(() => typeof window.FasterFixes?.init)).toBe(
      "function",
    );

    // Called twice on purpose: the second call replaces the first instance.
    await page.evaluate(
      ([projectId, apiOrigin]) => {
        window.FasterFixes?.init({ projectId, apiOrigin });
        window.FasterFixes?.init({ projectId, apiOrigin });
      },
      [WIDGET_PROJECT_ID, WIDGET_API_ORIGIN] as const,
    );

    await expect(
      page.getByRole("button", { name: "Start feedback" }),
    ).toBeVisible();
    await expect(page.locator("[data-ff-widget]")).toHaveCount(1);
  });

  test("startAnnotation on the instance shows the Widget and starts annotating", async ({
    page,
  }) => {
    await page.goto(FIXTURE_PATH);
    await expect(
      page.getByRole("button", { name: "Start feedback" }),
    ).toBeVisible();

    await page.evaluate(() => {
      window.FasterFixes?.instance?.hide();
      window.FasterFixes?.instance?.startAnnotation();
    });

    await expect(
      page.getByRole("button", { name: "Exit feedback mode" }),
    ).toBeVisible();
    await page.locator("#primary-action").click();
    await expect(page.getByPlaceholder("Describe the issue...")).toBeFocused();
  });
});

declare global {
  interface Window {
    FasterFixes?: {
      init: (options: unknown) => unknown;
      instance?: { hide: () => void; startAnnotation: () => void };
    };
  }
}
