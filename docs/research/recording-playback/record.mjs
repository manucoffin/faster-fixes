import { createRequire } from "node:module";
import { writeFileSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import http from "node:http";
const require = createRequire(
  "/Users/manuelcoffin/Workspace/personal-projects/faster-fixes/apps/web/package.json",
);
const { chromium } = require("@playwright/test");
const S = "/tmp/ff377/site";
const srv = http
  .createServer((q, r) => {
    const u = q.url.split("?")[0];
    if (u.endsWith("/pay"))
      return setTimeout(() => {
        r.writeHead(500);
        r.end("{}");
      }, 420);
    if (u.startsWith("/api/"))
      return setTimeout(() => {
        r.writeHead(200, { "content-type": "application/json" });
        r.end("{}");
      }, 90);
    const f = u === "/" ? "/index.html" : u;
    try {
      r.writeHead(200, {
        "content-type": f.endsWith(".html")
          ? "text/html"
          : f.endsWith(".png")
            ? "image/png"
            : "font/collection",
      });
      r.end(readFileSync(S + f));
    } catch {
      r.writeHead(404);
      r.end();
    }
  })
  .listen(4377);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto("http://localhost:4377/");
await p.addScriptTag({
  path: "/tmp/ff377/harness/node_modules/@rrweb/record/dist/record.umd.min.cjs",
});
await p.evaluate(() => {
  window.__ev = [];
  window.__trail = { console: [], network: [] };
  for (const level of ["log", "info", "warn", "error", "debug"]) {
    const o = console[level];
    console[level] = (...a) => {
      window.__trail.console.push({
        level,
        message: a.join(" "),
        timestamp: Date.now(),
      });
      o(...a);
    };
  }
  const of = window.fetch;
  window.fetch = async (u, i) => {
    const t = Date.now();
    const r = await of(u, i);
    window.__trail.network.push({
      method: i?.method ?? "GET",
      url: new URL(u, location.href).href,
      status: r.status,
      duration: Date.now() - t,
      timestamp: t,
    });
    return r;
  };
  window.__stop = rrwebRecord.record({
    emit: (e) => window.__ev.push(e),
    maskAllInputs: true,
    maskTextSelector: "[data-ff-mask], [contenteditable]",
    blockSelector: "[data-ff-block]",
    inlineStylesheet: true,
  });
});
const w = (ms) => p.waitForTimeout(ms);
await w(1500);
await p.mouse.move(300, 300, { steps: 15 });
await p.click("#q");
await p.keyboard.type("northwind", { delay: 110 });
await w(900);
await p.hover('tr[data-n="INV-1041"]');
await w(500);
await p.click('tr[data-n="INV-1042"]');
await w(1800);
await p.click("#note");
await p.keyboard.type("Paid by wire on Tuesday", { delay: 70 });
await w(800);
await p.click("#pay");
await w(3200);
await p.click("#pay");
await w(1600);
await p.hover("#pay");
await w(300);
const rect = await p.evaluate(() => {
  const r = document.querySelector("#pay").getBoundingClientRect();
  return {
    x: r.x / innerWidth,
    y: r.y / innerHeight,
    width: r.width / innerWidth,
    height: r.height / innerHeight,
  };
});
const end = await p.evaluate(() => {
  window.__stop();
  return Date.now();
});
await p.screenshot({ path: "/tmp/ff377/out/screenshot.png" });
const events = await p.evaluate(() => window.__ev);
const trail = await p.evaluate(() => window.__trail);
const json = JSON.stringify(events);
writeFileSync("/tmp/ff377/out/recording.json.gz", gzipSync(json));
writeFileSync(
  "/tmp/ff377/out/meta.json",
  JSON.stringify(
    {
      startedAt: events[0].timestamp,
      endedAt: end,
      viewport: { width: 1280, height: 800 },
      selection: rect,
      trail,
    },
    null,
    1,
  ),
);
console.log(
  "events",
  events.length,
  "raw KB",
  (json.length / 1024) | 0,
  "gz KB",
  (gzipSync(json).length / 1024) | 0,
  "dur s",
  (end - events[0].timestamp) / 1000,
  trail.console.length,
  trail.network.length,
);
await b.close();
srv.close();
