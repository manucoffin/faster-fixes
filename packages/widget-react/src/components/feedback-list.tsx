import { useState } from "react";
import { STATUS_COLORS } from "@fasterfixes/core";
import type { FeedbackStatus } from "@fasterfixes/core";
import { useFeedbackContext } from "../context.js";
import {
  feedbackListStyle,
  feedbackListItemStyle,
  secondaryButtonStyle,
} from "../styles.js";

export function FeedbackList() {
  const {
    feedbackItems,
    showResolved,
    setShowResolved,
    setActiveFeedback,
    classNames,
    labels,
    color,
  } = useFeedbackContext();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const visibleItems = showResolved
    ? feedbackItems
    : feedbackItems.filter(
        (f) => f.status !== "resolved" && f.status !== "closed",
      );

  if (isCollapsed) {
    return (
      <button
        type="button"
        data-ff-widget
        style={{
          ...secondaryButtonStyle,
          backgroundColor: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderRadius: 8,
          marginBottom: 8,
          fontSize: 12,
        }}
        onClick={() => setIsCollapsed(false)}
      >
        {labels.feedbackListTitle} ({visibleItems.length})
      </button>
    );
  }

  return (
    <div
      className={`ff-feedback-list ${classNames.feedbackList ?? ""}`}
      style={feedbackListStyle}
      data-ff-widget
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid #e2e8f0",
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
          <button
            type="button"
            style={{
              ...secondaryButtonStyle,
              padding: "2px 6px",
              fontSize: 12,
            }}
            onClick={() => setIsCollapsed(true)}
          >
            &times;
          </button>
        </div>
      </div>

      {/* List */}
      {visibleItems.length === 0 ? (
        <div
          style={{
            padding: "20px 14px",
            textAlign: "center",
            color: "#94a3b8",
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
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
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
