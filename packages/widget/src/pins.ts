import { resolveElement, STATUS_COLORS } from "@fasterfixes/core";
import type {
  FeedbackItem,
  Labels,
  SelectorStrategies,
} from "@fasterfixes/core";

import { createIcon } from "./icons.js";
import { getViewportAnchoringKind, placePin } from "./pin-placement.js";

// Hydration and lazy rendering on the host page settle at unknown times.
const RETRY_DELAYS = [100, 300, 600, 1200, 2500];
const EXCERPT_LENGTH = 50;

export type PinLayer = {
  /** Replaces the pins with one per item. */
  render: (items: FeedbackItem[]) => void;
  setShown: (shown: boolean) => void;
  destroy: () => void;
};

function statusColor(status: string) {
  // why: the status comes from an API response, so a newer server can send one this build does not know
  const colors: Partial<Record<string, string>> = STATUS_COLORS;
  return colors[status] ?? STATUS_COLORS.new;
}

function resolveTarget(item: FeedbackItem) {
  const strategies = item.metadata?.selectors as SelectorStrategies | undefined;
  if (!item.selector && !strategies) return null;
  return resolveElement(item.selector, strategies);
}

function showHighlight(highlight: HTMLElement, element: Element | null) {
  if (!element) {
    highlight.hidden = true;
    return;
  }
  const rect = element.getBoundingClientRect();
  Object.assign(highlight.style, {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  });
  highlight.hidden = false;
}

/**
 * Pins for Feedback items, each on the element it was left on, kept in place
 * as the page resizes, loads and changes. Hovering a pin outlines its element
 * in `highlight`.
 */
export function createPinLayer(
  document: Document,
  container: ShadowRoot,
  labels: Labels,
  highlight: HTMLElement,
): PinLayer {
  const layer = document.createElement("div");
  layer.className = "pins";
  container.appendChild(layer);

  let pins: { item: FeedbackItem; element: HTMLButtonElement }[] = [];
  let retryTimers: ReturnType<typeof setTimeout>[] = [];
  let frame: number | null = null;

  function update() {
    const view = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    };
    for (const { item, element } of pins) {
      const target = resolveTarget(item);
      const position = placePin(
        item,
        target && {
          rect: target.getBoundingClientRect(),
          readTargetKind: () => getViewportAnchoringKind(target),
        },
        view,
      );
      element.hidden = position === null;
      if (!position) continue;
      element.dataset.ffPinMode = position.mode;
      element.style.position =
        position.mode === "document" ? "absolute" : "fixed";
      element.style.top = `${position.top}px`;
      element.style.left = `${position.left}px`;
    }
  }

  function clearSchedule() {
    retryTimers.forEach(clearTimeout);
    retryTimers = [];
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
  }

  function createPin(item: FeedbackItem) {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "pin";
    pin.setAttribute("part", "pin");
    pin.dataset.ffPinId = item.id;
    pin.style.backgroundColor = statusColor(item.status);
    pin.setAttribute(
      "aria-label",
      labels.pinAriaLabel(item.comment.slice(0, EXCERPT_LENGTH)),
    );
    pin.appendChild(createIcon(document, "message", 12, { filled: true }));
    pin.addEventListener("mouseenter", () =>
      showHighlight(highlight, resolveTarget(item)),
    );
    pin.addEventListener("mouseleave", () => showHighlight(highlight, null));
    return pin;
  }

  const listening = new AbortController();
  window.addEventListener("resize", update, {
    passive: true,
    signal: listening.signal,
  });
  window.addEventListener("load", update, { signal: listening.signal });
  // Dialog portals and client-rendered sections come and go as body children.
  const observer = new MutationObserver(update);
  observer.observe(document.body, { childList: true });

  return {
    render(items) {
      clearSchedule();
      showHighlight(highlight, null);
      pins = items.map((item) => ({ item, element: createPin(item) }));
      layer.replaceChildren(...pins.map(({ element }) => element));
      update();
      frame = window.requestAnimationFrame(update);
      retryTimers = RETRY_DELAYS.map((delay) => setTimeout(update, delay));
    },
    setShown(shown) {
      layer.hidden = !shown;
      if (!shown) showHighlight(highlight, null);
    },
    destroy() {
      clearSchedule();
      listening.abort();
      observer.disconnect();
      layer.remove();
    },
  };
}
