import { readFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { seedReviewerToken } from "./reviewer-token";
import {
  expectLabelsEverywhere,
  LABEL_OVERRIDES,
  PIN_LABEL_PREFIX,
  RECORDING_LABEL_PREFIX,
} from "./widget-labels";
import {
  stubWidgetApi,
  WIDGET_API_ORIGIN,
  WIDGET_PROJECT_ID,
} from "./widget-api-stub";

const FIXTURE_PATH = "/e2e/script-embed";
const HOST = "[data-ff-widget]";

// Every callback the IIFE hands to a timer or an event target is counted, so a
// test can tell whether any of them still runs.
function countWidgetCallbacks(page: Page) {
  return page.addInitScript(() => {
    const native = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      fetch: window.fetch,
      xhrOpen: XMLHttpRequest.prototype.open,
      xhrSend: XMLHttpRequest.prototype.send,
    };
    const counter = { calls: 0, native };
    Object.assign(window, { __ffCallbacks: counter });

    const fromWidget = () =>
      new Error().stack?.includes("widget.iife.js") ?? false;
    const counted = new WeakMap<object, (...args: unknown[]) => unknown>();
    function count<T extends (...args: never[]) => unknown>(callback: T): T {
      if (typeof callback !== "function" || !fromWidget()) return callback;
      let wrapped = counted.get(callback);
      if (!wrapped) {
        wrapped = function (this: unknown, ...args: unknown[]) {
          counter.calls += 1;
          return (callback as unknown as (...a: unknown[]) => unknown).apply(
            this,
            args,
          );
        };
        counted.set(callback, wrapped);
      }
      return wrapped as unknown as T;
    }

    const { setTimeout, setInterval, requestAnimationFrame } = window;
    window.setTimeout = ((handler: TimerHandler, ...rest: unknown[]) =>
      setTimeout(
        count(handler as () => void),
        ...(rest as [number]),
      )) as typeof window.setTimeout;
    window.setInterval = ((handler: TimerHandler, ...rest: unknown[]) =>
      setInterval(
        count(handler as () => void),
        ...(rest as [number]),
      )) as typeof window.setInterval;
    window.requestAnimationFrame = (callback) =>
      requestAnimationFrame(count(callback));

    const { addEventListener, removeEventListener } = EventTarget.prototype;
    EventTarget.prototype.addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      const target =
        typeof listener === "function" ? count(listener) : listener;
      addEventListener.call(this, type, target, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ) {
      const target =
        typeof listener === "function"
          ? ((counted.get(listener) as EventListener | undefined) ?? listener)
          : listener;
      removeEventListener.call(this, type, target, options);
    };
  });
}

// Everything the Widget listens to or polls for, fired once.
async function exerciseThePage(page: Page) {
  await page.mouse.move(200, 200);
  await page.mouse.move(400, 300);
  await page.locator("h1").click();
  await page.keyboard.press("Escape");
  await page.mouse.wheel(0, 200);
  await page.setViewportSize({ width: 1100, height: 700 });
  await page.getByRole("link", { name: "Second page" }).click();
  await page.goBack();
  // Longer than the location poll interval.
  await page.waitForTimeout(1_200);
}

