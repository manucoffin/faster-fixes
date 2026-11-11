import { afterEach, describe, expect, it, vi } from "vitest";

import { createDiagnosticsRecorder } from "./recorder.js";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("createDiagnosticsRecorder", () => {
  it("empties the Trail on reset and keeps recording after it", () => {
    vi.stubGlobal("window", globalThis);
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    const recorder = createDiagnosticsRecorder({
      apiOrigin: "https://api.example",
    });
    recorder.start();

    console.info("before the return");
    recorder.reset();
    expect(recorder.snapshot()).toEqual({ console: [], network: [] });

    console.info("after the return");
    recorder.stop();
    expect(recorder.snapshot().console.map(({ message }) => message)).toEqual([
      "after the return",
    ]);
  });
});
