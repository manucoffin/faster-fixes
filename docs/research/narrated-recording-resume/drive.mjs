// Drives the resume test page in Playwright's three engines with a fake
// microphone: start, reload, link to another page, back, another subdomain
// and back, stop. Permission prompts are auto-answered here, so this measures
// gaps, gesture needs and stitching, not prompts.
//
// Run from apps/web so Playwright resolves, with server.mjs listening:
//   node <this file> <out dir> [port] [engines]
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));
const playwright = require("@playwright/test");

const outDir = path.resolve(process.argv[2] ?? "out");
const port = Number(process.argv[3] ?? 4477);
const engines = (process.argv[4] ?? "chromium,firefox,webkit").split(",");
mkdirSync(outDir, { recursive: true });
const origin = `http://localhost:${port}`;
const altOrigin = `http://sub.localhost:${port}`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const launch = {
  chromium: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
  firefox: {
    firefoxUserPrefs: {
      "media.navigator.streams.fake": true,
      "media.navigator.permission.disabled": true,
    },
  },
  webkit: {},
};

async function run(name) {
  const browser = await playwright[name].launch(launch[name]);
  const context = await browser.newContext(
    name === "firefox" ? {} : { permissions: ["microphone"] },
  );
  const page = await context.newPage();
  page.on("pageerror", (error) =>
    console.error(name, "pageerror", error.message),
  );
  const steps = [];
  const step = async (label, action) => {
    try {
      await action();
      await wait(4000);
      steps.push({
        label,
        status: await page.locator("#status").textContent(),
      });
    } catch (error) {
      steps.push({ label, error: error.message.split("\n")[0] });
    }
  };
  try {
    await page.goto(origin);
    await step("start", () => page.click("[data-start='32000']"));
    await step("reload", () => page.click("#reload"));
    await step("link to /two", () => page.click("#other"));
    await step("back", () => page.goBack());
    await step("forward", () => page.goForward());
    await step("other subdomain", () => page.goto(altOrigin + "/"));
    await step("return from subdomain", () => page.goto(origin + "/"));
    await page.fill("input[placeholder^='type']", "hello");
    await page.click("#stop");
    await page.waitForFunction(() => window.lastReport, null, {
      timeout: 15000,
    });
    const report = await page.evaluate(() => window.lastReport);
    return { name, version: browser.version(), steps, report };
  } catch (error) {
    return {
      name,
      version: browser.version(),
      steps,
      error: error.message.split("\n")[0],
      log: await page
        .evaluate(() =>
          JSON.parse(localStorage.getItem("nr-resume-state") || "null"),
        )
        .catch(() => null),
    };
  } finally {
    await browser.close();
  }
}

const results = [];
for (const name of engines) results.push(await run(name));
writeFileSync(
  path.join(outDir, "playwright.json"),
  JSON.stringify(results, null, 2),
);
for (const result of results) {
  console.log(`\n== ${result.name} ${result.version}`);
  for (const entry of result.steps)
    console.log(" ", entry.label.padEnd(24), entry.status ?? entry.error);
  if (result.error) console.log("  ERROR", result.error);
  const log = result.report?.log ?? result.log?.log ?? [];
  for (const entry of log) {
    const { t, kind, page, ...rest } = entry;
    console.log("   ", kind.padEnd(16), page.padEnd(5), JSON.stringify(rest));
  }
  if (result.report)
    console.log(
      "  segments",
      JSON.stringify(result.report.segments),
      "replay",
      JSON.stringify(result.report.replay),
    );
}
