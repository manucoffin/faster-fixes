import { useCallback, useEffect, useState } from "react";
import { generateSelector } from "@fasterfixes/core";
const html2canvasModule = await import("html2canvas");
const captureScreenshot = (
  html2canvasModule as unknown as { default: (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement> }
).default;
import { useFeedbackContext } from "../context.js";
import { overlayHighlightStyle } from "../styles.js";

export function AnnotationOverlay() {
  const {
    mode,
    setMode,
    color,
    classNames,
    setSelectedElement,
    setClickCoords,
    setScreenshotBlob,
  } = useFeedbackContext();

  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      // Ignore widget elements
      const target = e.target as Element;
      if (target.closest("[data-ff-widget]")) {
        setHighlightRect(null);
        return;
      }
      setHighlightRect(target.getBoundingClientRect());
    },
    [],
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as Element;
      if (target.closest("[data-ff-widget]")) return;

      setSelectedElement(target);
      setClickCoords({ x: e.clientX, y: e.clientY });

      // Generate selector
      generateSelector(target);

      // Capture screenshot asynchronously
      captureScreenshot(document.body, {
        useCORS: true,
        allowTaint: true,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        width: window.innerWidth,
        height: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
      })
        .then((canvas) => {
          canvas.toBlob((blob) => {
            if (blob) setScreenshotBlob(blob);
          }, "image/png");
        })
        .catch(() => {
          // Screenshot failed — continue without it
        });

      setMode("selected");
    },
    [setMode, setSelectedElement, setClickCoords, setScreenshotBlob],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMode("idle");
      }
    },
    [setMode],
  );

  useEffect(() => {
    if (mode !== "annotating") return;

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    // Set crosshair cursor
    document.body.style.cursor = "crosshair";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.cursor = "";
    };
  }, [mode, handleMouseMove, handleClick, handleKeyDown]);

  if (mode !== "annotating" || !highlightRect) return null;

  return (
    <div
      className={`ff-overlay ${classNames.overlay ?? ""}`}
      data-ff-widget
      style={{
        ...overlayHighlightStyle,
        borderColor: color,
        top: highlightRect.top,
        left: highlightRect.left,
        width: highlightRect.width,
        height: highlightRect.height,
      }}
    />
  );
}
