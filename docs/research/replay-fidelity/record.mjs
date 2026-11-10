import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
const require = createRequire(
  "/Users/manuelcoffin/Workspace/personal-projects/faster-fixes/apps/web/package.json",
);
const { chromium } = require("@playwright/test");
const variants = {
  A_default: {},
  B_inlineImages: { inlineImages: true },
  C_collectFonts: { collectFonts: true },
  D_images_fonts: { inlineImages: true, collectFonts: true },
  E_noInlineCss: { inlineStylesheet: false },
};
const only = process.argv[2];
mkdirSync("/tmp/ff374/out", { recursive: true });
const browser = await chromium.launch();
for (const [name, opts] of Object.entries(variants)) {
  if (only && only !== name) continue;
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: "/tmp/ff374/state.json",
    bypassCSP: true,
  });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3200/inbox");
  await page.waitForLoadState("networkidle");
  await page.addScriptTag({
    path: "/tmp/ff374/harness/node_modules/@rrweb/record/dist/record.umd.min.cjs",
  });
  const snapMs = await page.evaluate((o) => {
    window.__events = [];
    const t = performance.now();
    window.__stop = rrwebRecord.record({
      emit: (e) => window.__events.push(e),
      ...o,
    });
    return performance.now() - t;
  }, opts);
  const mark = (n) =>
    page.evaluate(
      (n) => rrwebRecord.record.addCustomEvent("marker", { name: n }),
      n,
    );
  const facts = async (n) => ({
    marker: n,
    ...(await page.evaluate(() => ({
      url: location.pathname,
      imgs: [...document.images].map((i) => ({
        src: i.currentSrc.slice(0, 140),
        ok: i.naturalWidth > 0,
        w: i.width,
        h: i.height,
      })),
      bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 120),
      fonts: [...document.fonts].map(
        (f) => `${f.family} ${f.weight} ${f.status}`,
      ),
      h: [...document.querySelectorAll("h1,h2,h3,[data-sidebar=menu-button]")]
        .slice(0, 8)
        .map((e) => {
          const r = e.getBoundingClientRect();
          return `${e.innerText.trim().slice(0, 24)}:${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)}`;
        }),
      sheets: [...document.styleSheets].map((s) => {
        let n = -1;
        try {
          n = s.cssRules.length;
        } catch {}
        return `${(s.href || "inline").slice(-60)}:${n}`;
      }),
      bgUrls: [
        ...new Set(
          [...document.querySelectorAll("*")]
            .map((e) => getComputedStyle(e).backgroundImage)
            .filter((b) => b.includes("url(")),
        ),
      ].map((b) => b.slice(0, 120)),
    }))),
  });
  const out = [];
  await page.mouse.move(400, 300, { steps: 8 });
  await page.waitForTimeout(500);
  await mark("inbox");
  out.push(await facts("inbox"));
  await page.screenshot({ path: `/tmp/ff374/out/${name}-orig-inbox.png` });
  await page
    .getByText("Price shows NaN when quantity is cleared")
    .locator("visible=true")
    .first()
    .click();
  await page.waitForTimeout(2500);
  await page.waitForLoadState("networkidle");
  await mark("detail");
  out.push(await facts("detail"));
  await page.screenshot({ path: `/tmp/ff374/out/${name}-orig-detail.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  await page.locator('a[href="/reviewers"]').first().click();
  await page.waitForTimeout(2500);
  await mark("reviewers");
  out.push(await facts("reviewers"));
  await page.screenshot({ path: `/tmp/ff374/out/${name}-orig-reviewers.png` });
  await page.locator('a[href="/account/settings"]').first().click();
  await page.waitForTimeout(2500);
  await mark("account");
  out.push(await facts("account"));
  await page.screenshot({ path: `/tmp/ff374/out/${name}-orig-account.png` });
  await page.waitForTimeout(500);
  const events = await page.evaluate(() => {
    window.__stop();
    return window.__events;
  });
  const json = JSON.stringify(events);
  const full = events.filter((e) => e.type === 2);
  writeFileSync(`/tmp/ff374/out/${name}.events.json`, json);
  writeFileSync(
    `/tmp/ff374/out/${name}.orig.json`,
    JSON.stringify(out, null, 1),
  );
  console.log(
    name,
    JSON.stringify({
      snapMs: Math.round(snapMs),
      events: events.length,
      durationS: (
        (events.at(-1).timestamp - events[0].timestamp) /
        1000
      ).toFixed(1),
      rawKB: Math.round(json.length / 1024),
      gzKB: Math.round(gzipSync(json).length / 1024),
      fullSnapshots: full.length,
      fullSnapKB: Math.round(JSON.stringify(full[0]).length / 1024),
      fullSnapGzKB: Math.round(gzipSync(JSON.stringify(full[0])).length / 1024),
    }),
  );
  if (name === "A_default") console.log(JSON.stringify(out, null, 1));
  await ctx.close();
}
await browser.close();
