import type {
  AreaSelectionGeometry,
  ElementSelectionGeometry,
  SelectionGeometry,
} from "@fasterfixes/core";

type PageSelectionSource = {
  selector: string | null;
  metadata: Record<string, unknown> | null;
};

/** The element fields: the clicked element, or the container of an area. */
type SelectionElement = {
  selector: string | null;
  description: string | null;
  componentPath: string | null;
  sourceFile: string | null;
};

export type PageSelection =
  | {
      form: "element";
      element: SelectionElement;
      /** Null on a Feedback from a Widget that predates the geometry. */
      geometry: ElementSelectionGeometry | null;
    }
  | {
      form: "area";
      area: AreaSelectionGeometry["area"];
      viewport: AreaSelectionGeometry["viewport"];
      /** The container (ADR-0026): labelled "inside", never as the thing selected. */
      inside: SelectionElement;
    };

// Metadata is untyped JSON written by the widget, so only non-empty strings count.
function readString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readNumbers<K extends string>(value: unknown, keys: readonly K[]) {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const numbers = {} as Record<K, number>;
  for (const key of keys) {
    const entry = record[key];
    if (!isFiniteNumber(entry)) return null;
    numbers[key] = entry;
  }
  return numbers;
}

const RECT_KEYS = ["left", "top", "width", "height"] as const;

// Every field is checked, so a malformed geometry reads as none rather than throwing.
function readGeometry(value: unknown): SelectionGeometry | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const viewport = readNumbers(record.viewport, ["width", "height"] as const);
  if (!viewport) return null;

  const area = readNumbers(record.area, RECT_KEYS);
  if (area) return { viewport, area };

  const element = readNumbers(record.element, RECT_KEYS);
  const click = readNumbers(record.click, ["x", "y"] as const);
  if (!element || !click) return null;
  return { viewport, element, click };
}

/**
 * Reads a page Feedback's Selection as its element form or its area form. The
 * only reader of `selector` as a Selection: for an area it names the container.
 */
export function readPageSelection({
  selector,
  metadata,
}: PageSelectionSource): PageSelection {
  const element = {
    selector,
    description: readString(metadata?.elementDescription),
    componentPath: readString(metadata?.reactComponentPath),
    sourceFile: readString(metadata?.sourceFile),
  };
  const geometry = readGeometry(metadata?.selection);

  if (geometry && "area" in geometry) {
    return {
      form: "area",
      area: geometry.area,
      viewport: geometry.viewport,
      inside: element,
    };
  }
  return { form: "element", element, geometry };
}

/** The text of an area: its size and position in viewport CSS pixels, then the viewport. */
export function describeSelectionArea({
  area,
  viewport,
}: Pick<Extract<PageSelection, { form: "area" }>, "area" | "viewport">) {
  const [left, top, width, height] = [
    area.left,
    area.top,
    area.width,
    area.height,
  ].map(Math.round);
  return `${width} × ${height} at (${left}, ${top}) in a ${Math.round(viewport.width)} × ${Math.round(viewport.height)} viewport`;
}
