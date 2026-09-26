import type { FeedbackItem } from "@fasterfixes/core";

export type WidgetState = {
  isVisible: boolean;
  feedbackItems: readonly FeedbackItem[];
  showPins: boolean;
};

const STATE_KEYS = ["isVisible", "feedbackItems", "showPins"] as const;

export function isSameState(a: WidgetState, b: WidgetState): boolean {
  return STATE_KEYS.every((key) => Object.is(a[key], b[key]));
}

export function createListeners() {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify() {
      // Copied so a listener that unsubscribes or subscribes mid-notify is safe.
      [...listeners].forEach((listener) => listener());
    },
    clear() {
      listeners.clear();
    },
  };
}

/** Holds the Widget state and notifies subscribers only when a value changes. */
export function createWidgetState(initial: WidgetState) {
  let current = initial;
  const listeners = createListeners();
  return {
    get current(): WidgetState {
      return current;
    },
    set(patch: Partial<WidgetState>) {
      const next = { ...current, ...patch };
      if (isSameState(current, next)) return;
      current = next;
      listeners.notify();
    },
    subscribe: listeners.subscribe,
    clear: listeners.clear,
  };
}
