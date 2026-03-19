import type { WidgetPosition } from "@fasterfixes/core";

// Inline styles — no external CSS dependency required.
// The `ff-` class names are applied for host-level overrides via classNames prop.

export const POSITION_STYLES: Record<WidgetPosition, React.CSSProperties> = {
  "bottom-right": { bottom: 20, right: 20 },
  "bottom-left": { bottom: 20, left: 20 },
  "top-right": { top: 20, right: 20 },
  "top-left": { top: 20, left: 20 },
};

export const floatingButtonStyle = (
  color: string,
): React.CSSProperties => ({
  width: 48,
  height: 48,
  borderRadius: "50%",
  backgroundColor: color,
  color: "#fff",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  zIndex: 2147483647,
  position: "relative",
  transition: "transform 0.15s ease",
});

export const popoverStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 8,
  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  padding: 16,
  width: 320,
  zIndex: 2147483647,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 14,
  color: "#1a1a1a",
};

export const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 80,
  padding: 8,
  border: "1px solid #e2e8f0",
  borderRadius: 6,
  resize: "vertical",
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

export const buttonBaseStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  border: "none",
  transition: "opacity 0.15s ease",
};

export const primaryButtonStyle = (color: string): React.CSSProperties => ({
  ...buttonBaseStyle,
  backgroundColor: color,
  color: "#fff",
});

export const secondaryButtonStyle: React.CSSProperties = {
  ...buttonBaseStyle,
  backgroundColor: "transparent",
  color: "#64748b",
};

export const pinStyle = (statusColor: string): React.CSSProperties => ({
  width: 24,
  height: 24,
  borderRadius: "50%",
  backgroundColor: statusColor,
  border: "2px solid #fff",
  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "absolute",
  zIndex: 2147483646,
  transition: "transform 0.15s ease",
});

export const overlayHighlightStyle: React.CSSProperties = {
  position: "fixed",
  pointerEvents: "none",
  border: "2px solid",
  backgroundColor: "rgba(99, 102, 241, 0.1)",
  zIndex: 2147483645,
  transition: "all 0.1s ease",
};

export const feedbackListStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 8,
  boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
  maxHeight: 320,
  overflowY: "auto",
  width: 320,
  marginBottom: 8,
  zIndex: 2147483647,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 13,
};

export const feedbackListItemStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid #f1f5f9",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  transition: "background-color 0.1s ease",
};
