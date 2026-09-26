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
