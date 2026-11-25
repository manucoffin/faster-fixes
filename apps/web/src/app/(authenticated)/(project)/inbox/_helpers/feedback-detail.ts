import type { CustomMetadata } from "@fasterfixes/core";
import { readPageSelection } from "@/app/_domains/feedback/_helpers/read-page-selection";

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

/**
 * What the context card shows of a page Selection: the selected element, or
 * an area with its size and the container it sits inside.
 */
export function getElementContext({ selector, metadata }: ElementSource) {
  const selection = readPageSelection({ selector, metadata });
  const { description, componentPath, sourceFile } =
    selection.form === "area" ? selection.inside : selection.element;

  return {
    // For an area, the fields below describe its container, never the thing selected.
    area:
      selection.form === "area"
        ? { width: selection.area.width, height: selection.area.height }
        : null,
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
    hasContext:
      selection.form === "area" ||
      !!(description ?? componentPath ?? sourceFile),
  };
}

export type ElementContext = ReturnType<typeof getElementContext>;

export function formatAreaSize({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return `${Math.round(width)}×${Math.round(height)}`;
}

export function formatElementForCopy(element: ElementContext) {
  const { area } = element;
  return [
    area && `Area: ${formatAreaSize(area)}`,
    element.description &&
      `${area ? "Inside" : "Element"}: ${element.description}`,
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

type SectionsSource = EnvironmentSource & {
  videoId: string | null;
  pageUrl: string | null;
};

/**
 * The sections the detail Sheet shows for a Feedback. A video Feedback has no
 * element, no custom metadata and no diagnostics, and keeps Environment only
 * when the review page captured some of it.
 */
export function getFeedbackDetailSections(f: SectionsSource) {
  const isVideo = f.videoId !== null;
  const hasEnvironment = [
    f.browserName,
    f.browserVersion,
    f.os,
    f.viewportWidth,
    f.viewportHeight,
  ].some((value) => value !== null);

  return {
    page: !isVideo && f.pageUrl !== null,
    video: isVideo,
    elementContext: !isVideo,
    environment: !isVideo || hasEnvironment,
    customMetadata: !isVideo,
    diagnostics: !isVideo,
  };
}
