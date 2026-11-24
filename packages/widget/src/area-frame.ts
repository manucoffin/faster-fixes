import { autoUpdate } from "@floating-ui/dom";

import type { AreaRect } from "./area-gesture.js";

export type AreaFrame = {
  /** The drawn rectangle, also the reference the comment popover anchors to. */
  element: HTMLElement;
  /** Draws `area` at its place in the viewport, as while dragging. */
  draw: (area: AreaRect) => void;
  /**
   * Keeps `area` drawn at its offset from `container`, so it moves with the
   * page on scroll, resize and layout changes.
   */
  follow: (container: Element, area: AreaRect) => void;
  /** Keeps the area `place` reads from `container`'s current box drawn. */
  track: (container: Element, place: (box: DOMRect) => AreaRect) => void;
  hide: () => void;
};

/**
 * The rectangle of an area Selection, drawn in `root` above the page. `part`
 * names the styling parts it exposes.
 */
export function createAreaFrame(
  document: Document,
  root: ShadowRoot,
  part = "area",
): AreaFrame {
  const element = document.createElement("div");
  element.className = "area";
  element.setAttribute("part", part);
  element.hidden = true;
  root.appendChild(element);

  let stopFollowing: (() => void) | null = null;

  function draw({ left, top, width, height }: AreaRect) {
    Object.assign(element.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
    element.hidden = false;
  }

  function stop() {
    stopFollowing?.();
    stopFollowing = null;
  }

  function track(container: Element, place: (box: DOMRect) => AreaRect) {
    stop();
    stopFollowing = autoUpdate(container, element, () => {
      draw(place(container.getBoundingClientRect()));
    });
  }

  return {
    element,
    draw(area) {
      stop();
      draw(area);
    },
    follow(container, area) {
      const box = container.getBoundingClientRect();
      const offsetX = area.left - box.left;
      const offsetY = area.top - box.top;
      track(container, (current) => ({
        left: current.left + offsetX,
        top: current.top + offsetY,
        width: area.width,
        height: area.height,
      }));
    },
    track,
    hide() {
      stop();
      element.hidden = true;
    },
  };
}
