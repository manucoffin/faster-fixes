export type SelectorStrategies = {
  dataTestId?: string;
  ariaLabel?: string;
  id?: string;
  stableClasses?: string;
  nthOfType?: string;
};

/**
 * Returns true if a CSS selector matches exactly one element in the document.
 */
function isUnique(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

/**
 * Returns true if a CSS class name looks auto-generated (CSS modules hash,
 * Tailwind JIT bracket syntax, etc.) and should not be used for stable selectors.
 */
function isGeneratedClass(cls: string): boolean {
  if (cls.startsWith("_")) return true;
  // CSS module hash suffix: 5+ alphanumeric chars after a separator
  if (/[_-][a-z0-9]{5,}$/i.test(cls)) return true;
  // Tailwind arbitrary value syntax
  if (cls.startsWith("[") || cls.includes(":[")) return true;
  return false;
}

/**
 * Builds the nth-of-type DOM path (the legacy approach).
 */
function buildNthOfTypePath(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    const parent: Element | null = current.parentElement;
    if (parent) {
      const tag = current.tagName;
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === tag,
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = parent;
  }

  return parts.join(" > ");
}

/**
 * Generates multiple selector strategies for an element, returning the most
 * stable unique selector as `best` and all strategies in `strategies`.
 *
 * Priority: data-testid > id > aria-label > stable CSS classes > nth-of-type.
 */
export function generateSelectors(el: Element): {
  best: string;
  strategies: SelectorStrategies;
} {
  const strategies: SelectorStrategies = {};

  // 1. data-testid
  const testId = el.getAttribute("data-testid");
  if (testId) {
    const selector = `[data-testid="${CSS.escape(testId)}"]`;
    if (isUnique(selector)) {
      strategies.dataTestId = selector;
    }
  }

  // 2. id
  if (el.id) {
    const selector = `#${CSS.escape(el.id)}`;
    if (isUnique(selector)) {
      strategies.id = selector;
    }
  }

  // 3. aria-label
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) {
    const tag = el.tagName.toLowerCase();
    const selector = `${tag}[aria-label="${CSS.escape(ariaLabel)}"]`;
    if (isUnique(selector)) {
      strategies.ariaLabel = selector;
    }
  }

  // 4. Stable CSS classes
  const stableClasses = Array.from(el.classList).filter(
    (cls) => !isGeneratedClass(cls),
  );
  if (stableClasses.length > 0) {
    const tag = el.tagName.toLowerCase();
    const classSelector = stableClasses.map((c) => `.${CSS.escape(c)}`).join("");
    const selector = `${tag}${classSelector}`;
    if (isUnique(selector)) {
      strategies.stableClasses = selector;
    }
  }

  // 5. nth-of-type path (always generated as fallback)
  strategies.nthOfType = buildNthOfTypePath(el);

  // Pick the best (first available in priority order)
  const best =
    strategies.dataTestId ??
    strategies.id ??
    strategies.ariaLabel ??
    strategies.stableClasses ??
    strategies.nthOfType;

  return { best, strategies };
}

/**
 * Generates a best-effort unique CSS selector for a DOM element.
 * Backward-compatible wrapper around generateSelectors().
 */
export function generateSelector(el: Element): string {
  return generateSelectors(el).best;
}

/**
 * Tries to find an element using the primary selector first, then falls back
 * to each strategy in priority order. Returns null if nothing matches.
 */
export function resolveElement(
  primarySelector: string | null,
  strategies?: SelectorStrategies,
): Element | null {
  // Try primary selector first
  if (primarySelector) {
    try {
      const el = document.querySelector(primarySelector);
      if (el) return el;
    } catch {
      // Invalid selector — continue to fallbacks
    }
  }

  if (!strategies) return null;

  // Try each strategy in priority order
  const ordered = [
    strategies.dataTestId,
    strategies.id,
    strategies.ariaLabel,
    strategies.stableClasses,
    strategies.nthOfType,
  ];

  for (const selector of ordered) {
    if (!selector || selector === primarySelector) continue;
    try {
      const el = document.querySelector(selector);
      if (el) return el;
    } catch {
      // Skip invalid selectors
    }
  }

  return null;
}
