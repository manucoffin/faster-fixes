import { WIDGET_ATTRIBUTE } from "./capture-attributes.js";
import type { AreaRect } from "./area-gesture.js";

// Rounding of fractional boxes must not push the container one level up.
const BOX_TOLERANCE_PX = 1;

function pageElementAt(document: Document, x: number, y: number) {
  return document
    .elementsFromPoint(x, y)
    .find((element) => !element.closest(`[${WIDGET_ATTRIBUTE}]`));
}

function commonAncestor(first: Element, second: Element) {
  let current: Element | null = first;
  while (current && !current.contains(second)) current = current.parentElement;
  return current;
}

function containsArea(element: Element, area: AreaRect) {
  const box = element.getBoundingClientRect();
  return (
    box.left <= area.left + BOX_TOLERANCE_PX &&
    box.top <= area.top + BOX_TOLERANCE_PX &&
    box.right >= area.left + area.width - BOX_TOLERANCE_PX &&
    box.bottom >= area.top + area.height - BOX_TOLERANCE_PX
  );
}

/**
 * The smallest page element containing the whole area: the common ancestor of
 * the elements under its corners, climbed until its box contains the area. At
 * worst the body.
 */
export function resolveAreaContainer(document: Document, area: AreaRect) {
  const { body } = document;
  // The far edges are exclusive: a point on them belongs to the next pixel.
  const right = area.left + Math.max(area.width - 1, 0);
  const bottom = area.top + Math.max(area.height - 1, 0);
  const corners = [
    pageElementAt(document, area.left, area.top),
    pageElementAt(document, right, area.top),
    pageElementAt(document, area.left, bottom),
    pageElementAt(document, right, bottom),
  ];

  let container: Element | null = null;
  for (const corner of corners) {
    if (!corner) continue;
    container = container ? commonAncestor(container, corner) : corner;
  }
  if (!container || !body.contains(container)) return body;

  while (container !== body && !containsArea(container, area)) {
    container = container.parentElement ?? body;
  }
  return container;
}
