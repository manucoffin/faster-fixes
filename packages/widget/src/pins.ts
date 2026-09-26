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
  /** One pin per item; a pin already on screen for an id is kept and updated. */
  render: (items: FeedbackItem[]) => void;
  setShown: (shown: boolean) => void;
  /** Scales up the active pin and keeps its element outlined. */
  setActive: (id: string | null) => void;
  destroy: () => void;
};

export function statusColor(status: string) {
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
  onPinClick: (item: FeedbackItem, pin: HTMLElement) => void,
): PinLayer {
  const layer = document.createElement("div");
  layer.className = "pins";
  container.appendChild(layer);

  let pins: { item: FeedbackItem; element: HTMLButtonElement }[] = [];
  let activeId: string | null = null;
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

  function itemOf(pin: HTMLButtonElement) {
    return pins.find(({ element }) => element === pin)?.item ?? null;
  }

  // Hovering outlines the hovered pin's element, leaving restores the active one's.
  function highlightActive() {
    const active = pins.find(({ item }) => item.id === activeId);
    showHighlight(highlight, active ? resolveTarget(active.item) : null);
  }

  function createPin() {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "pin";
    pin.setAttribute("part", "pin");
    pin.appendChild(createIcon(document, "message", 12, { filled: true }));
    pin.addEventListener("mouseenter", () => {
      const item = itemOf(pin);
      if (item) showHighlight(highlight, resolveTarget(item));
    });
    pin.addEventListener("mouseleave", highlightActive);
    pin.addEventListener("click", () => {
      const item = itemOf(pin);
      if (item) onPinClick(item, pin);
    });
    return pin;
  }

  function fillPin(pin: HTMLButtonElement, item: FeedbackItem) {
    pin.dataset.ffPinId = item.id;
    pin.style.backgroundColor = statusColor(item.status);
    pin.setAttribute(
      "aria-label",
      labels.pinAriaLabel(item.comment.slice(0, EXCERPT_LENGTH)),
    );
    pin.classList.toggle("pin-active", item.id === activeId);
    return pin;
  }

  const listening = new AbortController();
  window.addEventListener("resize", update, {
    passive: true,
    signal: listening.signal,
  });
  window.addEventListener("load", update, { signal: listening.signal });
  // The highlight is fixed, so the active element's outline follows the scroll.
  window.addEventListener(
    "scroll",
    () => {
      if (activeId !== null) highlightActive();
    },
    { passive: true, signal: listening.signal },
  );
  // Dialog portals and client-rendered sections come and go as body children.
  const observer = new MutationObserver(update);
  observer.observe(document.body, { childList: true });

  return {
    render(items) {
      clearSchedule();
      // Kept by id so an open pin popover stays anchored across list reloads.
      const existing = new Map(
        pins.map(({ item, element }) => [item.id, element]),
      );
      pins = items.map((item) => ({
        item,
        element: fillPin(existing.get(item.id) ?? createPin(), item),
      }));
      layer.replaceChildren(...pins.map(({ element }) => element));
      highlightActive();
      update();
      frame = window.requestAnimationFrame(update);
      retryTimers = RETRY_DELAYS.map((delay) => setTimeout(update, delay));
    },
    setShown(shown) {
      layer.hidden = !shown;
      if (!shown) showHighlight(highlight, null);
    },
    setActive(id) {
      activeId = id;
      for (const { item, element } of pins) {
        element.classList.toggle("pin-active", item.id === id);
      }
      highlightActive();
    },
    destroy() {
      clearSchedule();
      listening.abort();
      observer.disconnect();
      layer.remove();
    },
  };
}
