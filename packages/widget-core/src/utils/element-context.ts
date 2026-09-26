import type { SelectorStrategies } from "./selector.js";

export type ElementContext = {
  elementDescription: string;
  reactComponentPath: string | null;
  sourceFile: string | null;
  nearbyText: string;
  selectors: SelectorStrategies;
};

/**
 * Builds a human-readable description of an element,
 * e.g. `button "Save Changes"` or `input[type="email"]`.
 */
function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase();

  const label =
    el.getAttribute("aria-label") ??
    (el as HTMLInputElement).placeholder ??
    el.getAttribute("alt") ??
    el.getAttribute("title") ??
    el.textContent?.trim().slice(0, 50) ??
    null;

  const typeAttr = el.getAttribute("type");
  const roleAttr = el.getAttribute("role");

  let desc = tag;
  if (typeAttr && tag === "input") desc += `[type="${typeAttr}"]`;
  if (roleAttr) desc += `[role="${roleAttr}"]`;
  if (label) desc += ` "${label}"`;

  return desc;
}

/**
 * Collects text content from the element and its immediate siblings,
 * separated by " | ", truncated to maxLength.
 */
function collectNearbyText(el: Element, maxLength = 200): string {
  const parts: string[] = [];

  const prev = el.previousElementSibling?.textContent?.trim();
  if (prev) parts.push(prev);

  const self = el.textContent?.trim();
  if (self) parts.push(self);

  const next = el.nextElementSibling?.textContent?.trim();
  if (next) parts.push(next);

  const joined = parts.join(" | ");
  return joined.length > maxLength
    ? `${joined.slice(0, maxLength)}...`
    : joined;
}

// The fields of a React fiber this module reads. React publishes no type for
// its internals, so these are the shapes it has shipped for years.
type ComponentType = {
  displayName?: string;
  name?: string;
  // forwardRef / memo wrappers
  render?: { displayName?: string; name?: string };
};

type DebugSource = { fileName?: string; lineNumber?: number };

type Fiber = {
  type?: unknown;
  return?: Fiber | null;
  _debugSource?: DebugSource;
};

/**
 * Finds the React fiber node attached to a DOM element.
 * Returns null if the element is not managed by React.
 */
function getFiber(el: Element): Fiber | null {
  const key = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
  return key ? ((Reflect.get(el, key) as Fiber | undefined) ?? null) : null;
}

function componentNameOf(type: unknown): string | null {
  if (typeof type !== "function" && (typeof type !== "object" || !type)) {
    return null;
  }
  const component = type as ComponentType;
  return (
    component.displayName ??
    component.name ??
    component.render?.displayName ??
    component.render?.name ??
    null
  );
}

/**
 * Walks up the React fiber tree to collect component names.
 * Returns a string like "<App> <Layout> <Dialog> <Button>", or null.
 */
function getReactComponentPath(el: Element): string | null {
  try {
    let fiber = getFiber(el);
    if (!fiber) return null;

    const names: string[] = [];
    const maxDepth = 30;
    let depth = 0;

    while (fiber && depth < maxDepth) {
      const name = componentNameOf(fiber.type);
      if (name && !name.startsWith("_")) {
        names.unshift(`<${name}>`);
      }
      fiber = fiber.return ?? null;
      depth++;
    }

    return names.length > 0 ? names.join(" ") : null;
  } catch {
    return null;
  }
}

function formatDebugSource(src: DebugSource): string | null {
  const fileName = src.fileName ?? "";
  if (!fileName) return null;
  // Strip common bundler prefixes
  const clean = fileName
    .replace(/^webpack-internal:\/\/\//, "")
    .replace(/^\(rsc\)\//, "")
    .replace(/^\.\//, "");
  return src.lineNumber ? `${clean}:${src.lineNumber}` : clean;
}

/**
 * Extracts the source file location from the React fiber's _debugSource.
 * Only available in development builds. Returns null in production.
 */
function getSourceFile(el: Element): string | null {
  try {
    let fiber = getFiber(el);
    if (!fiber) return null;

    // Walk up to find the nearest fiber with _debugSource
    let depth = 0;
    while (fiber && depth < 10) {
      const location = fiber._debugSource
        ? formatDebugSource(fiber._debugSource)
        : null;
      if (location) return location;
      fiber = fiber.return ?? null;
      depth++;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Captures rich context about a DOM element for feedback metadata.
 * React-specific features (component path, source file) gracefully
 * return null when unavailable (production builds, non-React apps).
 */
export function captureElementContext(
  el: Element,
  selectors: SelectorStrategies,
): ElementContext {
  return {
    elementDescription: describeElement(el),
    reactComponentPath: getReactComponentPath(el),
    sourceFile: getSourceFile(el),
    nearbyText: collectNearbyText(el),
    selectors,
  };
}
