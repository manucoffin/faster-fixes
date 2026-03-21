import { useCallback, useEffect, useState } from "react";
import html2canvas from "html2canvas-pro";
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
    screenshotCaptureRef,
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
      const target = e.target as Element;
      if (target.closest("[data-ff-widget]")) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      setSelectedElement(target);
      setClickCoords({ x: e.clientX, y: e.clientY });

      // Capture screenshot asynchronously, store promise for submit to await
      const capturePromise = html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        width: window.innerWidth,
        height: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
        // Strip widget elements and ignore CSS parsing errors
        ignoreElements: (el) => el.hasAttribute?.("data-ff-widget") ?? false,
        onclone: (_doc, clonedEl) => {
          // Remove style elements that may contain unsupported CSS (e.g. CSS layers, custom properties)
          clonedEl.querySelectorAll("style").forEach((style) => {
            try {
              // If the style sheet has rules that can't be accessed, remove it
              if (style.sheet) {
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                style.sheet.cssRules;
              }
            } catch {
              style.remove();
            }
          });
        },
      })
        .then(
          (canvas) =>
            new Promise<Blob | null>((resolve) => {
              canvas.toBlob((blob) => resolve(blob), "image/png");
            }),
        )
        .catch((err) => {
          console.warn("[faster-fixes] screenshot capture failed:", err);
          return null;
        });

      screenshotCaptureRef.current = capturePromise;

      capturePromise.then((blob) => {
        if (blob) setScreenshotBlob(blob);
      });

      setMode("selected");
    },
    [setMode, setSelectedElement, setClickCoords, setScreenshotBlob, screenshotCaptureRef],
  );

  // Suppress pointer-down/mousedown so dialogs/drawers don't close
  const suppressEvent = useCallback((e: Event) => {
    const target = e.target as Element;
    if (target.closest("[data-ff-widget]")) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }, []);

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
    document.addEventListener("mousedown", suppressEvent, true);
    document.addEventListener("pointerdown", suppressEvent, true);
    document.addEventListener("keydown", handleKeyDown, true);

    // Set crosshair cursor
    document.body.style.cursor = "crosshair";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("mousedown", suppressEvent, true);
      document.removeEventListener("pointerdown", suppressEvent, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.cursor = "";
    };
  }, [mode, handleMouseMove, handleClick, suppressEvent, handleKeyDown]);

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
