import { expect, test } from "@playwright/test";

import { stubWidgetApi } from "./widget-api-stub";
import { WIDGET_FIXTURES } from "./widget-fixtures";

// Frozen literals rather than core's constants: a rename in core would silently
// log out every Reviewer, and this suite is where that must fail.
const STORAGE_KEY_TOKEN = "ff_reviewer_token";
const URL_PARAM_TOKEN = "ff_token";
const REVIEWER_TOKEN = "rt_e2e_reviewer";

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
      await page.addInitScript(
        ([key, token]) => window.localStorage.setItem(key, token),
        [STORAGE_KEY_TOKEN, REVIEWER_TOKEN] as const,
      );

      await page.goto(fixture.path);

      await expect(
        page.getByRole("button", { name: "Start feedback" }),
      ).toBeVisible();
    });
  });
}
