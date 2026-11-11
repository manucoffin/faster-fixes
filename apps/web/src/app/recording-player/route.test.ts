import { describe, expect, it } from "vitest";

import { GET } from "./route";

function readPolicy(response: Response) {
  const policy = response.headers.get("Content-Security-Policy") ?? "";
  return new Map(
    policy.split(";").map((directive) => {
      const [name = "", ...sources] = directive.trim().split(/\s+/);
      return [name, sources.join(" ")];
    }),
  );
}

describe("GET /recording-player", () => {
  it("answers an HTML document without a session", async () => {
    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/html; charset=utf-8",
    );
    const html = await response.text();
    expect(html).toContain('<script src="/recording-player/player.js">');
  });

  it("sends no referrer", () => {
    expect(GET().headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it.each([
    ["default-src", "'none'"],
    ["script-src", "'self'"],
    ["connect-src", "'none'"],
    ["form-action", "'none'"],
    ["base-uri", "'none'"],
    ["object-src", "'none'"],
    ["frame-ancestors", "'self'"],
    ["img-src", "* data: blob:"],
    ["font-src", "* data:"],
    ["media-src", "* data: blob:"],
    ["style-src", "* data: 'unsafe-inline'"],
  ])("sets %s to %s", (directive, sources) => {
    expect(readPolicy(GET()).get(directive)).toBe(sources);
  });

  it("allows no inline script and no script from another host", () => {
    const scriptSources = readPolicy(GET()).get("script-src") ?? "";

    expect(scriptSources).not.toContain("unsafe-inline");
    expect(scriptSources).not.toContain("*");
  });
});
