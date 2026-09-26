import { describe, expect, it, vi } from "vitest";

import type { FeedbackItem } from "@fasterfixes/core";

import { createDeferredWidget, createInertWidget } from "./instance.js";
import type { Widget } from "./instance.js";

function createFakeWidget(items: FeedbackItem[] = []) {
  let visible = true;
  let pins = true;
  const widget = {
    show: vi.fn(() => {
      visible = true;
    }),
    hide: vi.fn(() => {
      visible = false;
    }),
    get isVisible() {
      return visible;
    },
    startAnnotation: vi.fn(() => {
      visible = true;
    }),
    feedbackItems: items,
    togglePins: vi.fn(() => {
      pins = !pins;
    }),
    get showPins() {
      return pins;
    },
    destroy: vi.fn(() => {
      visible = false;
    }),
  } satisfies Widget;
  return widget;
}

describe("createInertWidget", () => {
  it("is never visible and ignores every call", () => {
    const widget = createInertWidget();
    widget.show();
    widget.destroy();

    expect(widget.isVisible).toBe(false);
  });
});

describe("createDeferredWidget", () => {
  it("is not visible before the Widget mounts", () => {
    expect(createDeferredWidget().widget.isVisible).toBe(false);
  });

  it("reports the mounted Widget's visibility once attached", () => {
    const deferred = createDeferredWidget();
    deferred.attach(createFakeWidget());

    expect(deferred.widget.isVisible).toBe(true);
  });

  it("forwards show and hide after attach", () => {
    const deferred = createDeferredWidget();
    const mounted = createFakeWidget();
    deferred.attach(mounted);

    deferred.widget.hide();
    expect(deferred.widget.isVisible).toBe(false);
    deferred.widget.show();
    expect(deferred.widget.isVisible).toBe(true);
  });

  it("applies a hide requested before the Widget mounted", () => {
    const deferred = createDeferredWidget();
    deferred.widget.hide();
    const mounted = createFakeWidget();
    deferred.attach(mounted);

    expect(mounted.hide).toHaveBeenCalledOnce();
    expect(deferred.widget.isVisible).toBe(false);
  });

  it("starts annotation once the Widget mounts when asked before", () => {
    const deferred = createDeferredWidget();
    deferred.widget.startAnnotation();
    const mounted = createFakeWidget();
    deferred.attach(mounted);

    expect(mounted.startAnnotation).toHaveBeenCalledOnce();
  });

  it("drops a pending annotation request when hidden before mount", () => {
    const deferred = createDeferredWidget();
    deferred.widget.startAnnotation();
    deferred.widget.hide();
    const mounted = createFakeWidget();
    deferred.attach(mounted);

    expect(mounted.startAnnotation).not.toHaveBeenCalled();
  });

  it("has no Feedback items and shows pins before the Widget mounts", () => {
    const { widget } = createDeferredWidget();

    expect(widget.feedbackItems).toEqual([]);
    expect(widget.showPins).toBe(true);
  });

  it("reads the mounted Widget's Feedback items", () => {
    const items = [{ id: "fb_1" } as FeedbackItem];
    const deferred = createDeferredWidget();
    deferred.attach(createFakeWidget(items));

    expect(deferred.widget.feedbackItems).toBe(items);
  });

  it("applies a pins toggle requested before the Widget mounted", () => {
    const deferred = createDeferredWidget();
    deferred.widget.togglePins();
    expect(deferred.widget.showPins).toBe(false);

    const mounted = createFakeWidget();
    deferred.attach(mounted);

    expect(mounted.togglePins).toHaveBeenCalledOnce();
    expect(deferred.widget.showPins).toBe(false);
  });

  it("forwards togglePins after attach", () => {
    const deferred = createDeferredWidget();
    deferred.attach(createFakeWidget());

    deferred.widget.togglePins();
    expect(deferred.widget.showPins).toBe(false);
    deferred.widget.togglePins();
    expect(deferred.widget.showPins).toBe(true);
  });

  it("destroys the mounted Widget and ignores later calls", () => {
    const deferred = createDeferredWidget();
    const mounted = createFakeWidget();
    deferred.attach(mounted);

    deferred.widget.destroy();
    deferred.widget.show();
    deferred.widget.destroy();

    expect(mounted.destroy).toHaveBeenCalledOnce();
    expect(mounted.show).not.toHaveBeenCalled();
    expect(deferred.destroyed).toBe(true);
    expect(deferred.widget.isVisible).toBe(false);
  });

  it("destroys a Widget attached after destroy, so nothing stays mounted", () => {
    const deferred = createDeferredWidget();
    deferred.widget.destroy();
    const late = createFakeWidget();
    deferred.attach(late);

    expect(late.destroy).toHaveBeenCalledOnce();
    expect(deferred.widget.isVisible).toBe(false);
  });

  it("keeps the first Widget when attached twice", () => {
    const deferred = createDeferredWidget();
    const first = createFakeWidget();
    const second = createFakeWidget();
    deferred.attach(first);
    deferred.attach(second);

    expect(second.destroy).toHaveBeenCalledOnce();
    deferred.widget.destroy();
    expect(first.destroy).toHaveBeenCalledOnce();
  });
});
