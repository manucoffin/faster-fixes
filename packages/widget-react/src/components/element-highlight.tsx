import { useCallback, useEffect, useState } from "react";
import { useFeedbackContext } from "../context.js";
import { overlayHighlightStyle } from "../styles.js";

export function ElementHighlight() {
  const { highlightSelector } = useFeedbackContext();
  const [rect, setRect] = useState<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    if (!highlightSelector) {
      setRect(null);
      return;
    }
    try {
      const el = document.querySelector(highlightSelector);
      if (el) {
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    } catch {
      setRect(null);
    }
  }, [highlightSelector]);

  useEffect(() => {
    updateRect();
    if (!highlightSelector) return;

    window.addEventListener("scroll", updateRect, { passive: true });
    window.addEventListener("resize", updateRect, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateRect);
      window.removeEventListener("resize", updateRect);
    };
  }, [highlightSelector, updateRect]);

  if (!rect) return null;

  return (
    <div
      data-ff-widget
      style={{
        ...overlayHighlightStyle,
        borderColor: "var(--ff-accent)",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    />
  );
}
