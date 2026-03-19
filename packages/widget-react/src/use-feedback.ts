import { useFeedbackContext } from "./context.js";

/**
 * Hook for programmatic control of the feedback widget.
 * Must be used inside a FeedbackProvider.
 */
export function useFeedback() {
  const { show, hide, isVisible } = useFeedbackContext();
  return { show, hide, isVisible };
}
