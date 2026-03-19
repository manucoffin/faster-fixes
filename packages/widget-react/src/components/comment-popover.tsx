import { useRef, useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from "@floating-ui/react";
import { generateSelector, getBrowserInfo } from "@fasterfixes/core";
import { useFeedbackContext } from "../context.js";
import {
  popoverStyle,
  textareaStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../styles.js";

export function CommentPopover() {
  const {
    mode,
    setMode,
    client,
    reviewerToken,
    color,
    classNames,
    labels,
    selectedElement,
    clickCoords,
    screenshotBlob,
    setSelectedElement,
    setClickCoords,
    setScreenshotBlob,
    refreshFeedback,
  } = useFeedbackContext();

  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { refs, floatingStyles } = useFloating({
    open: mode === "selected" || mode === "submitting" || mode === "success" || mode === "error",
    elements: {
      reference: selectedElement,
    },
    whileElementsMounted: autoUpdate,
    middleware: [offset(12), flip(), shift({ padding: 8 })],
    placement: "bottom",
  });

  function handleCancel() {
    setComment("");
    setError(null);
    setSelectedElement(null);
    setClickCoords(null);
    setScreenshotBlob(null);
    setMode("idle");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      handleCancel();
    }
  }

  async function handleSubmit() {
    if (!comment.trim()) return;

    setMode("submitting");
    setError(null);

    const browserInfo = getBrowserInfo();
    const selector = selectedElement ? generateSelector(selectedElement) : undefined;

    try {
      await client.createFeedback(
        {
          comment: comment.trim(),
          pageUrl: window.location.href,
          selector,
          clickX: clickCoords?.x,
          clickY: clickCoords?.y,
          ...browserInfo,
        },
        reviewerToken,
        screenshotBlob ?? undefined,
      );

      setComment("");
      setMode("success");
      await refreshFeedback();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : labels.errorMessage,
      );
      setMode("error");
    }
  }

  function handleCloseSuccess() {
    setSelectedElement(null);
    setClickCoords(null);
    setScreenshotBlob(null);
    setMode("idle");
  }

  function handleRetry() {
    setMode("selected");
    void handleSubmit();
  }

  if (
    mode !== "selected" &&
    mode !== "submitting" &&
    mode !== "success" &&
    mode !== "error"
  ) {
    return null;
  }

  return (
    <div
      ref={refs.setFloating}
      className={`ff-popover ${classNames.popover ?? ""}`}
      style={{ ...popoverStyle, ...floatingStyles }}
      data-ff-widget
      onKeyDown={handleKeyDown}
    >
      {mode === "success" ? (
        <div className={`ff-success ${classNames.successState ?? ""}`}>
          <p style={{ margin: "0 0 12px", color: "#16a34a", fontWeight: 500 }}>
            {labels.successMessage}
          </p>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={handleCloseSuccess}
          >
            {labels.closeButton}
          </button>
        </div>
      ) : mode === "error" ? (
        <div className={`ff-error ${classNames.errorState ?? ""}`}>
          <p style={{ margin: "0 0 8px", color: "#dc2626", fontSize: 13 }}>
            {error ?? labels.errorMessage}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={primaryButtonStyle(color)}
              onClick={handleRetry}
            >
              {labels.retryButton}
            </button>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handleCancel}
            >
              {labels.cancelButton}
            </button>
          </div>
        </div>
      ) : (
        <>
          <textarea
            ref={textareaRef}
            className={`ff-textarea ${classNames.textarea ?? ""}`}
            style={textareaStyle}
            placeholder={labels.textareaPlaceholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={mode === "submitting"}
            autoFocus
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handleCancel}
              disabled={mode === "submitting"}
            >
              {labels.cancelButton}
            </button>
            <button
              type="button"
              style={{
                ...primaryButtonStyle(color),
                opacity: mode === "submitting" || !comment.trim() ? 0.6 : 1,
              }}
              onClick={handleSubmit}
              disabled={mode === "submitting" || !comment.trim()}
            >
              {mode === "submitting" ? "..." : labels.submitButton}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
