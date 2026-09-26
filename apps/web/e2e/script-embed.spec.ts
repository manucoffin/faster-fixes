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

  test("exposes the loaded Feedback and the pins toggle on the instance", async ({
    page,
  }) => {
    await page.goto(FIXTURE_PATH);
    await expect(
      page.getByRole("button", { name: "Start feedback" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Start feedback" }).click();
    await page.locator("h1").click();
    await page.getByPlaceholder("Describe the issue...").fill("Pinned");
    await page.getByRole("button", { name: "Submit" }).click();

    const pin = page.getByRole("button", { name: "Feedback: Pinned" });
    await expect(pin).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => window.FasterFixes?.instance?.feedbackItems.length),
      )
      .toBe(1);

    expect(
      await page.evaluate(() => {
        window.FasterFixes?.instance?.togglePins();
        return window.FasterFixes?.instance?.showPins;
      }),
    ).toBe(false);
    await expect(pin).toBeHidden();

    await page.evaluate(() => window.FasterFixes?.instance?.togglePins());
    await expect(pin).toBeVisible();
  });

  test("takes every pin popover string from labels", async ({ page }) => {
    await page.goto(`${FIXTURE_PATH}?manual`);
    await page.evaluate(
      ([projectId, apiOrigin]) => {
        window.FasterFixes?.init({
          projectId,
          apiOrigin,
          labels: {
            editButton: "Modifier",
            deleteButton: "Supprimer",
            deleteConfirm: "Supprimer ce retour ?",
            cancelButton: "Annuler",
            closeButton: "Fermer",
          },
        });
      },
      [WIDGET_PROJECT_ID, WIDGET_API_ORIGIN] as const,
    );

    await page.getByRole("button", { name: "Start feedback" }).click();
    await page.locator("h1").click();
    await page.getByPlaceholder("Describe the issue...").fill("Pinned");
    await page.getByRole("button", { name: "Submit" }).click();

    await page.getByRole("button", { name: "Feedback: Pinned" }).click();
    await page.getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByText("Supprimer ce retour ?")).toBeVisible();
    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByRole("button", { name: "Modifier" })).toBeVisible();

    await page.getByRole("button", { name: "Fermer" }).click();
    await expect(page.getByRole("button", { name: "Modifier" })).toBeHidden();
  });

  test("takes every Feedback list string from labels", async ({ page }) => {
    await stubWidgetApi(page, { config: { enabled: true, branding: true } });
    await page.goto(`${FIXTURE_PATH}?manual`);
    await page.evaluate(
      ([projectId, apiOrigin]) => {
        window.FasterFixes?.init({
          projectId,
          apiOrigin,
          labels: {
            showFeedbackList: "Afficher la liste",
            hideFeedbackList: "Masquer la liste",
            feedbackListTitle: "Retours",
            showResolved: "Afficher les résolus",
            hideResolved: "Masquer les résolus",
            emptyList: "Aucun retour",
            brandingLink: "Propulsé par FasterFixes",
          },
        });
      },
      [WIDGET_PROJECT_ID, WIDGET_API_ORIGIN] as const,
    );

    await page.getByRole("button", { name: "Start feedback" }).click();
    await page.getByRole("button", { name: "Afficher la liste" }).click();

    await expect(page.getByRole("region", { name: "Retours" })).toBeVisible();
    await expect(page.getByText("Aucun retour")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Propulsé par FasterFixes" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Afficher les résolus" }).click();
    await expect(
      page.getByRole("button", { name: "Masquer les résolus" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Masquer la liste" }).click();
    await expect(page.getByRole("region", { name: "Retours" })).toBeHidden();
  });

  test("exposes list parts and keyboard-operable rows", async ({ page }) => {
    await page.goto(FIXTURE_PATH);
    await page.getByRole("button", { name: "Start feedback" }).click();
    await page.locator("h1").click();
    await page.getByPlaceholder("Describe the issue...").fill("Keyboard row");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(
      page.getByRole("button", { name: "Feedback: Keyboard row" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Start feedback" }).click();
    await page.getByRole("button", { name: "Show feedback list" }).click();

    await expect(page.locator('[part="list"]')).toBeVisible();
    const row = page.locator('[part="list-item"]');
    await expect(row).toHaveCount(1);

    await row.focus();
    await expect(row).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
  });
});

declare global {
  interface Window {
    FasterFixes?: {
      init: (options: unknown) => unknown;
      instance?: {
        hide: () => void;
        startAnnotation: () => void;
        readonly feedbackItems: readonly { id: string }[];
        togglePins: () => void;
        readonly showPins: boolean;
      };
    };
  }
}
