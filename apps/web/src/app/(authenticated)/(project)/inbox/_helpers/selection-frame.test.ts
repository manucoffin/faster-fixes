import { describe, expect, it } from "vitest";
import { getSelectionFrame } from "./selection-frame";

const selection = {
  viewport: { width: 1000, height: 500 },
  element: { left: 100, top: 50, width: 200, height: 100 },
  click: { x: 150, y: 75 },
};

describe("getSelectionFrame", () => {
  it("returns the element and click point as percentages of the viewport", () => {
    expect(getSelectionFrame({ selection })).toEqual({
      element: { left: 10, top: 10, width: 20, height: 20 },
      click: { x: 15, y: 15 },
    });
  });

  it("returns nothing when the Feedback has no metadata", () => {
    expect(getSelectionFrame(null)).toBeNull();
  });

  it("returns nothing when the metadata has no selection key", () => {
    expect(getSelectionFrame({ elementDescription: "button" })).toBeNull();
  });

  it("returns nothing when the selection is not an object", () => {
    expect(getSelectionFrame({ selection: "100,50" })).toBeNull();
  });

  it("returns nothing when a value is not a number", () => {
    expect(
      getSelectionFrame({
        selection: {
          ...selection,
          element: { ...selection.element, top: "50" },
        },
      }),
    ).toBeNull();
    expect(
      getSelectionFrame({
        selection: { ...selection, click: { x: 150 } },
      }),
    ).toBeNull();
  });

  it("returns nothing when the viewport has zero size", () => {
    expect(
      getSelectionFrame({
        selection: { ...selection, viewport: { width: 0, height: 500 } },
      }),
    ).toBeNull();
  });

  it("returns nothing when the rectangle lies outside the viewport", () => {
    expect(
      getSelectionFrame({
        selection: {
          ...selection,
          element: { left: 100, top: 600, width: 200, height: 100 },
        },
      }),
    ).toBeNull();
    expect(
      getSelectionFrame({
        selection: {
          ...selection,
          element: { left: -300, top: 50, width: 200, height: 100 },
        },
      }),
    ).toBeNull();
  });

  it("returns nothing when the click point lies outside the viewport", () => {
    expect(
      getSelectionFrame({
        selection: { ...selection, click: { x: 150, y: 900 } },
      }),
    ).toBeNull();
  });

  it("clips an element larger than the viewport to the visible part", () => {
    const frame = getSelectionFrame({
      selection: {
        ...selection,
        element: { left: -100, top: 250, width: 1200, height: 500 },
      },
    });

    expect(frame?.element).toEqual({
      left: 0,
      top: 50,
      width: 100,
      height: 50,
    });
  });

  it("gives the same frame for a Retina-sized capture, since the output is in percentages", () => {
    // A device pixel ratio of 2 doubles every pixel value of the image.
    const retina = {
      viewport: { width: 2000, height: 1000 },
      element: { left: 200, top: 100, width: 400, height: 200 },
      click: { x: 300, y: 150 },
    };

    expect(getSelectionFrame({ selection: retina })).toEqual(
      getSelectionFrame({ selection }),
    );
  });
});
