import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { RECORDING_PATH, readUploadedRecording } from "./recording-upload";
import type { UploadedRecording } from "./recording-upload";
import { seedReviewerToken } from "./reviewer-token";
import {
  stubWidgetApi,
  WIDGET_API_ORIGIN,
  WIDGET_PROJECT_ID,
} from "./widget-api-stub";

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

// A node of rrweb's serialized DOM, as far as these tests read it.
type SnapshotNode = {
  type: number;
  tagName?: string;
  textContent?: string;
  childNodes?: SnapshotNode[];
};

function findElement(
  node: SnapshotNode,
  tagName: string,
): SnapshotNode | undefined {
  if (node.tagName === tagName) return node;
  for (const child of node.childNodes ?? []) {
    const found = findElement(child, tagName);
    if (found) return found;
  }
  return undefined;
}

// The text a Reviewer would read: style and script content is not page text.
function readTexts(node: SnapshotNode): string[] {
  if (["style", "script", "noscript"].includes(node.tagName ?? "")) return [];
  if (node.type === 3) return [node.textContent ?? ""];
  return (node.childNodes ?? []).flatMap(readTexts);
}

// The rrweb custom event (5) a Recording that starts at its page session's
// start carries.
function readMarker(recording: UploadedRecording | undefined) {
  const events = (recording?.events ?? []) as {
    type: number;
    data?: { tag?: string; payload?: unknown };
  }[];
  const markers = events.filter(
    ({ type, data }) => type === 5 && data?.tag === "fasterfixes/page-session",
  );
  expect(markers.length).toBeLessThanOrEqual(1);
  return markers[0]?.data?.payload;
}

function fullSnapshotTimes(recording: UploadedRecording | undefined) {
  return (recording?.events ?? [])
    .filter(({ type }) => type === 2)
    .map(({ timestamp }) => timestamp);
}

// The default line on a page open for less than 30 seconds.
const RECORDING_LINE =
  /^Includes the last (second|\d+ seconds) on this page\.$/;

async function select(page: Page, target = "h1") {
  await page.getByRole("button", { name: "Start feedback" }).click();
  await page.locator(target).click();
  // Read right after the Selection click: no recorded event may be later.
  return page.evaluate(() => Date.now());
}

