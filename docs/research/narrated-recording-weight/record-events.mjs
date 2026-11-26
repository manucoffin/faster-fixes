// Records real pages with @rrweb/record under the Widget's configuration while
// a scripted visitor moves, scrolls, clicks, types and navigates, then writes
// the raw events of each scenario to <out>/<scenario>.json.
//
// Run from apps/web so Playwright and rrweb resolve:
//   node <this file> <out dir> [minutes]
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));
const { chromium } = require("@playwright/test");
const widgetRequire = createRequire(
  path.resolve(process.cwd(), "../../packages/widget/package.json"),
);
const rrwebSource = readFileSync(
  widgetRequire.resolve("@rrweb/record").replace(/record\.[a-z.]+$/, "record.umd.min.cjs"),
  "utf8",
);

const outDir = path.resolve(process.argv[2] ?? "out");
const minutes = Number(process.argv[3] ?? 10);
const CHECKPOINT_MS = 60_000;
mkdirSync(outDir, { recursive: true });

// `navigate`: "none" stays on the page, "spa" and "mpa" follow a same-origin
// link every `linkEveryMs`.
const scenarios = [
  {
    name: "light-mdn-article",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder",
    navigate: "none",
  },
  {
    name: "heavy-stripe-home",
    url: "https://stripe.com/",
    navigate: "none",
  },
  {
    name: "heavy-linear-home",
    url: "https://linear.app/",
    navigate: "none",
  },
  {
    name: "spa-react-dev",
    url: "https://react.dev/learn",
    navigate: "links",
    linkSelector: `nav a[href^="/learn/"]:not([href*="#"]), main a[href^="/learn/"]:not([href*="#"]), main a[href^="/reference/"]:not([href*="#"])`,
    linkEveryMs: 40_000,
  },
  {
    name: "multipage-wikipedia",
    url: "https://en.wikipedia.org/wiki/Web_browser",
    navigate: "links",
    linkSelector: `#mw-content-text p a[href*="/wiki/"]:not([href*="/wiki/File:"]):not([href*="#"])`,
    linkEveryMs: 40_000,
  },
];

// Mirrors packages/widget/src/recorder/index.ts, minus the 30 s slicing.
const initScript = `
${rrwebSource}
;(() => {
  if (window.top !== window) return;
  const record = window.rrwebRecord.record || window.rrwebRecord;
  let pending = [];
  const flush = () => {
    if (!pending.length || !window.__ffEvents) return;
    const batch = pending;
    pending = [];
    window.__ffEvents(JSON.stringify(batch));
  };
  const start = () => {
    const t0 = performance.now();
    record({
      emit: (event) => pending.push(event),
      sampling: { mousemove: 100, scroll: 150, input: "last" },
      maskAllInputs: true,
      maskTextSelector: '[data-ff-mask], [contenteditable]:not([contenteditable="false"])',
      blockSelector: "[data-ff-block], [data-ff-widget]",
      recordCanvas: false,
      inlineImages: false,
      collectFonts: false,
      errorHandler: () => true,
    });
    window.__ffStartMs = performance.now() - t0;
    setInterval(flush, 250);
    setInterval(() => {
      if (!document.hidden) record.takeFullSnapshot();
    }, ${CHECKPOINT_MS});
    addEventListener("pagehide", flush);
  };
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", start);
  else start();
})();
`;

const PHRASES = [
  "the button does nothing",
  "media recorder",
  "how do I reset this",
  "checkout total is wrong",
  "use effect",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = (list) => list[Math.floor(Math.random() * list.length)];

async function visibleBox(page, selector) {
  const candidates = await page.evaluate((query) => {
    const boxes = [];
    for (const element of document.querySelectorAll(query)) {
      const box = element.getBoundingClientRect();
      if (
        box.width > 4 &&
        box.height > 4 &&
        box.top >= 0 &&
        box.bottom <= innerHeight &&
        box.left >= 0 &&
        box.right <= innerWidth
      )
        boxes.push({ x: box.left, y: box.top, width: box.width, height: box.height });
    }
    return boxes;
  }, selector);
  return candidates.length ? pick(candidates) : null;
}

async function clickBox(page, box) {
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y, { steps: 12 });
  await sleep(150);
  await page.mouse.click(x, y);
}

