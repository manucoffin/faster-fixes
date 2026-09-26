import { createContext } from "react";
import type { Widget } from "@fasterfixes/widget";

/**
 * Holds the instance the provider mounted, if any. `subscribe` fires when the
 * instance is swapped and when the current instance reports a state change,
 * so `useFeedback` reads one external store across re-initialisations.
 */
export type WidgetSlot = {
  readonly instance: Widget | null;
  set: (widget: Widget | null) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createWidgetSlot(): WidgetSlot {
  let current: Widget | null = null;
  let unsubscribeCurrent: (() => void) | null = null;
  const listeners = new Set<() => void>();

  const notify = () => {
    // Copied so a listener that unsubscribes mid-notify is safe.
    [...listeners].forEach((listener) => listener());
  };

  return {
    get instance() {
      return current;
    },
    set(widget) {
      unsubscribeCurrent?.();
      unsubscribeCurrent = widget ? widget.subscribe(notify) : null;
      current = widget;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const WidgetSlotContext = createContext<WidgetSlot | null>(null);
