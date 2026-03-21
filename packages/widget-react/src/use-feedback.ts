import { useCallback } from "react";
import type { FeedbackItem } from "@fasterfixes/core";
import { useFeedbackContext } from "./context.js";

export type UseFeedbackReturn = {
  show: () => void;
  hide: () => void;
  isVisible: boolean;
  startAnnotation: () => void;
  feedbackItems: FeedbackItem[];
  togglePins: () => void;
  showPins: boolean;
};

/**
 * Hook for programmatic control of the feedback widget.
 * Must be used inside a FeedbackProvider.
 */
export function useFeedback(): UseFeedbackReturn {
  const {
    show,
    hide,
    isVisible,
    setMode,
    feedbackItems,
    showPins,
    setShowPins,
  } = useFeedbackContext();

  const startAnnotation = useCallback(() => {
    show();
    setMode("annotating");
  }, [show, setMode]);

  const togglePins = useCallback(() => {
    setShowPins(!showPins);
  }, [setShowPins, showPins]);

  return { show, hide, isVisible, startAnnotation, feedbackItems, togglePins, showPins };
}
