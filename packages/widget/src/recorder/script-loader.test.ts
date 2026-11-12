import { describe, expect, it } from "vitest";

import {
  createScriptRecorderLoader,
  RECORDER_GLOBAL,
  recorderFileUrl,
} from "./script-loader.js";

type FakeScript = {
  src: string;
  async: boolean;
  nonce: string;
  listeners: Record<string, () => void>;
  addEventListener: (type: string, listener: () => void) => void;
};

// Just enough of a document for the loader: it creates and appends scripts.
function createFakeDocument() {
  const view: Record<string, unknown> = {};
  const appended: FakeScript[] = [];
  const document = {
    defaultView: view,
    createElement: () => {
      const script: FakeScript = {
        src: "",
        async: false,
        nonce: "",
        listeners: {},
        addEventListener(type, listener) {
          script.listeners[type] = listener;
        },
      };
      return script;
    },
    head: { appendChild: (script: FakeScript) => appended.push(script) },
  };
  return { document: document as unknown as Document, view, appended };
}

const SRC = recorderFileUrl("1.4.0");
const startRecording = () => ({ stop() {} });

describe("recorderFileUrl", () => {
  it("addresses the recorder file at the exact package version on jsDelivr", () => {
    expect(SRC).toBe(
      "https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1.4.0/dist/recorder.iife.js",
    );
  });
});

describe("createScriptRecorderLoader", () => {
  it("inserts an async script for the file, carrying the given nonce", () => {
    const { document, appended } = createFakeDocument();
    void createScriptRecorderLoader(document, SRC, "n0nce")();

    expect(appended).toHaveLength(1);
    expect(appended[0]).toMatchObject({
      src: SRC,
      async: true,
      nonce: "n0nce",
    });
  });

  it("resolves to the module the file puts on its global", async () => {
    const { document, view, appended } = createFakeDocument();
    const loading = createScriptRecorderLoader(document, SRC, "")();

    view[RECORDER_GLOBAL] = { startRecording };
    appended[0]?.listeners.load?.();

    expect(await loading).toEqual({ startRecording });
  });

  it("resolves to null when the file fails or sets nothing", async () => {
    const failed = createFakeDocument();
    const failing = createScriptRecorderLoader(failed.document, SRC, "")();
    failed.appended[0]?.listeners.error?.();
    expect(await failing).toBeNull();

    const empty = createFakeDocument();
    const loading = createScriptRecorderLoader(empty.document, SRC, "")();
    empty.appended[0]?.listeners.load?.();
    expect(await loading).toBeNull();
  });

  it("requests the file once, even after a failure", async () => {
    const { document, appended } = createFakeDocument();
    const load = createScriptRecorderLoader(document, SRC, "");

    const first = load();
    appended[0]?.listeners.error?.();
    await first;
    await Promise.race([load(), Promise.resolve()]);

    expect(appended).toHaveLength(1);
  });
});
