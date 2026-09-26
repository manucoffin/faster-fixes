import { describe, expect, it } from "vitest";

import {
  findOwnScript,
  readScriptOptions,
  whenBodyReady,
} from "./script-options.js";

function tag(attributes: Record<string, string>) {
  return {
    getAttribute: (name: string) => attributes[name] ?? null,
  } as Element;
}

describe("readScriptOptions", () => {
  it("returns null without data-project-id", () => {
    expect(readScriptOptions(tag({ "data-color": "#ff0000" }))).toBeNull();
  });

  it("maps only the attributes present", () => {
    expect(readScriptOptions(tag({ "data-project-id": "proj_abc" }))).toEqual({
      projectId: "proj_abc",
    });
  });

  it("maps every data-* attribute to its option", () => {
    expect(
      readScriptOptions(
        tag({
          "data-project-id": "proj_abc",
          "data-api-origin": "http://localhost:3000",
          "data-color": "#ff0000",
          "data-position": "top-left",
          "data-capture-diagnostics": "true",
        }),
      ),
    ).toEqual({
      projectId: "proj_abc",
      apiOrigin: "http://localhost:3000",
      color: "#ff0000",
      position: "top-left",
      captureDiagnostics: true,
    });
  });

  it.each([
    ["false", false],
    [" false ", false],
    ["true", true],
    ["", true],
  ])("reads data-capture-diagnostics=%j as %s", (value, expected) => {
    expect(
      readScriptOptions(
        tag({
          "data-project-id": "proj_abc",
          "data-capture-diagnostics": value,
        }),
      ),
    ).toMatchObject({ captureDiagnostics: expected });
  });

  it("passes invalid values through for init to validate", () => {
    expect(
      readScriptOptions(
        tag({ "data-project-id": "", "data-position": "center" }),
      ),
    ).toEqual({ projectId: "", position: "center" });
  });
});

describe("findOwnScript", () => {
  function fakeDocument(currentScript: Element | null, srcs: string[]) {
    const scripts = srcs.map((src) => tag({ src }));
    return {
      currentScript,
      getElementsByTagName: () => scripts,
    } as unknown as Document;
  }

  it("prefers document.currentScript", () => {
    const current = tag({ src: "/other.js" });

    expect(findOwnScript(fakeDocument(current, []))).toBe(current);
  });

  it("falls back to the tag whose src is the IIFE", () => {
    const document = fakeDocument(null, [
      "/app.js",
      "https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js?v=2",
    ]);

    expect(findOwnScript(document)?.getAttribute("src")).toContain(
      "widget.iife.js",
    );
  });

  it("returns null when no tag matches", () => {
    expect(findOwnScript(fakeDocument(null, ["/app.js"]))).toBeNull();
  });
});

describe("whenBodyReady", () => {
  it.each(["interactive", "complete"])(
    "resolves at once when the document is %s",
    async (readyState) => {
      await expect(
        whenBodyReady({ readyState } as Document),
      ).resolves.toBeUndefined();
    },
  );

  it("waits for DOMContentLoaded while the document is loading", async () => {
    let fire: () => void = () => undefined;
    const document = {
      readyState: "loading",
      addEventListener: (_type: string, listener: () => void) => {
        fire = listener;
      },
    } as unknown as Document;

    let resolved = false;
    const ready = whenBodyReady(document).then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).toBe(false);

    fire();
    await ready;
    expect(resolved).toBe(true);
  });
});
