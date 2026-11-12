import type { WidgetOptions } from "@fasterfixes/widget";
import { expect, test } from "@playwright/test";

import { seedReviewerToken } from "./reviewer-token";
import { stubWidgetApi } from "./widget-api-stub";
import { VUE_EXAMPLE_ORIGIN } from "./widget-fixtures";
import {
  expectLabelsEverywhere,
  LABEL_OVERRIDES,
  PIN_LABEL_PREFIX,
  RECORDING_LABEL_PREFIX,
} from "./widget-labels";

const HOME = `${VUE_EXAMPLE_ORIGIN}/`;

// Scenarios only the Vue Embed has: the shared ones run from `widget.spec.ts`.
test.describe("Vue Embed", () => {
  test.beforeEach(async ({ page }) => {
    await seedReviewerToken(page);
  });

  test("the control bar drives the Widget through useFeedback", async ({
    page,
  }) => {
    const api = await stubWidgetApi(page, {
      feedback: [
        {
          id: "fb_stubbed",
          status: "new",
          comment: "The heading is misaligned",
          pageUrl: HOME,
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
        },
      ],
    });
    await page.goto(HOME);

    const visible = page.getByTestId("widget-visible");
    const count = page.getByTestId("feedback-count");
    const start = page.getByRole("button", { name: "Start feedback" });
    const pin = page.getByRole("button", {
      name: "Feedback: The heading is misaligned",
    });
    await expect(start).toBeVisible();
    await expect(visible).toHaveText("Visible: yes");
    await expect(count).toHaveText("Feedback: 1");

    await page.getByRole("button", { name: "Hide widget" }).click();
    await expect(page.locator("[data-ff-widget]")).toHaveCount(0);
    await expect(visible).toHaveText("Visible: no");

    await page.getByRole("button", { name: "Show widget" }).click();
    await expect(start).toBeVisible();
    await expect(visible).toHaveText("Visible: yes");

    await expect(pin).toBeVisible();
    await page.getByRole("button", { name: "Toggle pins" }).click();
    await expect(pin).toBeHidden();
    await page.getByRole("button", { name: "Toggle pins" }).click();
    await expect(pin).toBeVisible();

    // Annotation shows a hidden Widget first.
    await page.getByRole("button", { name: "Hide widget" }).click();
    await expect(visible).toHaveText("Visible: no");
    await page.getByRole("button", { name: "Start annotation" }).click();
    await expect(
      page.getByRole("button", { name: "Exit feedback mode" }),
    ).toBeVisible();
    await expect(visible).toHaveText("Visible: yes");

    // The stubbed item's pin covers the heading.
    await page.getByRole("heading", { name: "Pricing" }).click();
    await page
      .getByPlaceholder("Describe the issue...")
      .fill("The heading overlaps the logo");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect.poll(() => api.createdFeedback().length).toBe(1);
    await expect(count).toHaveText("Feedback: 2");
  });

  test("labels passed to the plugin replace every rendered and announced string", async ({
    page,
  }) => {
    await stubWidgetApi(page, { config: { enabled: true, branding: true } });
    await page.addInitScript(
      ([labels, pinPrefix, recordingPrefix]) => {
        const options: Partial<WidgetOptions> = {
          labels: {
            ...labels,
            pinAriaLabel: (excerpt: string) => `${pinPrefix}${excerpt}`,
            recordingIncluded: (seconds: number) =>
              `${recordingPrefix}${seconds}`,
          },
        };
        Object.assign(window, { __ffE2eOptions: options });
      },
      [LABEL_OVERRIDES, PIN_LABEL_PREFIX, RECORDING_LABEL_PREFIX] as const,
    );
    // The example stays free of test hooks: its entry, as the dev server serves
    // it, is patched to merge the options above into the plugin's options.
    await page.route(`${VUE_EXAMPLE_ORIGIN}/src/main.ts*`, async (route) => {
      const response = await route.fetch();
      const source = await response.text();
      await route.fulfill({
        response,
        body: source.replace(
          "createFasterFixes({",
          "createFasterFixes({ ...window.__ffE2eOptions,",
        ),
      });
    });
    await page.goto(HOME);

    await expectLabelsEverywhere(page);
  });
});
