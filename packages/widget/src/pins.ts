import { resolveElement, STATUS_COLORS } from "@fasterfixes/core";
import type {
  FeedbackItem,
  Labels,
  SelectorStrategies,
} from "@fasterfixes/core";

import { getViewportAnchoringKind, placePin } from "./pin-placement.js";

// Hydration and lazy rendering on the host page settle at unknown times.
const RETRY_DELAYS = [100, 300, 600, 1200, 2500];
const EXCERPT_LENGTH = 50;

export type PinLayer = {
  /** One pin per item; a pin already on screen for an id is kept and updated. */
  render: (items: FeedbackItem[]) => void;
  setShown: (shown: boolean) => void;
  /** The pin on screen for an item, or null when the item has none. */
  pinOf: (id: string) => HTMLElement | null;
  /** Keeps the active item's element outlined and its pin expanded, if it has one. */
  setActive: (item: FeedbackItem | null) => void;
  destroy: () => void;
};

export function statusColor(status: string) {
  // why: the status comes from an API response, so a newer server can send one this build does not know
  const colors: Partial<Record<string, string>> = STATUS_COLORS;
  return colors[status] ?? STATUS_COLORS.new;
}

/** Each item's pin number, counting from 1 in the order the items were created. */
export function numberPins(items: Pick<FeedbackItem, "id" | "createdAt">[]) {
  const byCreation = [...items].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  return new Map(byCreation.map((item, index) => [item.id, index + 1]));
}

export function resolveTarget(item: FeedbackItem) {
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
  let active: FeedbackItem | null = null;
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
      element.dataset.ffPinSide = position.side;
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
    showHighlight(highlight, active ? resolveTarget(active) : null);
  }

  function createPin() {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "pin";
    pin.setAttribute("part", "pin");
    const dot = document.createElement("span");
    dot.className = "pin-dot";
    const label = document.createElement("span");
    label.className = "pin-label";
    const number = document.createElement("span");
    number.className = "pin-number";
    const excerpt = document.createElement("span");
    excerpt.className = "pin-excerpt";
    label.append(number, excerpt);
    pin.append(dot, label);
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

  function fillPin(pin: HTMLButtonElement, item: FeedbackItem, number = 0) {
    pin.dataset.ffPinId = item.id;
    pin.style.setProperty("--ff-pin-color", statusColor(item.status));
    const [numberText, excerpt] = pin.querySelectorAll(
      ".pin-number, .pin-excerpt",
    );
    if (numberText) numberText.textContent = `#${number}`;
    // The label truncates the comment itself, with an ellipsis.
    if (excerpt) excerpt.textContent = item.comment;
    pin.setAttribute(
      "aria-label",
      labels.pinAriaLabel(item.comment.slice(0, EXCERPT_LENGTH)),
    );
    pin.classList.toggle("pin-active", item.id === active?.id);
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
      if (active) highlightActive();
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
      const numbers = numberPins(items);
      pins = items.map((item) => ({
        item,
        element: fillPin(
          existing.get(item.id) ?? createPin(),
          item,
          numbers.get(item.id),
        ),
      }));
      layer.replaceChildren(...pins.map(({ element }) => element));
      highlightActive();
      update();
      frame = window.requestAnimationFrame(update);
      retryTimers = RETRY_DELAYS.map((delay) => setTimeout(update, delay));
    },
    pinOf(id) {
      return pins.find(({ item }) => item.id === id)?.element ?? null;
    },
    setShown(shown) {
      layer.hidden = !shown;
      if (!shown) showHighlight(highlight, null);
    },
    setActive(item) {
      active = item;
      for (const pin of pins) {
        pin.element.classList.toggle("pin-active", pin.item.id === item?.id);
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