// The line shows only once the recorder file has arrived and recorded.
async function waitForRecorder(page: Page) {
  await select(page);
  await expect(page.getByText(RECORDING_LINE)).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
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

    test("states in the comment form that the Recording is included, with its real duration", async ({
      page,
    }) => {
      await stubWidgetApi(page);
      await page.goto(embed.path);

      await select(page);

      const line = page.getByText(RECORDING_LINE);
      await expect(line).toBeVisible();
      // Muted text between the comment field and the buttons, with no control.
      expect(
        await line.evaluate((node) => ({
          tagName: node.tagName,
          controls: node.querySelectorAll("a, button, input, label").length,
        })),
      ).toEqual({ tagName: "P", controls: 0 });
      const field = await page
        .getByPlaceholder("Describe the issue...")
        .boundingBox();
      const lineBox = await line.boundingBox();
      const button = await page
        .getByRole("button", { name: "Submit" })
        .boundingBox();
      expect(lineBox?.y).toBeGreaterThan(
        (field?.y ?? 0) + (field?.height ?? 0) - 1,
      );
      expect((lineBox?.y ?? 0) + (lineBox?.height ?? 0)).toBeLessThanOrEqual(
        (button?.y ?? 0) + 1,
      );
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

    test("holds no typed value, no masked or blocked content and none of the Widget", async ({
      page,
    }) => {
      const api = await stubWidgetApi(page);
      await page.goto(embed.path);
      await expect(
        page.getByRole("button", { name: "Start feedback" }),
      ).toBeVisible();
      await page.evaluate(() => {
        const fixture = document.createElement("div");
        fixture.innerHTML = `
          <input id="e2e-input" />
          <textarea id="e2e-textarea"></textarea>
          <select id="e2e-select">
            <option value="">Choose</option>
            <option value="picked-option">Picked option</option>
          </select>
          <div id="e2e-editable" contenteditable="true"></div>
          <section data-ff-mask>Masked secret <strong>nested secret</strong></section>
          <div data-ff-block style="width: 120px; height: 48px">Blocked secret</div>
        `;
        document.body.prepend(fixture);
      });
      await page.locator("#e2e-input").fill("typed-in-input");
      await page.locator("#e2e-textarea").fill("typed-in-textarea");
      await page.locator("#e2e-select").selectOption("picked-option");
      await page.locator("#e2e-editable").click();
      await page.keyboard.type("typed-in-editable");

      await select(page);
      await submit(page, "Private content");

      await expect
        .poll(() => api.requestsTo("PUT", RECORDING_PATH))
        .toHaveLength(1);
      const [upload] = api.requestsTo("PUT", RECORDING_PATH);
      const { events, json } = readUploadedRecording(
        upload ?? { headers: {}, body: null },
      );
      for (const typed of [
        "typed-in-input",
        "typed-in-textarea",
        "typed-in-editable",
      ]) {
        expect(json).not.toContain(typed);
      }
      // The Reviewer's changes to a field are recorded, with no value.
      const inputs = (
        events as { type: number; data?: { source?: number; text?: string } }[]
      ).filter(({ type, data }) => type === 3 && data?.source === 5);
      expect(inputs.length).toBeGreaterThan(0);
      for (const { data } of inputs) expect(data?.text).toMatch(/^\**$/);
      expect(json).not.toContain('"selected":true');

      expect(json).not.toContain("Masked secret");
      expect(json).not.toContain("nested secret");
      expect(json).toContain("****** ******");
      expect(json).not.toContain("Blocked secret");
      expect(json).toContain('"rr_width":"120px","rr_height":"48px"');

      expect(json).not.toContain("data-ff-widget");
      expect(json).not.toContain("Start feedback");
      expect(json).not.toContain("Private content");
    });

    test("masks all page text under data-ff-mask on the body", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        document.addEventListener("DOMContentLoaded", () => {
          document.body.setAttribute("data-ff-mask", "");
        });
      });
      const api = await stubWidgetApi(page);
      await page.goto(embed.path);
      await expect(
        page.getByRole("button", { name: "Start feedback" }),
      ).toBeVisible();
      await writeOnPage(page, "Added after the snapshot");

      await select(page);
      await submit(page, "All text masked");

      await expect
        .poll(() => api.requestsTo("PUT", RECORDING_PATH))
        .toHaveLength(1);
      const [upload] = api.requestsTo("PUT", RECORDING_PATH);
      const { events, json } = readUploadedRecording(
        upload ?? { headers: {}, body: null },
      );
      const snapshot = events.find(({ type }) => type === 2) as
        | { data: { node: SnapshotNode } }
        | undefined;
      const body = snapshot && findElement(snapshot.data.node, "body");
      expect(body).toBeDefined();
      const texts = body ? readTexts(body) : [];
      expect(texts.join("").trim()).not.toBe("");
      for (const text of texts) expect(text).toMatch(/^[\s*]*$/);
      expect(json).not.toContain("Added after the snapshot");
    });

    test("closes the form without waiting for the upload", async ({ page }) => {
      const api = await stubWidgetApi(page, { recording: "hang" });
      await page.goto(embed.path);

      await select(page);
      await submit(page, "Never answered");

      await expect(page.getByPlaceholder("Describe the issue...")).toBeHidden();
      expect(api.requestsTo("PUT", RECORDING_PATH)).toHaveLength(1);
    });

    test("marks a Recording that starts at the page load, with a same-origin referrer's path", async ({
      page,
      baseURL,
    }) => {
      const api = await stubWidgetApi(page);
      await page.goto(embed.path, {
        referer: `${baseURL ?? ""}/pricing?token=from-the-referrer`,
      });

      await select(page);
      await submit(page, "Right after the load");

      await expect
        .poll(() => api.requestsTo("PUT", RECORDING_PATH))
        .toHaveLength(1);
      const recording = readUploadedRecording(
        api.requestsTo("PUT", RECORDING_PATH)[0] ?? { headers: {}, body: null },
      );
      expect(recording.durationMs).toBeLessThan(30_000);
      expect(readMarker(recording)).toEqual({
        navigationType: "load",
        referrerPath: "/pricing",
      });
      // Right after the meta event and the full snapshot.
      expect(recording.events[2]?.type).toBe(5);
      expect(recording.json).not.toContain("from-the-referrer");
    });

    test("marks a reload and never records an external referrer", async ({
      page,
    }) => {
      const api = await stubWidgetApi(page);
      await page.goto(embed.path, {
        referer: "https://elsewhere.example/search?q=shop",
      });
      await page.reload();

      await select(page);
      await submit(page, "After a reload");

      await expect
        .poll(() => api.requestsTo("PUT", RECORDING_PATH))
        .toHaveLength(1);
      const recording = readUploadedRecording(
        api.requestsTo("PUT", RECORDING_PATH)[0] ?? { headers: {}, body: null },
      );
      expect(readMarker(recording)).toEqual({ navigationType: "reload" });
      expect(recording.json).not.toContain("elsewhere.example");
    });

    test("keeps an in-app route change in one Recording", async ({ page }) => {
      const api = await stubWidgetApi(page);
      await page.goto(embed.path);
      await expect(
        page.getByRole("button", { name: "Start feedback" }),
      ).toBeVisible();
      await writeOnPage(page, "Before the route change");
      await page.evaluate(() => {
        window.history.pushState(null, "", "?step=2");
      });
      await expect(page).toHaveURL(/\?step=2$/);
      await writeOnPage(page, "After the route change");

      await select(page);
      await submit(page, "Across two views");

      await expect
        .poll(() => api.requestsTo("PUT", RECORDING_PATH))
        .toHaveLength(1);
      const recording = readUploadedRecording(
        api.requestsTo("PUT", RECORDING_PATH)[0] ?? { headers: {}, body: null },
      );
      expect(fullSnapshotTimes(recording)).toHaveLength(1);
      expect(readMarker(recording)).toMatchObject({ navigationType: "load" });
      expect(recording.json).toContain("Before the route change");
      expect(recording.json).toContain("After the route change");
    });

    test("takes no snapshot while the tab is hidden", async ({ page }) => {
      await page.clock.install();
      const api = await stubWidgetApi(page);
      await page.goto(embed.path);
      await waitForRecorder(page);

      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          get: () => true,
        });
      });
      // Two slices' worth: a visible tab would have taken two snapshots.
      await page.clock.runFor(65_000);
      const visibleAt = await page.evaluate(() => {
        // Back to the prototype's getter.
        Reflect.deleteProperty(document, "hidden");
        return Date.now();
      });
      await page.clock.runFor(2_000);
      await writeOnPage(page, "Back on the tab");

      await select(page);
      await submit(page, "After a background tab");

      await expect
        .poll(() => api.requestsTo("PUT", RECORDING_PATH))
        .toHaveLength(1);
      const recording = readUploadedRecording(
        api.requestsTo("PUT", RECORDING_PATH)[0] ?? { headers: {}, body: null },
      );
      const snapshots = fullSnapshotTimes(recording);
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0]).toBeGreaterThanOrEqual(visibleAt);
      expect(recording.json).toContain("Back on the tab");
    });

    test("drops the slice of a mutation burst and records the next one", async ({
      page,
    }) => {
      await page.clock.install();
      const api = await stubWidgetApi(page);
      await page.goto(embed.path);
      await waitForRecorder(page);

      // Past the recorder's threshold of mutated nodes in one slice.
      await page.evaluate(() => {
        const burst = document.createElement("div");
        burst.className = "e2e-burst";
        for (let i = 0; i < 12_000; i += 1) {
          burst.appendChild(document.createElement("span"));
        }
        document.body.appendChild(burst);
      });
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        document.querySelector(".e2e-burst")?.remove();
      });

      await select(page);
      // Long enough for a Recording to have been compressed, were there one.
      await page.waitForTimeout(500);
      await expect(page.getByText(RECORDING_LINE)).toHaveCount(0);
      await page.getByRole("button", { name: "Cancel" }).click();

      await page.clock.runFor(31_000);
      await writeOnPage(page, "After the burst");

      await select(page);
      await expect(page.getByText(RECORDING_LINE)).toBeVisible();
      await submit(page, "After the burst");

      await expect
        .poll(() => api.requestsTo("PUT", RECORDING_PATH))
        .toHaveLength(1);
      const recording = readUploadedRecording(
        api.requestsTo("PUT", RECORDING_PATH)[0] ?? { headers: {}, body: null },
      );
      expect(recording.json).toContain("After the burst");
      expect(recording.json).not.toContain("e2e-burst");
      // The dropped slice was the page session's first: no marker.
      expect(readMarker(recording)).toBeUndefined();
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
    // Long enough for a Recording to have been compressed, were there one.
    await page.waitForTimeout(500);
    await expect(page.getByText(RECORDING_LINE)).toHaveCount(0);
    await submit(page, "No Recording");

    await expect
      .poll(() => api.requestsTo("PUT", /\/screenshot$/))
      .toHaveLength(1);
    expect(api.requestsTo("PUT", RECORDING_PATH)).toHaveLength(0);
    expect(api.createdFeedback()[0]).not.toHaveProperty("recordingFollows");
  });
});

test.describe("Recording line (labels)", () => {
  test("uses the site's own wording", async ({ page }) => {
    await seedReviewerToken(page);
    await stubWidgetApi(page);
    await page.goto("/e2e/script-embed?manual");
    await page.evaluate(
      ([projectId, apiOrigin]) => {
        window.FasterFixes?.init({
          projectId,
          apiOrigin,
          labels: {
            recordingIncluded: (seconds: number) =>
              `Inclut les ${seconds} dernières secondes.`,
          },
        });
      },
      [WIDGET_PROJECT_ID, WIDGET_API_ORIGIN] as const,
    );

    await select(page);

    await expect(
      page.getByText(/^Inclut les \d+ dernières secondes\.$/),
    ).toBeVisible();
    await expect(page.getByText(RECORDING_LINE)).toHaveCount(0);
  });
});
