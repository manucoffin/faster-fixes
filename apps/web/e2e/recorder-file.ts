import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { Page } from "@playwright/test";

// Read on use, never at import: Knip loads this module from the repo root.
function readWidgetFile(path: string) {
  return readFileSync(
    join(process.cwd(), "node_modules/@fasterfixes/widget", path),
  );
}

/** The version the built script addresses the recorder file at. */
export function widgetVersion() {
  const packageJson = JSON.parse(readWidgetFile("package.json").toString()) as {
    version: string;
  };
  return packageJson.version;
}

/** Any version, so a script built at another version still reaches the stub. */
export const RECORDER_FILE_PATTERN =
  "https://cdn.jsdelivr.net/npm/@fasterfixes/widget@*/dist/recorder.iife.js";

/**
 * Serves the recorder file from the workspace build in place of the CDN, so
 * the suite never reaches jsDelivr. Returns the URL of every request for it.
 */
export async function routeRecorderFile(page: Page) {
  const requested: string[] = [];
  const file = readWidgetFile("dist/recorder.iife.js");
  await page.route(RECORDER_FILE_PATTERN, (route) => {
    requested.push(route.request().url());
    return route.fulfill({
      status: 200,
      contentType: "text/javascript; charset=utf-8",
      body: file,
    });
  });
  return requested;
}
