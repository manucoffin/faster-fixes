import { useCallback, useEffect, useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from "@floating-ui/react";
import { STATUS_COLORS } from "@fasterfixes/core";
import type { FeedbackStatus } from "@fasterfixes/core";
import { useFeedbackContext } from "../context.js";
import {
  popoverStyle,
  textareaStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  buttonBaseStyle,
} from "../styles.js";

export function PinPopover() {
  const {
    activeFeedback,
    setActiveFeedback,
    client,
    reviewerToken,
    color,
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

  // Reset local state when switching between feedback items
  useEffect(() => {
    setIsEditing(false);
    setEditComment("");
    setIsSaving(false);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
    setError(null);
  }, [activeFeedback?.id]);

  // Anchor popover to the pin element (always visible, regardless of target element state)
  const pinEl = activeFeedback
    ? document.querySelector(`[data-ff-pin-id="${activeFeedback.id}"]`)
    : null;

  const { refs, floatingStyles } = useFloating({
    open: !!activeFeedback,
    elements: {
      reference: pinEl,
    },
    strategy: "fixed",
    whileElementsMounted: pinEl ? autoUpdate : undefined,
    middleware: [offset(12), flip(), shift({ padding: 8 })],
    placement: "bottom",
  });

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

  if (!activeFeedback) return null;

  const statusColor =
    STATUS_COLORS[activeFeedback.status as FeedbackStatus] ?? STATUS_COLORS.new;

  function handleStartEdit() {
    setEditComment(activeFeedback!.comment);
    setIsEditing(true);
    setError(null);
  }

  async function handleSave() {
    if (!editComment.trim()) return;
    setIsSaving(true);
    setError(null);

    try {
      await client.updateFeedback(
        activeFeedback!.id,
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
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      await client.deleteFeedback(activeFeedback!.id, reviewerToken);
      setActiveFeedback(null);
      await refreshFeedback();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.errorMessage);
      setIsDeleting(false);
    }
  }

  function handleClose() {
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setError(null);
    setActiveFeedback(null);
  }

  return (
    <div
      ref={refs.setFloating}
      className={`ff-popover ${classNames.popover ?? ""}`}
      style={{ ...popoverStyle, ...floatingStyles }}
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
            {activeFeedback.reviewer.name}
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

      {isEditing ? (
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
                ...primaryButtonStyle(color),
                opacity: isSaving || !editComment.trim() ? 0.6 : 1,
              }}
              onClick={handleSave}
              disabled={isSaving || !editComment.trim()}
            >
              {isSaving ? "..." : labels.saveButton}
            </button>
          </div>
        </>
      ) : showDeleteConfirm ? (
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
      ) : (
        <>
          <p style={{ margin: "0 0 10px", whiteSpace: "pre-wrap" }}>
            {activeFeedback.comment}
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
