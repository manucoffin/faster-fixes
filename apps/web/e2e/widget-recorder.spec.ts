import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { RECORDER_FILE_PATTERN, widgetVersion } from "./recorder-file";
import { seedReviewerToken } from "./reviewer-token";
import {
  stubWidgetApi,
  WIDGET_API_ORIGIN,
  WIDGET_PROJECT_ID,
} from "./widget-api-stub";

const SCRIPT_EMBED_PATH = "/e2e/script-embed";
const REACT_EMBED_PATH = "/login";

// The default block class of rrweb's recorder, present in its code whatever
// the minifier does to the rest.
const RECORDER_CODE_MARKER = "rr-block";

async function createFeedback(page: Page, comment: string) {
  await page.getByRole("button", { name: "Start feedback" }).click();
  await page.locator("h1").click();
  await page.getByPlaceholder("Describe the issue...").fill(comment);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(
    page.getByRole("button", { name: `Feedback: ${comment}` }),
  ).toBeVisible();
}

// Every chunk the app's bundler serves the page, with its body.
function collectAppChunks(page: Page) {
  const bodies: Promise<string>[] = [];
  page.on("response", (response) => {
    if (
      response.request().resourceType() === "script" &&
      response.url().includes("/_next/static/chunks/")
    ) {
      bodies.push(response.text().catch(() => ""));
    }
  });
  return () => Promise.all(bodies);
}

test.describe("recorder file (script embed)", () => {
  const RECORDER_FILE_URL = `https://cdn.jsdelivr.net/npm/@fasterfixes/widget@${widgetVersion()}/dist/recorder.iife.js`;

  test("is requested at the exact package version alongside the config request, with the script's nonce", async ({
    page,
  }) => {
    const stub = await stubWidgetApi(page);
    await seedReviewerToken(page);
    // Never answered: the recorder file must not wait for the config.
    await page.route(`${WIDGET_API_ORIGIN}/api/v1/widget/config`, () => {});

    await page.goto(`${SCRIPT_EMBED_PATH}?nonce=e2e-nonce`);

    await expect.poll(() => stub.recorderRequests).toEqual([RECORDER_FILE_URL]);
    expect(
      await page.evaluate(
        () =>
          document.querySelector<HTMLScriptElement>(
            'script[src$="/recorder.iife.js"]',
          )?.nonce,
      ),
    ).toBe("e2e-nonce");
    await expect(page.locator("[data-ff-widget]")).toHaveCount(0);
  });

  test("is not requested without a Reviewer token", async ({ page }) => {
    const stub = await stubWidgetApi(page);

    await page.goto(SCRIPT_EMBED_PATH);
    await page.waitForLoadState("networkidle");

    expect(stub.recorderRequests).toEqual([]);
    expect(stub.requests).toEqual([]);
  });

  test('is not requested with data-capture-recording="false"', async ({
    page,
  }) => {
    const stub = await stubWidgetApi(page);
    await seedReviewerToken(page);

    await page.goto(`${SCRIPT_EMBED_PATH}?captureRecording=false`);
    await expect(
      page.getByRole("button", { name: "Start feedback" }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(stub.recorderRequests).toEqual([]);
  });

  test("is not requested with captureRecording: false", async ({ page }) => {
    const stub = await stubWidgetApi(page);
    await seedReviewerToken(page);

    await page.goto(`${SCRIPT_EMBED_PATH}?manual`);
    await page.evaluate(
      ([projectId, apiOrigin]) => {
        window.FasterFixes?.init({
          projectId,
          apiOrigin,
          captureRecording: false,
        });
      },
      [WIDGET_PROJECT_ID, WIDGET_API_ORIGIN] as const,
    );
    await expect(
      page.getByRole("button", { name: "Start feedback" }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");

    expect(stub.recorderRequests).toEqual([]);
  });

  test("is requested once across init calls", async ({ page }) => {
    const stub = await stubWidgetApi(page);
    await seedReviewerToken(page);

    await page.goto(`${SCRIPT_EMBED_PATH}?manual`);
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
    await page.waitForLoadState("networkidle");

    expect(stub.recorderRequests).toEqual([RECORDER_FILE_URL]);
  });

  test("leaves the Widget working with no console output when blocked", async ({
    page,
  }) => {
    const output: string[] = [];
    page.on("console", (message) => {
      // The browser's own network log for the blocked request, which no page
      // script can silence; anything else would come from the Widget.
      if (message.text().startsWith("Failed to load resource:")) return;
      output.push(message.text());
    });
    page.on("pageerror", (error) => output.push(error.message));
    const stub = await stubWidgetApi(page);
    await seedReviewerToken(page);
    await page.route(RECORDER_FILE_PATTERN, (route) =>
      route.abort("blockedbyclient"),
    );

    await page.goto(SCRIPT_EMBED_PATH);
    await createFeedback(page, "Blocked recorder");

    expect(stub.createdFeedback()).toHaveLength(1);
    expect(output).toEqual([]);
  });
});

test.describe("recorder (React Embed)", () => {
  test("is loaded through a dynamic import for a Reviewer only", async ({
    page,
  }) => {
    await stubWidgetApi(page);
    const scripts = collectAppChunks(page);

    await page.goto(REACT_EMBED_PATH);
    await page.waitForLoadState("networkidle");
    const withoutToken = await scripts();
    expect(
      withoutToken.some((body) => body.includes(RECORDER_CODE_MARKER)),
    ).toBe(false);

    await seedReviewerToken(page);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Start feedback" }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");
    const withToken = await scripts();
    expect(withToken.some((body) => body.includes(RECORDER_CODE_MARKER))).toBe(
      true,
    );
  });
});
