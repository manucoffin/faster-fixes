import { useCallback, useEffect, useState } from "react";
import { STATUS_COLORS, resolveElement } from "@fasterfixes/core";
import type { FeedbackItem, FeedbackStatus, SelectorStrategies } from "@fasterfixes/core";
import { useFeedbackContext } from "../context.js";
import { pinStyle } from "../styles.js";

type FeedbackPinProps = {
  item: FeedbackItem;
};

type PinAnchor = {
  x: number;
  y: number;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPinAnchor(metadata: FeedbackItem["metadata"]): PinAnchor | null {
  const pinAnchor = (metadata as Record<string, unknown> | null)?.pinAnchor;
  if (!pinAnchor || typeof pinAnchor !== "object") {
    return null;
  }

  const x = (pinAnchor as Record<string, unknown>).x;
  const y = (pinAnchor as Record<string, unknown>).y;

  if (typeof x !== "number" || typeof y !== "number") {
    return null;
  }

  return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
}

export function FeedbackPin({ item }: FeedbackPinProps) {
  const { classNames, setActiveFeedback, activeFeedback, setHighlightSelector } =
    useFeedbackContext();
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const PIN_SIZE = 24;

  const updatePosition = useCallback(() => {
    const metadata = item.metadata as Record<string, unknown> | null;
    const strategies = metadata?.selectors as SelectorStrategies | undefined;
    const pinAnchor = getPinAnchor(item.metadata);
    const hasSelector = !!(item.selector || strategies);
    const el = hasSelector ? resolveElement(item.selector, strategies) : null;

    if (el) {
      const rect = el.getBoundingClientRect();

      // Hide pin if the element is not visible (e.g. inside a closed dialog)
      if (rect.width === 0 && rect.height === 0) {
        setPosition(null);
        return;
      }

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const anchorX = pinAnchor ? rect.left + rect.width * pinAnchor.x : rect.right;
      const anchorY = pinAnchor ? rect.top + rect.height * pinAnchor.y : rect.top;

      // Horizontal: prefer the click side for newer pins, otherwise use the element edge.
      let left = anchorX + 4;
      if (left + PIN_SIZE > vw) {
        left = anchorX - PIN_SIZE - 4;
      }
      left = clamp(left, 0, vw - PIN_SIZE);

      let top = pinAnchor ? anchorY - PIN_SIZE / 2 : rect.top;
      if (!pinAnchor && top + PIN_SIZE > vh) {
        top = rect.bottom - PIN_SIZE;
      }
      top = clamp(top, 0, vh - PIN_SIZE);

      setPosition({ top, left });
      return;
    }

    // Element not found. Only hide if this is a new pin with strategies
    // (it was on a dialog/transient element). Old pins without strategies
    // fall back to stored coordinates to preserve backward compat.
    if (hasSelector && strategies) {
      setPosition(null);
      return;
    }

    // Fall back to stored coordinates
    if (item.clickX != null && item.clickY != null) {
      setPosition({
        top: item.clickY,
        left: item.clickX,
      });
    }
  }, [item.selector, item.clickX, item.clickY, item.metadata]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition, { passive: true });
    window.addEventListener("load", updatePosition);

    // Staggered retries to handle hydration and lazy rendering.
    // React hydration timing is non-deterministic — a single 500ms retry
    // isn't always enough for the DOM to stabilize.
    const raf = requestAnimationFrame(updatePosition);
    const retryTimers = [100, 300, 600, 1200, 2500].map((delay) =>
      setTimeout(updatePosition, delay),
    );

    // Watch for direct children of body changing (dialog portals opening/closing)
    const observer = new MutationObserver(updatePosition);
    observer.observe(document.body, { childList: true });

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("load", updatePosition);
      cancelAnimationFrame(raf);
      retryTimers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, [updatePosition]);

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
      data-ff-pin-id={item.id}
      onMouseEnter={() => {
        if (item.selector) setHighlightSelector(item.selector);
      }}
      onMouseLeave={() => {
        // Only clear if this pin's selector is the one highlighted (not the active feedback's)
        if (!activeFeedback || activeFeedback.id !== item.id) {
          setHighlightSelector(activeFeedback?.selector ?? null);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        const next = isActive ? null : item;
        setActiveFeedback(next);
        setHighlightSelector(next?.selector ?? null);
      }}
      aria-label={`Feedback: ${item.comment.slice(0, 50)}`}
    >
      <PinIcon />
    </button>
  );
}
