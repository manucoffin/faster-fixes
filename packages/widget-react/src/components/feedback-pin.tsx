import { useEffect, useState } from "react";
import { STATUS_COLORS } from "@fasterfixes/core";
import type { FeedbackItem, FeedbackStatus } from "@fasterfixes/core";
import { useFeedbackContext } from "../context.js";
import { pinStyle } from "../styles.js";

type FeedbackPinProps = {
  item: FeedbackItem;
};

const PinIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export function FeedbackPin({ item }: FeedbackPinProps) {
  const { classNames, setActiveFeedback, activeFeedback } =
    useFeedbackContext();
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    // Try CSS selector first
    if (item.selector) {
      try {
        const el = document.querySelector(item.selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          setPosition({
            top: rect.top + window.scrollY,
            left: rect.right + window.scrollX + 4,
          });
          return;
        }
      } catch {
        // Selector failed — fall through to coords
      }
    }

    // Fallback to absolute coordinates
    if (item.clickX != null && item.clickY != null) {
      setPosition({
        top: item.clickY + window.scrollY,
        left: item.clickX + window.scrollX,
      });
    }
  }, [item.selector, item.clickX, item.clickY]);

  if (!position) return null;

  const isActive = activeFeedback?.id === item.id;
  const statusColor = STATUS_COLORS[item.status as FeedbackStatus] ?? STATUS_COLORS.new;

  return (
    <button
      type="button"
      className={`ff-pin ${classNames.pin ?? ""}`}
      style={{
        ...pinStyle(statusColor),
        top: position.top,
        left: position.left,
        transform: isActive ? "scale(1.2)" : "scale(1)",
      }}
      data-ff-widget
      onClick={(e) => {
        e.stopPropagation();
        setActiveFeedback(isActive ? null : item);
      }}
      aria-label={`Feedback: ${item.comment.slice(0, 50)}`}
    >
      <PinIcon />
    </button>
  );
}
