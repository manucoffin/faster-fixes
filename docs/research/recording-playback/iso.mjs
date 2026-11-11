import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import http from "node:http";
const require = createRequire(
  "/Users/manuelcoffin/Workspace/personal-projects/faster-fixes/apps/web/package.json",
);
const { chromium, firefox, webkit } = require("@playwright/test");
const D = process.argv[2];
const sandbox = process.argv[3] ?? "allow-scripts";
const events = gunzipSync(readFileSync(D + "/recording.json.gz")).toString();
const host = `<!doctype html><body style="margin:0"><script>document.cookie="session=secret";window.SECRET="dashboard";</script>
<iframe id="f" sandbox="${sandbox}" src="/player.html" style="width:900px;height:562px;border:0"></iframe>
<script>window.msgs=[];addEventListener("message",e=>{window.msgs.push(e.data);if(e.data.type==="boot")document.getElementById("f").contentWindow.postMessage({type:"load",events:${events}},"*")});</script>`;
const srv = http
  .createServer((q, r) => {
    const u = q.url.split("?")[0];
    if (u === "/") {
      r.writeHead(200, {
        "content-type": "text/html",
        "x-frame-options": "SAMEORIGIN",
      });
      return r.end(host);
    }
    try {
      r.writeHead(200, {
        "content-type": u.endsWith(".html")
          ? "text/html"
          : u.endsWith(".js")
            ? "text/javascript"
            : "text/css",
        "x-frame-options": "SAMEORIGIN",
      });
      r.end(readFileSync(D + u));
    } catch {
      r.writeHead(404);
      r.end();
    }
  })
  .listen(4378);
for (const [name, bt] of [
  ["chromium", chromium],
  ["firefox", firefox],
  ["webkit", webkit],
]) {
  try {
    const b = await bt.launch();
    const p = await b.newPage({ viewport: { width: 900, height: 562 } });
    const errs = [];
    p.on(
      "console",
      (m) => m.type() === "error" && errs.push(m.text().slice(0, 200)),
    );
    p.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
    await p.goto("http://localhost:4378/");
    await p.waitForTimeout(3000);
    const msgs = await p.evaluate(() =>
      window.msgs
        .filter((m) => m.type !== "time")
        .concat(window.msgs.filter((m) => m.type === "time").slice(-1)),
    );
    await p.screenshot({
      path: `/tmp/ff377/out/iso-${name}-${sandbox.replace(/\W+/g, "_")}.png`,
    });
    console.log(name, JSON.stringify(msgs), errs);
    await b.close();
  } catch (e) {
    console.log(name, "SKIP", String(e).slice(0, 120));
  }
}
srv.close();
