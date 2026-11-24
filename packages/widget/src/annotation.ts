import type { AreaFrame } from "./area-frame.js";
import { isDrag, readAreaRect } from "./area-gesture.js";
import type { AreaRect } from "./area-gesture.js";
import type { PinPoint } from "./pin-placement.js";

type AnnotationActions = {
  onSelect: (element: Element, click: PinPoint) => void;
  onSelectArea: (area: AreaRect) => void;
  onCancel: () => void;
};

type Press = {
  pointerId: number;
  target: Element;
  point: PinPoint;
  /** Touch keeps scrolling the page, so only a mouse or pen press can drag. */
  canDrag: boolean;
  dragging: boolean;
  /** Escape threw the rectangle away: the rest of the press selects nothing. */
  discarded: boolean;
};

export type AnnotationMode = {
  start: () => void;
  stop: () => void;
};

// Events from inside the shadow root reach the document retargeted to the
// host, so this also recognises the Widget's own controls.
export function isWidgetEvent(event: Event) {
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

// The click that ends a drag lands after annotation mode has stopped, on the
// common ancestor of the press and release targets: it must not reach the page.
function swallowNextClick(view: Window) {
  const swallowing = new AbortController();
  const options = { capture: true, signal: swallowing.signal };
  view.addEventListener(
    "click",
    (event) => {
      blockEvent(event);
      swallowing.abort();
    },
    options,
  );
  // A browser that sends no click must not cost the Reviewer their next one.
  view.addEventListener("pointerdown", () => swallowing.abort(), options);
}

/**
 * While started, highlights the page element under the pointer in `overlay`
 * and turns the next press on the page into a selection instead of reaching
 * the page: a click selects the element under the press, a drag draws an area
 * in `areaFrame`. Escape during a drag discards the rectangle; otherwise it
 * cancels.
 */
export function createAnnotationMode(
  document: Document,
  { overlay, areaFrame }: { overlay: HTMLElement; areaFrame: AreaFrame },
  { onSelect, onSelectArea, onCancel }: AnnotationActions,
): AnnotationMode {
  const view = document.defaultView ?? window;
  let listening: AbortController | null = null;
  let previousCursor = "";
  let press: Press | null = null;
  // A press on the Widget's own interface released on the page ends in a click
  // on their common ancestor, which must not select it.
  let pressedWidget = false;

  function hideOverlay() {
    overlay.hidden = true;
  }

  function handleMouseMove(event: MouseEvent) {
    if (press?.dragging) return;
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

  function readArea(event: PointerEvent, from: Press) {
    return readAreaRect(
      from.point,
      { x: event.clientX, y: event.clientY },
      { width: view.innerWidth, height: view.innerHeight },
    );
  }

  function handleClick(event: MouseEvent) {
    const fromWidget = pressedWidget;
    pressedWidget = false;
    if (isWidgetEvent(event) || !(event.target instanceof Element)) return;
    blockEvent(event);
    if (fromWidget) return;
    if (press?.discarded) {
      press = null;
      return;
    }
    // The element under the press, which a small travel may have left.
    const target = press?.target ?? event.target;
    press = null;
    onSelect(target, { x: event.clientX, y: event.clientY });
  }

  // Without this, a pointer press on the page could close a host dialog or
  // move focus before the click selects the element.
  function handlePress(event: Event) {
    if (isWidgetEvent(event)) return;
    blockEvent(event);
  }

  function handlePointerDown(event: PointerEvent) {
    pressedWidget = isWidgetEvent(event);
    if (pressedWidget) {
      press = null;
      return;
    }
    blockEvent(event);
    if (!(event.target instanceof Element) || event.button !== 0) return;
    press = {
      pointerId: event.pointerId,
      target: event.target,
      point: { x: event.clientX, y: event.clientY },
      canDrag: event.pointerType !== "touch",
      dragging: false,
      discarded: false,
    };
  }

  function handlePointerMove(event: PointerEvent) {
    if (!press?.canDrag || event.pointerId !== press.pointerId) return;
    if (press.discarded) return;
    if (!press.dragging) {
      if (!isDrag(press.point, { x: event.clientX, y: event.clientY })) return;
      press.dragging = true;
      hideOverlay();
    }
    areaFrame.draw(readArea(event, press));
  }

  function handlePointerUp(event: PointerEvent) {
    if (event.pointerId !== press?.pointerId) return;
    if (press.discarded) {
      // Kept until the click that ends the press, which handleClick swallows.
      blockEvent(event);
      return;
    }
    if (!press.dragging) return;
    blockEvent(event);
    const area = readArea(event, press);
    press = null;
    swallowNextClick(view);
    onSelectArea(area);
  }

  function handlePointerCancel(event: PointerEvent) {
    if (event.pointerId !== press?.pointerId) return;
    if (press.dragging) areaFrame.hide();
    press = null;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== "Escape") return;
    if (!press?.dragging) {
      onCancel();
      return;
    }
    // Swallowed so a host dialog under the drag does not close either.
    blockEvent(event);
    areaFrame.hide();
    press.dragging = false;
    press.discarded = true;
  }

  // Keeps the page as the Reviewer is outlining it: no text selection, no
  // native drag of an image or link, no wheel scroll under the rectangle.
  function handleDragGuard(event: Event) {
    if (isWidgetEvent(event)) return;
    if (event.type === "wheel" && !press?.dragging) return;
    event.preventDefault();
  }

  return {
    start() {
      if (listening) return;
      listening = new AbortController();
      const options = { capture: true, signal: listening.signal };
      // Captured on the window so they run before any document-level
      // outside-click handler a host dialog or drawer registered first.
      document.addEventListener("mousemove", handleMouseMove, options);
      view.addEventListener("click", handleClick, options);
      view.addEventListener("mousedown", handlePress, options);
      view.addEventListener("pointerdown", handlePointerDown, options);
      view.addEventListener("pointermove", handlePointerMove, options);
      view.addEventListener("pointerup", handlePointerUp, options);
      view.addEventListener("pointercancel", handlePointerCancel, options);
      document.addEventListener("selectstart", handleDragGuard, options);
      document.addEventListener("dragstart", handleDragGuard, options);
      view.addEventListener("wheel", handleDragGuard, {
        ...options,
        passive: false,
      });
      document.addEventListener("keydown", handleKeyDown, options);
      previousCursor = document.body.style.cursor;
      document.body.style.cursor = "crosshair";
    },
    stop() {
      if (!listening) return;
      listening.abort();
      listening = null;
      if (press?.dragging) areaFrame.hide();
      press = null;
      pressedWidget = false;
      document.body.style.cursor = previousCursor;
      hideOverlay();
    },
  };
}