// Script-only scenarios: they check the Widget's own style and label surface,
// which the React Embed does not share.
test.describe("script embed style and labels", () => {
  test.beforeEach(async ({ page }) => {
    await seedReviewerToken(page);
  });

  test("labels replace every rendered and announced string", async ({
    page,
  }) => {
    await stubWidgetApi(page, { config: { enabled: true, branding: true } });
    await page.goto(`${FIXTURE_PATH}?manual`);
    await page.evaluate(
      ([projectId, apiOrigin, labels, pinPrefix, recordingPrefix]) => {
        window.FasterFixes?.init({
          projectId,
          apiOrigin,
          labels: {
            ...labels,
            pinAriaLabel: (excerpt: string) => `${pinPrefix}${excerpt}`,
            recordingIncluded: (seconds: number) =>
              `${recordingPrefix}${seconds}`,
          },
        });
      },
      [
        WIDGET_PROJECT_ID,
        WIDGET_API_ORIGIN,
        LABEL_OVERRIDES,
        PIN_LABEL_PREFIX,
        RECORDING_LABEL_PREFIX,
      ] as const,
    );

    await expectLabelsEverywhere(page);
  });

  test("CSS custom properties on the host restyle the button and popover", async ({
    page,
  }) => {
    await stubWidgetApi(page);
    await page.goto(FIXTURE_PATH);
    await page.addStyleTag({
      content: `${HOST} {
        --ff-accent: rgb(22, 163, 74);
        --ff-background: rgb(250, 250, 249);
        --ff-foreground: rgb(28, 25, 23);
        --ff-radius: 3px;
        --ff-font-family: Georgia, serif;
      }`,
    });

    const start = page.getByRole("button", { name: "Start feedback" });
    await expect(page.locator('[part="button"]')).toHaveCSS(
      "background-color",
      "rgb(22, 163, 74)",
    );

    await start.click();
    await page.locator("h1").click();
    const popover = page.locator('[part="popover"]');
    await expect(popover).toBeVisible();
    await expect(popover).toHaveCSS("background-color", "rgb(250, 250, 249)");
    await expect(popover).toHaveCSS("color", "rgb(28, 25, 23)");
    await expect(popover).toHaveCSS("border-radius", "3px");
    await expect(popover).toHaveCSS("font-family", "Georgia, serif");
    await expect(page.getByRole("button", { name: "Submit" })).toHaveCSS(
      "background-color",
      "rgb(22, 163, 74)",
    );
  });

  // The system fonts of a developer machine and of CI differ, so the Widget
  // renders its text in a font committed to the repo; the hostile stylesheet
  // still forces its own font on every page element.
  test("the hostile stylesheet leaves the button and popover as designed", async ({
    page,
  }) => {
    await stubWidgetApi(page);
    const font = await readFile(
      path.join(
        import.meta.dirname,
        "../src/app/(public)/blog/[slug]/og/_fonts/space-grotesk-bold.ttf",
      ),
    );
    await page.route("**/e2e-golden-font.ttf", (route) =>
      route.fulfill({ contentType: "font/ttf", body: font }),
    );
    // Without a Recording, so the form's Recording line, whose text and arrival
    // vary, stays out of the golden image.
    await page.goto(`${FIXTURE_PATH}?captureRecording=false`);
    await page.addStyleTag({
      content: `
        @font-face { font-family: "FF Golden"; src: url("/e2e-golden-font.ttf"); }
        ${HOST} { --ff-font-family: "FF Golden"; }
      `,
    });
    await page.evaluate(() => document.fonts.load('14px "FF Golden"'));

    const start = page.getByRole("button", { name: "Start feedback" });
    await expect(start).toBeVisible();
    // Anti-aliasing differs slightly between CPU architectures; a style leak
    // changes far more than this share of pixels.
    await expect(start).toHaveScreenshot("button.png", {
      maxDiffPixelRatio: 0.02,
    });

    await start.click();
    await page.locator("h1").click();
    const popover = page.locator('[part="popover"]');
    await expect(page.getByPlaceholder("Describe the issue...")).toBeFocused();
    await expect(popover).toHaveScreenshot("comment-popover.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("destroy removes the host, restores patched globals and stops every callback", async ({
    page,
  }) => {
    await countWidgetCallbacks(page);
    await stubWidgetApi(page);
    await page.goto(FIXTURE_PATH);

    await page.getByRole("button", { name: "Start feedback" }).click();
    await page.locator("h1").click();
    await expect(page.getByPlaceholder("Describe the issue...")).toBeFocused();
    expect(
      await page.evaluate(
        () => window.fetch !== window.__ffCallbacks.native.fetch,
      ),
      "the recorder patches fetch while mounted",
    ).toBe(true);

    await page.evaluate(() => window.FasterFixes?.instance?.destroy());
    // Work already running at destroy, like the screenshot capture, may finish once.
    await page.waitForTimeout(1_000);

    await expect(page.locator(HOST)).toHaveCount(0);
    expect(
      await page.evaluate(() => {
        const { native } = window.__ffCallbacks;
        return {
          log: console.log === native.log,
          warn: console.warn === native.warn,
          error: console.error === native.error,
          fetch: window.fetch === native.fetch,
          xhrOpen: XMLHttpRequest.prototype.open === native.xhrOpen,
          xhrSend: XMLHttpRequest.prototype.send === native.xhrSend,
        };
      }),
    ).toEqual({
      log: true,
      warn: true,
      error: true,
      fetch: true,
      xhrOpen: true,
      xhrSend: true,
    });

    const callsAtDestroy = await page.evaluate(
      () => window.__ffCallbacks.calls,
    );
    expect(
      callsAtDestroy,
      "the counter sees the Widget's callbacks",
    ).toBeGreaterThan(0);
    await exerciseThePage(page);
    expect(await page.evaluate(() => window.__ffCallbacks.calls)).toBe(
      callsAtDestroy,
    );
  });
});

declare global {
  interface Window {
    __ffCallbacks: {
      calls: number;
      native: {
        log: typeof console.log;
        warn: typeof console.warn;
        error: typeof console.error;
        fetch: typeof window.fetch;
        xhrOpen: typeof XMLHttpRequest.prototype.open;
        xhrSend: typeof XMLHttpRequest.prototype.send;
      };
    };
  }
}
