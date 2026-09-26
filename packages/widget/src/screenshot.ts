import { domToBlob } from "modern-screenshot";

export type CaptureViewportScreenshotOptions = {
  // Skip images and videos so the capture finishes fast when the full one timed out
  lightweight?: boolean;
};

function isMediaElement(el: Element) {
  return (
    el instanceof HTMLImageElement ||
    el instanceof HTMLVideoElement ||
    el instanceof HTMLPictureElement
  );
}

// Translating the body clone turns it into the containing block for fixed descendants,
// which would drag them off-screen along with the document. Shift them back so they
// keep their viewport position. Sticky elements are left in flow; their stuck position
// is not recoverable from the clone alone.
function reanchorFixedElements(cloned: Node, scrollX: number, scrollY: number) {
  if (!(cloned instanceof HTMLElement)) return;
  for (const el of cloned.querySelectorAll<HTMLElement>("[style]")) {
    if (el.style.position !== "fixed") continue;
    // Prepend so the offset applies in body coordinates, after the element's own transform
    el.style.transform =
      `translate(${scrollX}px, ${scrollY}px) ${el.style.transform}`.trim();
  }
}

export function captureViewportScreenshot(
  options: CaptureViewportScreenshotOptions = {},
): Promise<Blob | null> {
  const { scrollX, scrollY } = window;

  return domToBlob(document.body, {
    width: window.innerWidth,
    height: window.innerHeight,
    scale: window.devicePixelRatio || 1,
    // restoreScrollPosition only handles scrolled children. Window scroll lives on
    // documentElement, not body, so the root clone must be shifted by hand or every
    // screenshot shows the top of the document.
    style: { transform: `translate(${-scrollX}px, ${-scrollY}px)` },
    features: { restoreScrollPosition: true },
    onCloneNode: (cloned) => reanchorFixedElements(cloned, scrollX, scrollY),
    // Inverted from html2canvas: return true to INCLUDE, false to EXCLUDE
    filter: (node: Node) => {
      if (!(node instanceof Element)) return true;
      if (node.hasAttribute("data-ff-widget")) return false;
      if (options.lightweight && isMediaElement(node)) return false;
      return true;
    },
  }).catch((err) => {
    console.warn("[faster-fixes] screenshot capture failed:", err);
    return null;
  });
}