async function drive(page, scenario, origin, stats, deadline) {
  let lastLink = Date.now();
  let lastType = Date.now() - 20_000;
  const step = async () => {
      stats.last = "check";
      if (new URL(page.url()).origin !== origin) {
        await page.goto(scenario.url, { waitUntil: "domcontentloaded" });
      }
      const viewport = page.viewportSize();
      const roll = Math.random();
      if (
        scenario.navigate === "links" &&
        Date.now() - lastLink > scenario.linkEveryMs
      ) {
        let box = await visibleBox(page, scenario.linkSelector);
        if (!box) {
          // No link in view: bring one in, as a reader looking for one would.
          await page.evaluate((query) => {
            const links = document.querySelectorAll(query);
            links[Math.floor(Math.random() * links.length)]?.scrollIntoView({
              block: "center",
              behavior: "smooth",
            });
          }, scenario.linkSelector);
          await sleep(1200);
          box = await visibleBox(page, scenario.linkSelector);
        }
        stats.last = "link";
        if (box) {
          await clickBox(page, box);
          stats.linkClicks += 1;
          lastLink = Date.now();
          await sleep(2500);
        } else {
          await page.mouse.wheel(0, 500);
        }
      } else if (Date.now() - lastType > 45_000) {
        const box = await visibleBox(
          page,
          `input[type="search"], input[type="text"], input:not([type]), textarea, button[aria-label*="earch" i], button[class*="earch" i]`,
        );
        lastType = Date.now();
        stats.last = "type";
        if (box) {
          await clickBox(page, box);
          await sleep(400);
          await page.keyboard.type(pick(PHRASES), { delay: 90 });
          stats.typed += 1;
          await sleep(1500);
          await page.keyboard.press("Escape");
        }
      } else if (roll < 0.4) {
        await page.mouse.move(
          40 + Math.random() * (viewport.width - 80),
          40 + Math.random() * (viewport.height - 80),
          { steps: 20 },
        );
      } else if (roll < 0.75) {
        const direction = Math.random() < 0.75 ? 1 : -1;
        for (let step = 0; step < 4; step += 1) {
          await page.mouse.wheel(0, direction * (80 + Math.random() * 160));
          await sleep(60);
        }
        stats.scrolls += 1;
      } else {
        const box = await visibleBox(
          page,
          `button, summary, [role="tab"], [role="button"], a[href^="#"], label`,
        );
        stats.last = "click";
        if (box) {
          await clickBox(page, box);
          stats.clicks += 1;
        }
      }
  };
  while (Date.now() < deadline) {
    // An input that starts a navigation which never settles would hang the
    // visitor: past 20 s the page is reloaded, as a stuck Reviewer would.
    let timer;
    const stalled = new Promise((resolve) => {
      timer = setTimeout(() => resolve("stalled"), 20_000);
    });
    const outcome = await Promise.race([
      step().catch(() => {
        stats.errors += 1;
      }),
      stalled,
    ]);
    clearTimeout(timer);
    if (outcome === "stalled") {
      stats.stalls += 1;
      await page
        .goto(scenario.url, { waitUntil: "domcontentloaded", timeout: 20_000 })
        .catch(() => {});
    }
    await sleep(500 + Math.random() * 1500);
  }
}

async function runScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    bypassCSP: true,
    locale: "en-US",
  });
  const events = [];
  const loads = [];
  await context.exposeBinding("__ffEvents", ({ frame, page }, json) => {
    if (frame !== page.mainFrame()) return;
    for (const event of JSON.parse(json)) events.push(event);
  });
  await context.addInitScript(initScript);
  const page = await context.newPage();
  page.on("load", () => loads.push({ at: Date.now(), url: page.url() }));
  // Dialogs would freeze the page under the scripted visitor.
  page.on("dialog", (dialog) => dialog.dismiss().catch(() => {}));
  context.on("page", (other) => {
    if (other !== page) other.close().catch(() => {});
  });
  const stats = { clicks: 0, linkClicks: 0, typed: 0, scrolls: 0, errors: 0, stalls: 0 };
  await page.goto(scenario.url, { waitUntil: "domcontentloaded" });
  const origin = new URL(page.url()).origin;
  await sleep(2000);
  const startedAt = Date.now();
  const trace = process.env.TRACE
    ? setInterval(() => console.log(scenario.name, JSON.stringify(stats), page.url()), 10_000)
    : null;
  await drive(page, scenario, origin, stats, startedAt + minutes * 60_000);
  clearInterval(trace);
  await sleep(600);
  const dom = await page
    .evaluate(() => ({
      elements: document.querySelectorAll("*").length,
      startMs: window.__ffStartMs,
    }))
    .catch(() => null);
  await context.close();
  events.sort((a, b) => a.timestamp - b.timestamp);
  writeFileSync(
    path.join(outDir, `${scenario.name}.json`),
    JSON.stringify({ scenario, minutes, startedAt, stats, loads, dom, events }),
  );
  console.log(scenario.name, stats, `${events.length} events`, `${loads.length} loads`);
}

const browser = await chromium.launch({ headless: true });
await Promise.all(
  scenarios
    .filter((scenario) => !process.env.ONLY || process.env.ONLY.split(",").includes(scenario.name))
    .map((scenario) =>
    runScenario(browser, scenario).catch((error) =>
      console.error(scenario.name, "failed", error.message),
    ),
  ),
);
await browser.close();
