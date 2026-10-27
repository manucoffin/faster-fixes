import { createContext, destroyContext, domToBlob } from "modern-screenshot";
import type { Context } from "modern-screenshot";

export type CaptureViewportScreenshotOptions = {
  // Fallback when the full capture timed out: no font embedding and short fetch
  // timeouts, so slow images become same-size placeholders. Elements are never
  // removed, since that would shift the layout away from the Selection geometry.
  lightweight?: boolean;
};

// The library waits for every image and video to load, bounded by `timeout`.
// Lazy images below the fold and unplayed videos never load on their own, and
// media that is not in by now is not on screen anyway.
const MEDIA_WAIT_TIMEOUT = 3000;
// The same `timeout` bounds each asset fetch while embedding. Aborted font fetches
// blank the whole image, so fetches get more time once the media wait is over.
const FETCH_TIMEOUT = 15000;
// Safari refuses canvases above about 16.7 million pixels and returns nothing
const MAX_CANVAS_PIXELS = 16_000_000;

// A video without a decoded frame cannot be drawn and can hang the capture. Such
// videos are positioned in practice, so leaving them out does not move the layout.
function isUndecodedVideo(el: Element) {
  return (
    el instanceof HTMLVideoElement &&
    el.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
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

// The library creates its own sandbox lazily and writes into its body before the
// srcdoc document has loaded, which throws on Firefox 156 and later. Hand it one
// that is loaded and owned by the Widget, so the capture filter also skips it.
async function createSandbox(): Promise<HTMLIFrameElement> {
  const sandbox = document.createElement("iframe");
  sandbox.setAttribute("data-ff-widget", "");
  sandbox.setAttribute("aria-hidden", "true");
  sandbox.tabIndex = -1;
  sandbox.width = "0";
  sandbox.height = "0";
  sandbox.style.cssText = "position: fixed; visibility: hidden; border: 0;";
  const loaded = new Promise<void>((resolve) => {
    sandbox.addEventListener("load", () => resolve(), { once: true });
  });
  sandbox.srcdoc = '<!DOCTYPE html><meta charset="UTF-8"><title></title><body>';
  document.body.appendChild(sandbox);
  await loaded;
  const sandboxDocument = sandbox.contentDocument;
  // `body` is typed non-null but is null until a body element exists
  if (sandboxDocument && !sandboxDocument.querySelector("body")) {
    sandboxDocument.documentElement.appendChild(
      sandboxDocument.createElement("body"),
    );
  }
  return sandbox;
}

export async function captureViewportScreenshot(
  options: CaptureViewportScreenshotOptions = {},
): Promise<Blob | null> {
  // Read synchronously so the capture matches the page at the moment of the call
  const { scrollX, scrollY, innerWidth, innerHeight } = window;
  const scale = Math.min(
    window.devicePixelRatio || 1,
    Math.sqrt(MAX_CANVAS_PIXELS / Math.max(1, innerWidth * innerHeight)),
  );

  let sandbox: HTMLIFrameElement | undefined;
  let context: Context<HTMLElement> | undefined;
  try {
    sandbox = await createSandbox();
    context = await createContext(document.body, {
      width: innerWidth,
      height: innerHeight,
      scale,
      timeout: MEDIA_WAIT_TIMEOUT,
      // Embedding every format of every @font-face made the image blank on
      // font-heavy sites; one format per face is enough.
      font: options.lightweight ? false : { preferredFormat: "woff2" },
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
        if (isUndecodedVideo(node)) return false;
        return true;
      },
    });
    // createContext has finished the media wait; the timeout now bounds fetches
    if (!options.lightweight) context.timeout = FETCH_TIMEOUT;
    context.sandbox = sandbox;
    return await domToBlob(context);
  } catch (err) {
    console.warn("[faster-fixes] screenshot capture failed:", err);
    return null;
  } finally {
    // destroyContext removes the sandbox too; the explicit remove covers a
    // failure before the context exists.
    if (context) destroyContext(context);
    sandbox?.remove();
  }
}
