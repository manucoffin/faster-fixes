import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";

// Matches the `ff-popover-fadeout` animation on `.popover.fading`.
export const POPOVER_FADEOUT_MS = 200;

/**
 * Keeps `floating` under `reference`, flipped and shifted to stay on screen,
 * while the page scrolls and resizes. Returns the function that stops it.
 */
export function anchorBelow(reference: Element, floating: HTMLElement) {
  return autoUpdate(reference, floating, () => {
    void computePosition(reference, floating, {
      strategy: "fixed",
      placement: "bottom",
      middleware: [offset(12), flip(), shift({ padding: 8 })],
    }).then(({ x, y }) => {
      floating.style.left = `${x}px`;
      floating.style.top = `${y}px`;
    });
  });
}

export function createActionButton(
  document: Document,
  text: string,
  variant: "primary" | "secondary" | "danger",
) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `action action-${variant}`;
  button.textContent = text;
  return button;
}
