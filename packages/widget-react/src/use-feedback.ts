import { useCallback, useContext, useSyncExternalStore } from "react";
import type { Widget } from "@fasterfixes/widget";
import { WidgetSlotContext } from "./widget-slot.js";

type FeedbackItem = Widget["feedbackItems"][number];

export type UseFeedbackReturn = {
  show: () => void;
  hide: () => void;
  isVisible: boolean;
  startAnnotation: () => void;
  feedbackItems: FeedbackItem[];
  togglePins: () => void;
  showPins: boolean;
};

// What an unmounted Widget reports: server render, first client render, no
// Reviewer token. A stable array, so an unchanged snapshot is never a change.
const NO_FEEDBACK: FeedbackItem[] = [];
const DEFAULT_IS_VISIBLE = false;
const DEFAULT_SHOW_PINS = true;

/**
 * Hook for programmatic control of the feedback widget.
 * Must be used inside a FeedbackProvider.
 */
export function useFeedback(): UseFeedbackReturn {
  const slot = useContext(WidgetSlotContext);
  if (!slot) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }

  const isVisible = useSyncExternalStore(
    slot.subscribe,
    () => slot.instance?.isVisible ?? DEFAULT_IS_VISIBLE,
    () => DEFAULT_IS_VISIBLE,
  );
  const feedbackItems = useSyncExternalStore(
    slot.subscribe,
    // Readonly on the instance; the mutable type keeps the 0.x return shape.
    () =>
      (slot.instance?.feedbackItems as FeedbackItem[] | undefined) ??
      NO_FEEDBACK,
    () => NO_FEEDBACK,
  );
  const showPins = useSyncExternalStore(
    slot.subscribe,
    () => slot.instance?.showPins ?? DEFAULT_SHOW_PINS,
    () => DEFAULT_SHOW_PINS,
  );

  const show = useCallback(() => slot.instance?.show(), [slot]);
  const hide = useCallback(() => slot.instance?.hide(), [slot]);
  const startAnnotation = useCallback(
    () => slot.instance?.startAnnotation(),
    [slot],
  );
  const togglePins = useCallback(() => slot.instance?.togglePins(), [slot]);

  return {
    show,
    hide,
    isVisible,
    startAnnotation,
    feedbackItems,
    togglePins,
    showPins,
  };
}
