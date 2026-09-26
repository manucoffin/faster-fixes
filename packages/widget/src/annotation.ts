import type { PinPoint } from "./pin-placement.js";

type AnnotationActions = {
  onSelect: (element: Element, click: PinPoint) => void;
  onCancel: () => void;
};

export type AnnotationMode = {
  start: () => void;
  stop: () => void;
};

// Events from inside the shadow root reach the document retargeted to the
// host, so this also recognises the Widget's own controls.
function isWidgetEvent(event: Event) {
  return (
    event.target instanceof Element &&
    event.target.closest("[data-ff-widget]") !== null
  );
}

function blockEvent(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

/**
 * While started, highlights the page element under the pointer in `overlay`
 * and turns the next click on the page into a selection instead of reaching
 * the page. Escape cancels.
 */
export function createAnnotationMode(
  document: Document,
  overlay: HTMLElement,
  { onSelect, onCancel }: AnnotationActions,
): AnnotationMode {
  let listening: AbortController | null = null;
  let previousCursor = "";

  function hideOverlay() {
    overlay.hidden = true;
  }

  function handleMouseMove(event: MouseEvent) {
    if (isWidgetEvent(event) || !(event.target instanceof Element)) {
      hideOverlay();
      return;
    }
    const rect = event.target.getBoundingClientRect();
    Object.assign(overlay.style, {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    });
    overlay.hidden = false;
  }

  function handleClick(event: MouseEvent) {
    if (isWidgetEvent(event) || !(event.target instanceof Element)) return;
    blockEvent(event);
    onSelect(event.target, { x: event.clientX, y: event.clientY });
  }

  // Without this, a pointer press on the page could close a host dialog or
  // move focus before the click selects the element.
  function handlePress(event: Event) {
    if (isWidgetEvent(event)) return;
    blockEvent(event);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") onCancel();
  }

  return {
    start() {
      if (listening) return;
      listening = new AbortController();
      const options = { capture: true, signal: listening.signal };
      document.addEventListener("mousemove", handleMouseMove, options);
      document.addEventListener("click", handleClick, options);
      document.addEventListener("mousedown", handlePress, options);
      document.addEventListener("pointerdown", handlePress, options);
      document.addEventListener("keydown", handleKeyDown, options);
      previousCursor = document.body.style.cursor;
      document.body.style.cursor = "crosshair";
    },
    stop() {
      if (!listening) return;
      listening.abort();
      listening = null;
      document.body.style.cursor = previousCursor;
      hideOverlay();
    },
  };
}
