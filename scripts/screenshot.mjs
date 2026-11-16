// Screenshots a page of the web app, or one element of it, with the Playwright
// that apps/web already installs for its e2e suite.
//
// Built for coding agents with no browser tool, chiefly the AFK agents in the
// .sandcastle sandbox: without it they screenshot the full page with headless
// Chrome and crop it at guessed offsets, a dozen calls to see one section.
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const USAGE =
  "Usage: pnpm screenshot <path-or-url> [--selector <css>] [--width <px>]... [--mobile] [--height <px>] [--full] [--out <file>]";
const MOBILE_WIDTH = 390;
const OUT_DIR = "/tmp/ff-screenshots";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = join(ROOT, "apps/web");
const DEV_LOCK = join(WEB, ".next/dev/lock");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readDevServerUrl() {
  if (!existsSync(DEV_LOCK)) return null;
  return JSON.parse(readFileSync(DEV_LOCK, "utf8")).appUrl ?? null;
}

const NO_DEV_SERVER =
  "No dev server answers. Run `pnpm dev:server start`, then retry.";

function resolveUrl(target) {
  if (/^https?:\/\//.test(target)) return target;
  const base = readDevServerUrl();
  if (base === null) fail(NO_DEV_SERVER);
  return new URL(target, base).href;
}

function outputPath(target, width, widthCount, out) {
  if (out) {
    return widthCount > 1 ? out.replace(/(\.png)?$/, `-${width}.png`) : out;
  }
  const slug =
    target
      .replace(/^https?:\/\//, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "home";
  return join(OUT_DIR, `${slug}-${width}.png`);
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    selector: { type: "string" },
    width: { type: "string", multiple: true },
    mobile: { type: "boolean" },
    height: { type: "string", default: "900" },
    full: { type: "boolean" },
    out: { type: "string" },
    help: { type: "boolean" },
  },
});

if (values.help || positionals.length !== 1) {
  fail(USAGE);
}

const target = positionals[0];
const widths = (values.width ?? []).map(Number);
if (values.mobile) widths.push(MOBILE_WIDTH);
if (widths.length === 0) widths.push(1440);
const height = Number(values.height);
if ([...widths, height].some((n) => !Number.isInteger(n) || n <= 0)) {
  fail(`--width and --height take a positive integer.\n${USAGE}`);
}

const url = resolveUrl(target);
// Resolved from apps/web, the workspace that declares Playwright.
const requireFromWeb = createRequire(join(WEB, "package.json"));
const { chromium } = requireFromWeb("@playwright/test");

let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  if (String(error).includes("Executable doesn't exist")) {
    fail(
      "Chromium is not installed. Run `pnpm --filter web exec playwright install chromium`, then retry.",
    );
  }
  throw error;
}

try {
  for (const width of widths) {
    // Reduced motion settles entrance animations before the capture.
    const page = await browser.newPage({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const response = await page
      .goto(url, { waitUntil: "networkidle" })
      .catch((error) => {
        if (String(error).includes("ERR_CONNECTION_REFUSED")) {
          fail(
            url === target ? `${url} refused the connection.` : NO_DEV_SERVER,
          );
        }
        throw error;
      });
    if (response && !response.ok()) {
      console.error(`${url} answered ${response.status()}.`);
    }
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: "nextjs-portal { display: none; }" });
    const rejectCookies = page.getByRole("button", { name: "Reject all" });
    if (await rejectCookies.isVisible()) await rejectCookies.click();

    const file = outputPath(target, width, widths.length, values.out);
    mkdirSync(dirname(file), { recursive: true });

    if (values.selector) {
      const matches = page.locator(values.selector);
      const count = await matches.count();
      if (count === 0) fail(`No element matches ${values.selector}.`);
      if (count > 1) {
        console.error(`${count} elements match; capturing the first.`);
      }
      const element = matches.first();
      await element.scrollIntoViewIfNeeded();
      // A sticky header would otherwise overlap the element in the capture.
      await element.evaluate((target) => {
        for (const node of document.body.querySelectorAll("*")) {
          const { position } = getComputedStyle(node);
          const pinned = position === "fixed" || position === "sticky";
          if (pinned && !node.contains(target)) {
            // Opacity, unlike visibility, also hides descendants that set
            // their own visibility, and keeps a sticky header's space.
            node.style.setProperty("opacity", "0", "important");
          }
        }
      });
      // Content revealed on scroll, such as lazy images, loads after the scroll.
      await page.waitForLoadState("networkidle");
      await element.screenshot({ path: file });
    } else {
      await page.screenshot({ path: file, fullPage: values.full ?? false });
    }

    console.log(file);
    await page.close();
  }
} finally {
  await browser.close();
}
