// Serves the resume test page and collects the reports and audio it posts.
//
//   node server.mjs <rrweb dist dir> <out dir> [port] [alt origin]
//
// The alt origin is another hostname reaching this same server, for the
// "other subdomain" link (http://sub.localhost:<port> works on desktop).
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const rrwebDist = path.resolve(process.argv[2]);
const outDir = path.resolve(process.argv[3] ?? "out");
const port = Number(process.argv[4] ?? 4477);
const altOrigin = process.argv[5] ?? "";
mkdirSync(outDir, { recursive: true });

const here = path.dirname(new URL(import.meta.url).pathname);
const rrweb = readFileSync(path.join(rrwebDist, "rrweb.umd.min.cjs"));
const css = readFileSync(path.join(rrwebDist, "style.min.css"));

function body(request) {
  return new Promise((resolve) => {
    const parts = [];
    request.on("data", (part) => parts.push(part));
    request.on("end", () => resolve(Buffer.concat(parts)));
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://x");
  if (
    url.pathname === "/" ||
    url.pathname === "/two" ||
    request.method === "POST"
  )
    console.log(
      new Date().toISOString(),
      request.method,
      url.pathname,
      (request.headers["user-agent"] ?? "").slice(-40),
    );
  if (url.pathname === "/rrweb.js") {
    response.writeHead(200, { "content-type": "text/javascript" });
    return response.end(rrweb);
  }
  if (url.pathname === "/rrweb.css") {
    response.writeHead(200, { "content-type": "text/css" });
    return response.end(css);
  }
  if (request.method === "POST" && url.pathname === "/report") {
    const report = JSON.parse((await body(request)).toString());
    const file = path.join(outDir, `report-${report.session}.json`);
    writeFileSync(file, JSON.stringify(report, null, 2));
    console.log("report", file, report.userAgent);
    response.writeHead(204);
    return response.end();
  }
  if (request.method === "POST" && url.pathname === "/client-error") {
    console.log("client-error", (await body(request)).toString());
    response.writeHead(204);
    return response.end();
  }
  if (request.method === "POST" && url.pathname === "/audio") {
    const session = url.searchParams.get("session").replace(/\W/g, "");
    const segment = Number(url.searchParams.get("segment"));
    const extension = url.searchParams.get("ext").replace(/\W/g, "");
    writeFileSync(
      path.join(outDir, `audio-${session}-${segment}.${extension}`),
      await body(request),
    );
    response.writeHead(204);
    return response.end();
  }
  if (url.pathname === "/" || url.pathname === "/two") {
    // The alt link points back at whichever host the page was not served from.
    const host = request.headers["x-forwarded-host"] ?? request.headers.host;
    const scheme = request.headers["x-forwarded-proto"] ?? "http";
    const self = `${scheme}://${host}`;
    const origins = altOrigin.split(",").filter(Boolean);
    const other = origins.find((origin) => origin !== self) ?? "";
    const page = readFileSync(path.join(here, "page.html"), "utf8").replace(
      '<script src="/rrweb.js"></script>',
      `<script>window.ALT_ORIGIN = ${JSON.stringify(other)};</script><script src="/rrweb.js"></script>`,
    );
    response.writeHead(200, { "content-type": "text/html" });
    return response.end(page);
  }
  response.writeHead(404);
  response.end();
});
server.listen(port, "0.0.0.0", () =>
  console.log(`listening on http://localhost:${port}`),
);
