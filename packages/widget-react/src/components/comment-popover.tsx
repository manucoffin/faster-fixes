import { useEffect, useRef, useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from "@floating-ui/react";
import { generateSelectors, captureElementContext, getBrowserInfo } from "@fasterfixes/core";
import { useFeedbackContext } from "../context.js";
import {
  popoverStyle,
  textareaStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../styles.js";
import { clamp } from "../utils.js";

const FADEOUT_DURATION = 200;

export function CommentPopover() {
  const {
    mode,
    setMode,
    client,
    reviewerToken,
    classNames,
    labels,
    selectedElement,
    clickCoords,
    screenshotBlob,
    screenshotCaptureRef,
    setSelectedElement,
    setClickCoords,
    setScreenshotBlob,
    refreshFeedback,
  } = useFeedbackContext();

  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frozenStyleRef = useRef<React.CSSProperties | null>(null);

  const isOpen = mode === "selected" || mode === "submitting" || mode === "error";

  const { refs, floatingStyles } = useFloating({
    open: isOpen || fadingOut,
    elements: {
      reference: selectedElement,
    },
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [offset(12), flip(), shift({ padding: 8 })],
    placement: "bottom",
  });

  // Clean up timer on unmount
  useEffect(() => () => {
    if (fadeTimerRef.current !== null) clearTimeout(fadeTimerRef.current);
  }, []);

  function resetState() {
    setComment("");
    setError(null);
    setFadingOut(false);
    frozenStyleRef.current = null;
    setSelectedElement(null);
    setClickCoords(null);
    setScreenshotBlob(null);
    setMode("idle");
  }

  function handleCancel() {
    resetState();
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

    let selector: string | undefined;
    let metadata: Record<string, unknown> | undefined;
    if (selectedElement) {
      const result = generateSelectors(selectedElement);
      selector = result.best;
      const context = captureElementContext(selectedElement, result.strategies);
      metadata = { ...context };

      if (clickCoords) {
        const rect = selectedElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          metadata.pinAnchor = {
            x: clamp((clickCoords.x - rect.left) / rect.width, 0, 1),
            y: clamp((clickCoords.y - rect.top) / rect.height, 0, 1),
          };
        }
      }
    }

    let screenshot = screenshotBlob;
    if (!screenshot && screenshotCaptureRef.current) {
      screenshot = await screenshotCaptureRef.current;
    }

    try {
      await client.createFeedback(
        {
          comment: comment.trim(),
          pageUrl: window.location.href,
          selector,
          clickX: clickCoords?.x,
          clickY: clickCoords?.y,
          metadata,
          ...browserInfo,
        },
        reviewerToken,
        screenshot ?? undefined,
      );

      void refreshFeedback();

      // Freeze the current position before fading so Floating UI recalc can't move it
      const floatingEl = refs.floating.current;
      if (floatingEl) {
        const rect = floatingEl.getBoundingClientRect();
        frozenStyleRef.current = {
          position: "fixed",
          top: rect.top,
          left: rect.left,
          width: rect.width,
        };
      }

      setComment("");

      // Fade out then close
      setFadingOut(true);
      fadeTimerRef.current = setTimeout(resetState, FADEOUT_DURATION);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : labels.errorMessage,
      );
      setMode("error");
    }
  }

  function handleRetry() {
    setMode("selected");
    void handleSubmit();
  }

  if (!isOpen && !fadingOut) {
    return null;
  }

  return (
    <div
      ref={refs.setFloating}
      className={`ff-popover ${classNames.popover ?? ""}`}
      style={{
        ...popoverStyle,
        ...(fadingOut && frozenStyleRef.current
          ? frozenStyleRef.current
          : floatingStyles),
        ...(fadingOut
          ? { animation: `ff-popover-fadeout ${FADEOUT_DURATION}ms ease-in forwards` }
          : undefined),
      }}
      data-ff-widget
      onKeyDown={handleKeyDown}
    >
      {mode === "error" && !fadingOut ? (
        <div className={`ff-error ${classNames.errorState ?? ""}`}>
          <p style={{ margin: "0 0 8px", color: "#dc2626", fontSize: 13 }}>
            {error ?? labels.errorMessage}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={primaryButtonStyle()}
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
            disabled={mode === "submitting" || fadingOut}
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
              disabled={mode === "submitting" || fadingOut}
            >
              {labels.cancelButton}
            </button>
            <button
              type="button"
              style={{
                ...primaryButtonStyle(),
                opacity: mode === "submitting" || !comment.trim() || fadingOut ? 0.6 : 1,
              }}
              onClick={handleSubmit}
              disabled={mode === "submitting" || !comment.trim() || fadingOut}
            >
              {mode === "submitting" ? "..." : labels.submitButton}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
