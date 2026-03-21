import type { WidgetPosition } from "@fasterfixes/core";

const Z_WIDGET = 2147483647;
const Z_PIN = 2147483646;
const Z_HIGHLIGHT = 2147483645;
const SHADOW_SM = "0 2px 8px rgba(0,0,0,0.2)";
const SHADOW_LG = "0 4px 16px rgba(0,0,0,0.4)";
const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const POSITION_STYLES: Record<WidgetPosition, React.CSSProperties> = {
  "bottom-right": { bottom: 20, right: 20 },
  "bottom-left": { bottom: 20, left: 20 },
  "top-right": { top: 20, right: 20 },
  "top-left": { top: 20, left: 20 },
  "middle-right": { top: "50%", right: 20, transform: "translateY(-50%)" },
  "middle-left": { top: "50%", left: 20, transform: "translateY(-50%)" },
};

export const triggerButtonStyle = (
  color: string,
): React.CSSProperties => ({
  width: 40,
  height: 40,
  borderRadius: "50%",
  backgroundColor: color,
  color: "#fff",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: SHADOW_SM,
  position: "relative",
  transition: "transform 0.15s ease, background-color 0.15s ease",
  flexShrink: 0,
});

export const toolbarStyle = (color: string): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  backgroundColor: color,
  borderRadius: 24,
  padding: 4,
  width: 40,
  boxShadow: SHADOW_SM,
  overflow: "hidden",
});

export const toolbarButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: "50%",
  backgroundColor: "rgba(255,255,255,0.15)",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  transition: "background-color 0.15s ease",
};

export const popoverStyle: React.CSSProperties = {
  backgroundColor: "#1c1c1c",
  borderRadius: 8,
  boxShadow: SHADOW_LG,
  padding: 16,
  width: 320,
  zIndex: Z_WIDGET,
  fontFamily: FONT_STACK,
  fontSize: 14,
  color: "#e4e4e7",
  pointerEvents: "auto",
};

export const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 80,
  padding: 8,
  border: "1px solid #3f3f46",
  borderRadius: 6,
  resize: "vertical",
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  backgroundColor: "#27272a",
  color: "#e4e4e7",
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
  color: "#a1a1aa",
};

export const pinStyle = (statusColor: string): React.CSSProperties => ({
  width: 24,
  height: 24,
  borderRadius: "50%",
  backgroundColor: statusColor,
  border: "2px solid #27272a",
  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "fixed",
  zIndex: Z_PIN,
  transition: "transform 0.15s ease",
  pointerEvents: "auto",
});

export const overlayHighlightStyle: React.CSSProperties = {
  position: "fixed",
  pointerEvents: "none",
  border: "2px solid",
  borderRadius: 4,
  backgroundColor: "rgba(99, 102, 241, 0.1)",
  zIndex: Z_HIGHLIGHT,
  transition: "all 0.1s ease",
};

export const feedbackListStyle: React.CSSProperties = {
  backgroundColor: "#1c1c1c",
  borderRadius: 8,
  boxShadow: SHADOW_LG,
  maxHeight: 320,
  overflowY: "auto",
  width: 320,
  zIndex: Z_WIDGET,
  fontFamily: FONT_STACK,
  fontSize: 13,
  color: "#e4e4e7",
  pointerEvents: "auto",
};

export const feedbackListItemStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid #3f3f46",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  transition: "background-color 0.1s ease",
};
