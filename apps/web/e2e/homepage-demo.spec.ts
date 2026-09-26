import { expect, test } from "@playwright/test";

import { WIDGET_API_ORIGIN } from "./widget-api-stub";

// The homepage demo runs the Widget against session storage: no Reviewer token,
// no widget HTTP API.
test.describe("homepage demo", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/auth/get-session", (route) =>
      route.fulfill({ contentType: "application/json", body: "null" }),
    );
  });

  test("renders the seeded pins on first visit", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("[data-ff-widget]")).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: /^Feedback: The CTA contrast/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Feedback: Should we say/ }),
    ).toBeVisible();
  });

  test("stores submitted Feedback locally and shows its pin", async ({
    page,
  }) => {
    const apiRequests: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.startsWith(WIDGET_API_ORIGIN) || url.includes("/api/v1/")) {
        apiRequests.push(url);
      }
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Start feedback" }).click();
    await page.locator("h1").first().click();
    await page
      .getByPlaceholder("Describe the issue...")
      .fill("The headline wraps awkwardly");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(
      page.getByRole("button", {
        name: "Feedback: The headline wraps awkwardly",
      }),
    ).toBeVisible();
    const stored = await page.evaluate(() =>
      window.sessionStorage.getItem("fasterfixes:demo:visitor-pins"),
    );
    expect(stored).toContain("The headline wraps awkwardly");
    expect(apiRequests).toEqual([]);
  });

  test("destroys the Widget when navigating away in-app", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-ff-widget]")).toHaveCount(1);

    await page
      .getByRole("navigation")
      .getByRole("link", { name: "Pricing" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/pricing$/);

    await expect(page.locator("[data-ff-widget]")).toHaveCount(0);
  });

  test("dismisses the try-me hint on first interaction with the Widget", async ({
    page,
  }) => {
    await page.goto("/");
    const hint = page.getByText("Try me");
    await expect(hint).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Start feedback" }).click();

    await expect(hint).toBeHidden();
  });
});
