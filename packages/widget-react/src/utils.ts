export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

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

export function getPinAnchor(metadata: unknown): PinAnchor | null {
  const pinAnchor = readMetadataRecord(metadata)?.pinAnchor;
  if (!pinAnchor || typeof pinAnchor !== "object") return null;

  const record = pinAnchor as Record<string, unknown>;
  const x = record.x;
  const y = record.y;

  if (typeof x !== "number" || typeof y !== "number") return null;

  return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
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

export function getViewportAnchoringKind(element: Element): PinTargetKind {
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    if (current instanceof HTMLElement) {
      const position = window.getComputedStyle(current).position;
      if (position === "fixed" || position === "sticky") {
        return position;
      }
    }

    current = current.parentElement;
  }

  return "normal";
}

export function createPinPlacementMetadata(
  element: Element,
  point: PinPoint,
): PinPlacementMetadata {
  const targetKind = getViewportAnchoringKind(element);

  return {
    mode: targetKind === "normal" ? "document" : "viewport",
    targetKind,
    documentPoint: {
      x: point.x + window.scrollX,
      y: point.y + window.scrollY,
    },
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
