import { describe, expect, it, vi } from "vitest";

import type { FeedbackItem } from "@fasterfixes/core";

import { createWidgetState } from "./state.js";

function setup() {
  const items: FeedbackItem[] = [];
  const state = createWidgetState({
    isVisible: true,
    feedbackItems: items,
    showPins: true,
  });
  const listener = vi.fn();
  const unsubscribe = state.subscribe(listener);
  return { state, items, listener, unsubscribe };
}

describe("createWidgetState", () => {
  it("notifies when visibility changes", () => {
    const { state, listener } = setup();
    state.set({ isVisible: false });

    expect(listener).toHaveBeenCalledOnce();
    expect(state.current.isVisible).toBe(false);
  });

  it("notifies when pins are toggled", () => {
    const { state, listener } = setup();
    state.set({ showPins: false });

    expect(listener).toHaveBeenCalledOnce();
  });

  it("notifies when the Feedback list is replaced", () => {
    const { state, listener } = setup();
    const next = [{ id: "fb_1" } as FeedbackItem];
    state.set({ feedbackItems: next });

    expect(listener).toHaveBeenCalledOnce();
    expect(state.current.feedbackItems).toBe(next);
  });

  it("stays silent when a value is set to what it already was", () => {
    const { state, items, listener } = setup();
    state.set({ isVisible: true, showPins: true, feedbackItems: items });
    state.set({});

    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps the same snapshot until a value changes", () => {
    const { state } = setup();
    const before = state.current;
    state.set({ isVisible: true });

    expect(state.current).toBe(before);
  });

  it("stops calling a listener once unsubscribed", () => {
    const { state, listener, unsubscribe } = setup();
    unsubscribe();
    state.set({ isVisible: false });

    expect(listener).not.toHaveBeenCalled();
  });

  it("drops every listener on clear", () => {
    const { state, listener } = setup();
    const other = vi.fn();
    state.subscribe(other);
    state.clear();
    state.set({ showPins: false });

    expect(listener).not.toHaveBeenCalled();
    expect(other).not.toHaveBeenCalled();
  });

  it("lets a listener unsubscribe while being notified", () => {
    const { state } = setup();
    const second = vi.fn();
    const unsubscribeFirst = state.subscribe(() => unsubscribeFirst());
    state.subscribe(second);
    state.set({ isVisible: false });
    state.set({ isVisible: true });

    expect(second).toHaveBeenCalledTimes(2);
  });
});
