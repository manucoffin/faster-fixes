import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
const require = createRequire(
  "/Users/manuelcoffin/Workspace/personal-projects/faster-fixes/apps/web/package.json",
);
const { chromium } = require("@playwright/test");
const R = "/tmp/ff374/harness/node_modules/@rrweb/replay/dist/";
const server = createServer((req, res) => {
  const u = req.url.split("?")[0];
  try {
    if (u === "/") {
      res.setHeader("content-type", "text/html");
      return res.end(readFileSync("/tmp/ff374/harness/replay.html"));
    }
    if (u === "/replay/style.css") {
      res.setHeader("content-type", "text/css");
      return res.end(readFileSync(R + "style.css"));
    }
    if (u === "/replay/replay.umd.min.cjs") {
      res.setHeader("content-type", "text/javascript");
      return res.end(readFileSync(R + "replay.umd.min.cjs"));
    }
    if (u.startsWith("/out/")) {
      res.setHeader("content-type", "application/json");
      return res.end(readFileSync("/tmp/ff374" + u));
    }
  } catch {}
  res.statusCode = 404;
  res.end();
}).listen(4400, "127.0.0.1");
const browser = await chromium.launch();
for (const [name, mode] of [
  ["A_default", "live"],
  ["A_default", "gone"],
  ["B_inlineImages", "gone"],
  ["E_noInlineCss", "live"],
]) {
  const ctx = await browser.newContext({
    viewport: { width: 1500, height: 960 },
  });
  const page = await ctx.newPage();
  if (mode === "gone")
    await ctx.route(
      (u) => u.host === "localhost:3200",
      (r) => r.abort("connectionrefused"),
    );
  await page.goto("http://127.0.0.1:4400/");
  await page.evaluate((n) => window.load(n), name);
  await page.evaluate(() => window.replayer.play(0));
  await page.waitForFunction(() => window.replayer.getCurrentTime() >= 2600);
  await page.screenshot({
    path: `/tmp/ff374/out/${name}-${mode}-drawer-playing.png`,
  });
  const f = await page.evaluate(() => {
    const d = window.replayer.iframe.contentDocument;
    const h = d.querySelector("[role=dialog] h2, [role=dialog] h1");
    const r = h?.getBoundingClientRect();
    return {
      t: window.replayer.getCurrentTime(),
      title: h?.innerText,
      rect: r && [Math.round(r.width), Math.round(r.height)],
      img: [...d.images].map((i) => [i.naturalWidth > 0, i.width, i.height]),
    };
  });
  await page.evaluate(() => window.replayer.pause(2600));
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: `/tmp/ff374/out/${name}-${mode}-drawer-paused.png`,
  });
  await page.evaluate(() => window.replayer.play(7000));
  await page.waitForFunction(() => window.replayer.getCurrentTime() >= 8800);
  await page.screenshot({
    path: `/tmp/ff374/out/${name}-${mode}-reviewers-playing.png`,
  });
  console.log(name, mode, JSON.stringify(f));
  await ctx.close();
}
await browser.close();
server.close();
