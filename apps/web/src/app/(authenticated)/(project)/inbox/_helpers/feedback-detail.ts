import type { CustomMetadata } from "@fasterfixes/core";

type ElementSource = {
  selector: string | null;
  metadata: Record<string, unknown> | null;
};

type EnvironmentSource = {
  browserName: string | null;
  browserVersion: string | null;
  os: string | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
};

// Metadata is untyped JSON written by the widget, so only non-empty strings count.
function readString(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

export function getElementContext({ selector, metadata }: ElementSource) {
  const description = readString(metadata?.elementDescription);
  const componentPath = readString(metadata?.reactComponentPath);
  const sourceFile = readString(metadata?.sourceFile);

  return {
    description,
    componentPath,
    // The widget writes the path as "<App> <Layout> <Button>".
    components: componentPath
      ? componentPath
          .split(/\s+/)
          .map((name) => name.replace(/^<|>$/g, ""))
          .filter(Boolean)
      : [],
    sourceFile,
    selector,
    hasContext: !!(description ?? componentPath ?? sourceFile),
  };
}

export type ElementContext = ReturnType<typeof getElementContext>;

export function formatElementForCopy(element: ElementContext) {
  return [
    element.description && `Element: ${element.description}`,
    element.sourceFile && `Source file: ${element.sourceFile}`,
    element.componentPath && `Component tree: ${element.componentPath}`,
    element.selector && `DOM selector: ${element.selector}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatPagePath(pageUrl: string) {
  try {
    const url = new URL(pageUrl);
    return url.pathname === "/" ? url.host : `${url.host}${url.pathname}`;
  } catch {
    return pageUrl;
  }
}

export function formatEnvironment(f: EnvironmentSource) {
  const browser = f.browserName
    ? [f.browserName, f.browserVersion].filter(Boolean).join(" ")
    : null;
  const viewport =
    f.viewportWidth && f.viewportHeight
      ? `${f.viewportWidth}×${f.viewportHeight}`
      : null;
  const details = [f.os, viewport].filter(Boolean).join(" · ");

  return { browser, details: details || null };
}

export function getCustomMetadataRows(customMetadata: CustomMetadata | null) {
  return Object.entries(customMetadata ?? {}).map(([key, value]) => ({
    key,
    // String() already renders null as "null" and booleans as "true"/"false".
    value: String(value),
  }));
}
