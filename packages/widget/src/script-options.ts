/** The IIFE's file name in `dist`, which the CDN snippet points at. */
export const SCRIPT_FILE_NAME = "widget.iife.js";

type AttributeSource = Pick<Element, "getAttribute">;

/**
 * Maps the `data-*` attributes of the script tag to `init` options. Returns
 * `null` without `data-project-id`, so the script waits for a manual `init`.
 * Values are passed through untouched: `init` validates them like any option.
 */
export function readScriptOptions(
  script: AttributeSource,
): Record<string, unknown> | null {
  const projectId = script.getAttribute("data-project-id");
  if (projectId === null) return null;

  const options: Record<string, unknown> = { projectId };
  const apiOrigin = script.getAttribute("data-api-origin");
  if (apiOrigin !== null) options.apiOrigin = apiOrigin;
  const color = script.getAttribute("data-color");
  if (color !== null) options.color = color;
  const position = script.getAttribute("data-position");
  if (position !== null) options.position = position;
  const captureDiagnostics = script.getAttribute("data-capture-diagnostics");
  if (captureDiagnostics !== null) {
    options.captureDiagnostics = captureDiagnostics.trim() !== "false";
  }
  return options;
}

// `currentScript` is null when the tag was injected as a module or the code
// runs outside the initial evaluation, so fall back to a lookup by `src`.
export function findOwnScript(document: Document): Element | null {
  const current = document.currentScript;
  if (current) return current;
  return (
    Array.from(document.getElementsByTagName("script")).find((script) =>
      script.getAttribute("src")?.split(/[?#]/)[0]?.endsWith(SCRIPT_FILE_NAME),
    ) ?? null
  );
}

/** Resolves once the document is parsed, so `document.body` exists. */
export function whenBodyReady(document: Document): Promise<void> {
  // `document.body` is typed non-null, so rely on the parser state instead.
  if (document.readyState !== "loading") return Promise.resolve();
  return new Promise((resolve) => {
    document.addEventListener("DOMContentLoaded", () => resolve(), {
      once: true,
    });
  });
}
