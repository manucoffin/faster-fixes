import type { SelectionGeometry } from "@fasterfixes/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildFeedbackPayload } from "./feedback-payload.js";

// The core helpers read a real DOM and navigator, which the node environment lacks.
vi.mock("@fasterfixes/core", () => ({
  generateSelectors: () => ({ best: "#target", strategies: {} }),
  captureElementContext: () => ({ elementDescription: "<h1>" }),
  getBrowserInfo: () => ({ browserName: "Chrome" }),
}));

const geometry: SelectionGeometry = {
  viewport: { width: 1280, height: 720 },
  element: { left: 40, top: 100, width: 200, height: 40 },
  click: { x: 90, y: 120 },
};

// The element has scrolled since the Selection: submit-time reads differ from the geometry.
function scrolledElement() {
  const root = {} as Element;
  return {
    ownerDocument: { documentElement: root, defaultView: null },
    parentElement: root,
    getBoundingClientRect: () => ({
      left: 40,
      top: -300,
      width: 200,
      height: 40,
    }),
  } as unknown as Element;
}

describe("buildFeedbackPayload", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { href: "https://example.com/page" },
      scrollX: 0,
      scrollY: 400,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the Selection geometry unchanged under the selection metadata key", () => {
    const payload = buildFeedbackPayload({
      comment: "Misaligned",
      element: scrolledElement(),
      click: { x: 90, y: 120 },
      selection: geometry,
      diagnosticTrail: undefined,
      customMetadata: undefined,
    });

    expect(payload.metadata?.selection).toEqual(geometry);
    expect(payload.metadata).toMatchObject({
      elementDescription: "<h1>",
      pinAnchor: expect.any(Object),
      pinPlacement: expect.any(Object),
    });
  });
});
