import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
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
    if (u.startsWith("/out/") && !u.includes("..")) {
      res.setHeader("content-type", "application/json");
      return res.end(readFileSync("/tmp/ff374" + u));
    }
  } catch {}
  res.statusCode = 404;
  res.end();
}).listen(4400, "127.0.0.1");
const names = process.argv[2]
  ? process.argv[2].split(",")
  : [
      "A_default",
      "B_inlineImages",
      "C_collectFonts",
      "D_images_fonts",
      "E_noInlineCss",
    ];
const modes = ["live", "gone"];
const browser = await chromium.launch();
const summary = {};
for (const name of names)
  for (const mode of modes) {
    const ctx = await browser.newContext({
      viewport: { width: 1500, height: 1000 },
    });
    const page = await ctx.newPage();
    const reqs = [];
    if (mode === "gone")
      await ctx.route(
        (u) => u.host === "localhost:3200",
        (r) => r.abort("connectionrefused"),
      );
    page.on("requestfinished", async (r) => {
      if (!r.url().startsWith("http://127.0.0.1:4400")) {
        const resp = await r.response();
        reqs.push({
          type: r.resourceType(),
          url: r.url().slice(0, 110),
          status: resp?.status(),
          acao: resp?.headers()["access-control-allow-origin"] ?? null,
        });
      }
    });
    page.on("requestfailed", (r) => {
      if (!r.url().startsWith("http://127.0.0.1:4400"))
        reqs.push({
          type: r.resourceType(),
          url: r.url().slice(0, 110),
          failed: r.failure()?.errorText,
        });
    });
    const consoleErrs = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrs.push(m.text().slice(0, 200));
    });
    await page.goto("http://127.0.0.1:4400/");
    const markers = await page.evaluate((n) => window.load(n), name);
    const per = [];
    for (const m of markers) {
      const lead = Math.min(2000, m.offset);
      await page.evaluate((o) => window.replayer.play(o), m.offset - lead);
      await page.waitForTimeout(lead + 150);
      await page.screenshot({
        path: `/tmp/ff374/out/${name}-replay-${mode}-${m.name}.png`,
      });
      per.push({
        marker: m.name,
        ...(await page.evaluate(() => window.facts())),
      });
      await page.evaluate((o) => window.replayer.pause(o + 50), m.offset);
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: `/tmp/ff374/out/${name}-replay-${mode}-${m.name}-paused.png`,
      });
      per.at(-1).pausedImgs = (
        await page.evaluate(() => window.facts())
      ).imgs.length;
    }
    summary[`${name}/${mode}`] = { reqs, consoleErrs, per };
    await ctx.close();
  }
writeFileSync(
  "/tmp/ff374/out/replay-summary.json",
  JSON.stringify(summary, null, 1),
);
for (const [k, v] of Object.entries(summary)) {
  const by = {};
  for (const r of v.reqs) {
    const key = `${r.type}:${r.failed ?? r.status}${r.acao ? " acao=" + r.acao : ""}`;
    (by[key] ??= new Set()).add(r.url.replace(/\?.*/, "").slice(21, 90));
  }
  console.log("==", k);
  for (const [t, s] of Object.entries(by))
    console.log("  ", t, [...s].slice(0, 6).join(" , "));
  for (const p of v.per)
    console.log(
      "  ",
      p.marker,
      "imgs:",
      JSON.stringify(p.imgs.map((i) => [i.ok, i.w, i.h, i.src.slice(0, 30)])),
      "fonts loaded:",
      p.fonts.filter((f) => f.endsWith(" loaded")).join("; ") || "none",
      "| err:",
      p.fonts.filter((f) => f.endsWith(" error")).length,
      "| sheets:",
      p.sheets.length,
      "| h0:",
      p.h[1],
      "| pausedImgs:",
      p.pausedImgs,
    );
  if (v.consoleErrs.length)
    console.log(
      "   console:",
      [...new Set(v.consoleErrs)].slice(0, 4).join(" || "),
    );
}
await browser.close();
server.close();
