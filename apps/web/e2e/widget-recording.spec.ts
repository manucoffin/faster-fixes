import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { RECORDING_PATH, readUploadedRecording } from "./recording-upload";
import { seedReviewerToken } from "./reviewer-token";
import { stubWidgetApi } from "./widget-api-stub";

const EMBEDS = [
  { name: "React Embed", path: "/login" },
  { name: "script embed", path: "/e2e/script-embed" },
];

// Text a scenario writes into the page, so the Recording can be searched for it.
async function writeOnPage(page: Page, text: string) {
  await page.evaluate((content) => {
    const note = document.createElement("p");
    note.className = "e2e-note";
    note.textContent = content;
    document.body.appendChild(note);
  }, text);
}

async function eraseFromPage(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll(".e2e-note").forEach((note) => note.remove());
  });
}

async function select(page: Page, target = "h1") {
  await page.getByRole("button", { name: "Start feedback" }).click();
  await page.locator(target).click();
  // Read right after the Selection click: no recorded event may be later.
  return page.evaluate(() => Date.now());
}

async function submit(page: Page, comment: string) {
  await page.getByPlaceholder("Describe the issue...").fill(comment);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(
    page.getByRole("button", { name: `Feedback: ${comment}` }),
  ).toBeVisible();
}

for (const embed of EMBEDS) {
  test.describe(`Recording upload (${embed.name})`, () => {
    test.beforeEach(async ({ page }) => {
      // The app's auth client asks for a session on load.
      await page.route("**/api/auth/get-session", (route) =>
        route.fulfill({ contentType: "application/json", body: "null" }),
      );
      await seedReviewerToken(page);
    });

    test("sends a Recording that ends at the Selection, declared at creation", async ({
      page,
    }) => {
      const api = await stubWidgetApi(page);
      await page.goto(embed.path);
      await expect(
        page.getByRole("button", { name: "Start feedback" }),
      ).toBeVisible();
      await writeOnPage(page, "Reproduced before the Selection");

      const selectedBy = await select(page);
      await submit(page, "The heading jumps");

      await expect
        .poll(() => api.requestsTo("PUT", RECORDING_PATH))
        .toHaveLength(1);
      const [upload] = api.requestsTo("PUT", RECORDING_PATH);
      expect(upload?.path).toBe(
        `/api/v1/feedback/${api.createdIds()[0]}/recording`,
      );
      expect(api.createdFeedback()[0]?.recordingFollows).toBe(true);

      const recording = readUploadedRecording(
        upload ?? { headers: {}, body: null },
      );
      expect(recording.formatVersion).toBe("1");
      expect(recording.durationMs).toBeGreaterThan(0);
      expect(recording.durationMs).toBeLessThanOrEqual(60_000);
      // rrweb's meta event (4), then a full snapshot (2), start every Recording.
      expect(recording.events.slice(0, 2).map(({ type }) => type)).toEqual([
        4, 2,
      ]);
      expect(recording.json).toContain("Reproduced before the Selection");
      const lastEvent = recording.events.at(-1);
      expect(lastEvent?.timestamp).toBeLessThanOrEqual(selectedBy);
    });

    test("gives each Feedback its own Recording, without the comment mode", async ({
      page,
    }) => {
      const api = await stubWidgetApi(page);
      await page.goto(embed.path);

      await select(page);
      // Shown and removed while the form is open: in no Recording, the next
      // one's snapshot included.
      await writeOnPage(page, "While the form is open");
      await page.waitForTimeout(100);
      await eraseFromPage(page);
      await submit(page, "First");
      await writeOnPage(page, "Between the two");

      // The first Feedback's pin now covers the heading.
      await select(page, ".e2e-note");
      await submit(page, "Second");

      await expect
        .poll(() => api.requestsTo("PUT", RECORDING_PATH))
        .toHaveLength(2);
      const ids = api.createdIds();
      const uploads = api.requestsTo("PUT", RECORDING_PATH);
      expect(uploads.map(({ path }) => path)).toEqual(
        ids.map((id) => `/api/v1/feedback/${id}/recording`),
      );
      const [first, second] = uploads.map((upload) =>
        readUploadedRecording(upload),
      );
      expect(first?.json).not.toContain("While the form is open");
      expect(second?.json).not.toContain("While the form is open");
      expect(first?.json).not.toContain("Between the two");
      expect(second?.json).toContain("Between the two");
    });

    test("closes the form without waiting for the upload", async ({ page }) => {
      const api = await stubWidgetApi(page, { recording: "hang" });
      await page.goto(embed.path);

      await select(page);
      await submit(page, "Never answered");

      await expect(page.getByPlaceholder("Describe the issue...")).toBeHidden();
      expect(api.requestsTo("PUT", RECORDING_PATH)).toHaveLength(1);
    });

    for (const { recording, attempts } of [
      { recording: "network-error", attempts: 2 },
      { recording: "refused", attempts: 1 },
    ] as const) {
      test(`sends ${String(attempts)} attempt(s) on ${recording}, silently`, async ({
        page,
      }) => {
        const output: string[] = [];
        page.on("console", (message) => {
          // The dev server's own logs, on the React Embed's page, are not warnings.
          if (!["warning", "error"].includes(message.type())) return;
          // The browser's own network log, which no page script can silence.
          if (message.text().startsWith("Failed to load resource:")) return;
          output.push(message.text());
        });
        page.on("pageerror", (error) => output.push(error.message));
        const api = await stubWidgetApi(page, { recording });
        await page.goto(embed.path);

        await select(page);
        await submit(page, "Upload fails");

        await expect
          .poll(() => api.requestsTo("PUT", RECORDING_PATH).length)
          .toBe(attempts);
        await page.waitForTimeout(500);
        expect(api.requestsTo("PUT", RECORDING_PATH)).toHaveLength(attempts);
        await expect(
          page.locator("[data-ff-widget]").getByRole("alert"),
        ).toHaveCount(0);
        expect(output).toEqual([]);
      });
    }
  });
}

test.describe("Recording upload (opted out)", () => {
  test("declares nothing and sends no Recording", async ({ page }) => {
    await seedReviewerToken(page);
    const api = await stubWidgetApi(page);
    await page.goto("/e2e/script-embed?captureRecording=false");

    await select(page);
    await submit(page, "No Recording");

    await expect
      .poll(() => api.requestsTo("PUT", /\/screenshot$/))
      .toHaveLength(1);
    expect(api.requestsTo("PUT", RECORDING_PATH)).toHaveLength(0);
    expect(api.createdFeedback()[0]).not.toHaveProperty("recordingFollows");
  });
});
