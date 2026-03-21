import { useEffect, useRef, useState } from "react";
import { STATUS_COLORS } from "@fasterfixes/core";
import type { FeedbackStatus } from "@fasterfixes/core";
import { useFeedbackContext } from "../context.js";
import {
  feedbackListStyle,
  feedbackListItemStyle,
  secondaryButtonStyle,
} from "../styles.js";

const EXIT_DURATION = 150;

export function FeedbackList() {
  const {
    feedbackItems,
    showResolved,
    setShowResolved,
    setActiveFeedback,
    classNames,
    labels,
    color,
    position,
    showList,
  } = useFeedbackContext();

  // Delayed unmount: stay mounted during exit animation
  const [mounted, setMounted] = useState(showList);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (showList) {
      clearTimeout(timerRef.current);
      setExiting(false);
      setMounted(true);
    } else if (mounted) {
      setExiting(true);
      timerRef.current = setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, EXIT_DURATION);
    }
    return () => clearTimeout(timerRef.current);
  }, [showList, mounted]);

  if (!mounted) return null;

  const enterAnimation = position.includes("right")
    ? "ff-list-slide-left 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
    : "ff-list-slide-right 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)";

  const exitAnimation = position.includes("right")
    ? `ff-list-exit-left ${EXIT_DURATION}ms ease-in forwards`
    : `ff-list-exit-right ${EXIT_DURATION}ms ease-in forwards`;

  const animation = exiting ? exitAnimation : enterAnimation;

  const visibleItems = showResolved
    ? feedbackItems
    : feedbackItems.filter(
        (f) => f.status !== "resolved" && f.status !== "closed",
      );

  return (
    <div
      className={`ff-feedback-list ${classNames.feedbackList ?? ""}`}
      style={{ ...feedbackListStyle, animation }}
      data-ff-widget
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid #3f3f46",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          {labels.feedbackListTitle}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            style={{
              ...secondaryButtonStyle,
              padding: "2px 8px",
              fontSize: 11,
              color: color,
            }}
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? labels.hideResolved : labels.showResolved}
          </button>
        </div>
      </div>

      {/* List */}
      {visibleItems.length === 0 ? (
        <div
          style={{
            padding: "20px 14px",
            textAlign: "center",
            color: "#71717a",
            fontSize: 13,
          }}
        >
          {labels.emptyList}
        </div>
      ) : (
        visibleItems.map((item) => {
          const statusColor =
            STATUS_COLORS[item.status as FeedbackStatus] ?? STATUS_COLORS.new;

          return (
            <div
              key={item.id}
              className={`ff-feedback-list-item ${classNames.feedbackListItem ?? ""}`}
              style={feedbackListItemStyle}
              onClick={() => {
                // If feedback is on the current page, scroll to element and open pin
                if (item.pageUrl === window.location.href) {
                  if (item.selector) {
                    try {
                      const el = document.querySelector(item.selector);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    } catch {
                      // Selector failed
                    }
                  }
                  setActiveFeedback(item);
                } else if (
                  item.pageUrl.startsWith("https://") ||
                  item.pageUrl.startsWith("http://")
                ) {
                  window.location.href = item.pageUrl;
                }
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: statusColor,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.comment}
                </p>
                <span style={{ fontSize: 11, color: "#71717a" }}>
                  {item.reviewer.name}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
