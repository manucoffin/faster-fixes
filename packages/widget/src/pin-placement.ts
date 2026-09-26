// Ported from the React Embed's `utils.ts`: the stored shape must stay
// identical, since both Embeds read pins created by either.

export type PinAnchor = {
  x: number;
  y: number;
};

export type PinPlacementMode = "document" | "viewport";

export type PinTargetKind = "normal" | "fixed" | "sticky";

export type PinPoint = {
  x: number;
  y: number;
};

export type PinPlacementMetadata = {
  mode: PinPlacementMode;
  documentPoint?: PinPoint;
  viewportPoint?: PinPoint;
  targetKind?: PinTargetKind;
};

type Rect = Pick<DOMRect, "left" | "top" | "width" | "height">;

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Where the click landed inside the element, as fractions of its size, so the
 * pin keeps its spot when the element moves or resizes. `null` for an element
 * with no area.
 */
export function computePinAnchor(
  rect: Rect,
  click: PinPoint,
): PinAnchor | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: clamp((click.x - rect.left) / rect.width, 0, 1),
    y: clamp((click.y - rect.top) / rect.height, 0, 1),
  };
}

function readComputedPosition(element: Element) {
  const view = element.ownerDocument.defaultView;
  return view && element instanceof view.HTMLElement
    ? view.getComputedStyle(element).position
    : "static";
}

/**
 * `fixed` or `sticky` when the element or one of its ancestors is, because
 * such an element stays put in the viewport while the document scrolls.
 */
export function getViewportAnchoringKind(
  element: Element,
  readPosition: (element: Element) => string = readComputedPosition,
): PinTargetKind {
  const root = element.ownerDocument.documentElement;
  for (
    let current: Element | null = element;
    current && current !== root;
    current = current.parentElement
  ) {
    const position = readPosition(current);
    if (position === "fixed" || position === "sticky") return position;
  }
  return "normal";
}

export function createPinPlacementMetadata(
  targetKind: PinTargetKind,
  point: PinPoint,
  scroll: PinPoint,
): PinPlacementMetadata {
  return {
    mode: targetKind === "normal" ? "document" : "viewport",
    targetKind,
    documentPoint: { x: point.x + scroll.x, y: point.y + scroll.y },
    viewportPoint: point,
  };
}

function readMetadataRecord(metadata: unknown) {
  return metadata && typeof metadata === "object"
    ? (metadata as Record<string, unknown>)
    : null;
}

function readPoint(value: unknown): PinPoint | undefined {
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  return typeof record.x === "number" && typeof record.y === "number"
    ? { x: record.x, y: record.y }
    : undefined;
}

function readTargetKind(value: unknown): PinTargetKind | undefined {
  return value === "normal" || value === "fixed" || value === "sticky"
    ? value
    : undefined;
}

export function getPinAnchor(metadata: unknown): PinAnchor | null {
  const pinAnchor = readMetadataRecord(metadata)?.pinAnchor;
  const point = readPoint(pinAnchor);
  if (!point) return null;
  return { x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) };
}

export function getPinPlacementMetadata(
  metadata: unknown,
): PinPlacementMetadata | null {
  const pinPlacement = readMetadataRecord(metadata)?.pinPlacement;
  if (!pinPlacement || typeof pinPlacement !== "object") return null;

  const record = pinPlacement as Record<string, unknown>;
  const mode = record.mode;
  if (mode !== "document" && mode !== "viewport") return null;

  return {
    mode,
    documentPoint: readPoint(record.documentPoint),
    viewportPoint: readPoint(record.viewportPoint),
    targetKind: readTargetKind(record.targetKind),
  };
}

// A pin is a dot centred on its anchor, with a label beside it that widens to
// the comment excerpt on hover.
export const PIN_DOT_SIZE = 14;
export const PIN_HEIGHT = 24;
const PIN_LABEL_ROOM = 280;

export type PinLabelSide = "left" | "right";

/** `top` and `left` are where the dot's centre goes. */
export type PinPosition = {
  mode: PinPlacementMode;
  top: number;
  left: number;
  side: PinLabelSide;
};

export type PinView = {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
};

type PinItem = {
  clickX: number | null;
  clickY: number | null;
  metadata?: unknown;
};

type PinTarget = {
  rect: Rect;
  /** Read only when the stored placement does not say, since it walks ancestors. */
  readTargetKind: () => PinTargetKind;
};

// The label goes left only when it would overflow on the right and the left
// has more room, so a pin on a narrow screen keeps its label on screen.
function labelSide(viewportX: number, viewWidth: number): PinLabelSide {
  return viewportX + PIN_LABEL_ROOM > viewWidth && viewportX > viewWidth / 2
    ? "left"
    : "right";
}

function placeOnTarget(
  metadata: unknown,
  { rect, readTargetKind }: PinTarget,
  view: PinView,
): PinPosition | null {
  // An element with no box, e.g. inside a closed dialog, is not on screen.
  if (rect.width === 0 && rect.height === 0) return null;

  const pinAnchor = getPinAnchor(metadata);
  const stored = getPinPlacementMetadata(metadata);
  const targetKind = stored?.targetKind ?? readTargetKind();
  const mode =
    stored?.mode ?? (targetKind === "normal" ? "document" : "viewport");

  // Pins stored before the anchor existed sit on the element's top right corner.
  const anchorX = pinAnchor
    ? rect.left + rect.width * pinAnchor.x
    : rect.left + rect.width;
  const anchorY = pinAnchor ? rect.top + rect.height * pinAnchor.y : rect.top;

  const left = clamp(anchorX, PIN_DOT_SIZE / 2, view.width - PIN_DOT_SIZE / 2);
  const side = labelSide(left, view.width);

  let top = anchorY;
  if (!pinAnchor && top + PIN_HEIGHT / 2 > view.height) {
    top = rect.top + rect.height - PIN_HEIGHT / 2;
  }
  if (mode === "viewport") {
    top = clamp(top, PIN_HEIGHT / 2, view.height - PIN_HEIGHT / 2);
  }

  return mode === "document"
    ? { mode, top: top + view.scrollY, left: left + view.scrollX, side }
    : { mode, top, left, side };
}

/**
 * Where the pin for `item` goes, from its resolved element when there is one,
 * else from the stored points. `document` positions are page coordinates for
 * an absolutely positioned pin, `viewport` ones are for a fixed pin. `null`
 * hides the pin.
 */
export function placePin(
  item: PinItem,
  target: PinTarget | null,
  view: PinView,
): PinPosition | null {
  if (target) return placeOnTarget(item.metadata, target, view);

  // A pin stored with selector strategies was on a transient element, such as
  // a closed dialog, so it hides. Older pins fall back to their stored points.
  if (readMetadataRecord(item.metadata)?.selectors) return null;
  if (item.clickX == null || item.clickY == null) return null;

  const stored = getPinPlacementMetadata(item.metadata);
  if (stored?.mode === "document" && stored.documentPoint) {
    return {
      mode: "document",
      top: stored.documentPoint.y,
      left: stored.documentPoint.x,
      side: labelSide(stored.documentPoint.x - view.scrollX, view.width),
    };
  }
  return {
    mode: "viewport",
    top: item.clickY,
    left: item.clickX,
    side: labelSide(item.clickX, view.width),
  };
}
