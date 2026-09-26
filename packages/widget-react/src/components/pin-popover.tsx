import { useCallback, useEffect, useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from "@floating-ui/react";
import { useFeedbackContext } from "../context.js";
import { getStatusColor } from "../get-status-color.js";
import {
  popoverStyle,
  textareaStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  buttonBaseStyle,
} from "../styles.js";

const FADEOUT_DURATION = 160;

export function PinPopover() {
  const {
    activeFeedback,
    setActiveFeedback,
    client,
    reviewerToken,
    classNames,
    labels,
    refreshFeedback,
  } = useFeedbackContext();

  const [isEditing, setIsEditing] = useState(false);
  const [editComment, setEditComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedFeedback, setRenderedFeedback] =
    useState<typeof activeFeedback>(activeFeedback);
  // Non-null while fading out; holds the position measured when the popover closed
  const [exit, setExit] = useState<{
    frozenStyle: React.CSSProperties | null;
  } | null>(null);
  const exiting = exit !== null;

  // Reset local state when switching between feedback items
  const [previousFeedbackId, setPreviousFeedbackId] = useState(
    activeFeedback?.id,
  );
  if (activeFeedback?.id !== previousFeedbackId) {
    setPreviousFeedbackId(activeFeedback?.id);
    setIsEditing(false);
    setEditComment("");
    setIsSaving(false);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    setError(null);
  }

  // Opening (or switching) cancels a fade-out in progress
  if (activeFeedback && (activeFeedback !== renderedFeedback || exiting)) {
    setRenderedFeedback(activeFeedback);
    setExit(null);
  }

  // Anchor popover to the pin element (always visible, regardless of target element state)
  const currentFeedback = activeFeedback ?? renderedFeedback;
  const pinEl = activeFeedback
    ? document.querySelector(`[data-ff-pin-id="${activeFeedback.id}"]`)
    : null;

  const {
    refs: { setFloating },
    elements,
    floatingStyles,
  } = useFloating({
    open: !!activeFeedback || exiting,
    elements: {
      reference: pinEl,
    },
    strategy: "fixed",
    whileElementsMounted: pinEl ? autoUpdate : undefined,
    middleware: [offset(12), flip(), shift({ padding: 8 })],
    placement: "bottom",
  });

  useEffect(() => {
    if (activeFeedback || !renderedFeedback) return;

    // Freeze the last position: the fade-out animation overrides Floating UI's transform
    const floatingEl = elements.floating;
    const rect = floatingEl?.getBoundingClientRect();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measures the popover's rect, which only exists in the DOM after the commit that closed it
    setExit({
      frozenStyle: rect
        ? {
            position: "fixed",
            top: rect.top,
            left: rect.left,
            width: rect.width,
          }
        : null,
    });

    const timer = setTimeout(() => {
      setRenderedFeedback(null);
      setExit(null);
    }, FADEOUT_DURATION);
    return () => clearTimeout(timer);
  }, [activeFeedback, renderedFeedback, elements.floating]);

  // Close on outside click
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest("[data-ff-widget]")) return;
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setError(null);
      setActiveFeedback(null);
    },
    [setActiveFeedback],
  );

  useEffect(() => {
    if (!activeFeedback) return;
    document.addEventListener("mousedown", handleOutsideClick, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick, true);
    };
  }, [activeFeedback, handleOutsideClick]);

  if (!currentFeedback) return null;

  const statusColor = getStatusColor(currentFeedback.status);

  const handleStartEdit = () => {
    setEditComment(currentFeedback.comment);
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (!editComment.trim()) return;
    setIsSaving(true);
    setError(null);

    try {
      await client.updateFeedback(
        currentFeedback.id,
        { comment: editComment.trim() },
        reviewerToken,
      );
      setIsEditing(false);
      await refreshFeedback();
      setActiveFeedback(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await client.deleteFeedback(currentFeedback.id, reviewerToken);
      setActiveFeedback(null);
      await refreshFeedback();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errorMessage);
      setIsDeleting(false);
    }
  };

  function handleClose() {
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setError(null);
    setActiveFeedback(null);
  }

  const mode = popoverMode(isEditing, showDeleteConfirm);

  return (
    <div
      ref={setFloating}
      className={`ff-popover ${classNames.popover ?? ""}`}
      style={{
        ...popoverStyle,
        ...(exit?.frozenStyle ?? floatingStyles),
        ...(exiting
          ? {
              animation: `ff-popover-fadeout ${FADEOUT_DURATION}ms ease-in forwards`,
              pointerEvents: "none",
            }
          : undefined),
      }}
      data-ff-widget
    >
      {/* Header with status */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: statusColor,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 12, color: "#71717a" }}>
            {currentFeedback.reviewer.name}
          </span>
        </div>
        <button
          type="button"
          style={{
            ...secondaryButtonStyle,
            padding: "4px 8px",
            fontSize: 16,
            lineHeight: 1,
          }}
          onClick={handleClose}
        >
          &times;
        </button>
      </div>

      {error && (
        <p style={{ margin: "0 0 8px", color: "#dc2626", fontSize: 12 }}>
          {error}
        </p>
      )}

      {mode === "edit" && (
        <>
          <textarea
            className={`ff-textarea ${classNames.textarea ?? ""}`}
            style={textareaStyle}
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            disabled={isSaving}
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
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              {labels.cancelButton}
            </button>
            <button
              type="button"
              style={{
                ...primaryButtonStyle(),
                opacity: isSaving || !editComment.trim() ? 0.6 : 1,
              }}
              onClick={handleSave}
              disabled={isSaving || !editComment.trim()}
            >
              {isSaving ? "..." : labels.saveButton}
            </button>
          </div>
        </>
      )}
      {mode === "confirm-delete" && (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: 13 }}>
            {labels.deleteConfirm}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              {labels.cancelButton}
            </button>
            <button
              type="button"
              style={{
                ...buttonBaseStyle,
                backgroundColor: "#dc2626",
                color: "#fff",
                opacity: isDeleting ? 0.6 : 1,
              }}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "..." : labels.deleteButton}
            </button>
          </div>
        </div>
      )}
      {mode === "view" && (
        <>
          <p style={{ margin: "0 0 10px", whiteSpace: "pre-wrap" }}>
            {currentFeedback.comment}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={secondaryButtonStyle}
              onClick={handleStartEdit}
            >
              {labels.editButton}
            </button>
            <button
              type="button"
              style={{ ...secondaryButtonStyle, color: "#dc2626" }}
              onClick={() => setShowDeleteConfirm(true)}
            >
              {labels.deleteButton}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Editing wins over the delete confirmation, which wins over the read view.
function popoverMode(isEditing: boolean, showDeleteConfirm: boolean) {
  if (isEditing) return "edit";
  if (showDeleteConfirm) return "confirm-delete";
  return "view";
}
