import { normalizeCustomMetadata } from "@fasterfixes/core";
import type { CustomMetadata } from "@fasterfixes/core";

import { isDevelopment } from "./environment.js";
import type { WidgetOptions } from "./options.js";

function warn(message: string, err?: unknown) {
  if (!isDevelopment()) return;
  if (err === undefined) console.warn(`[faster-fixes] ${message}`);
  else console.warn(`[faster-fixes] ${message}`, err);
}

/**
 * The Custom metadata to send with a Feedback, read at submit time so a
 * function option reflects the host app's current state. Never throws: a
 * failing function yields no Custom metadata rather than a lost Feedback.
 */
export function resolveCustomMetadata(
  option: WidgetOptions["customMetadata"],
): CustomMetadata | undefined {
  if (option === undefined) return undefined;

  let input: unknown = option;
  if (typeof option === "function") {
    try {
      input = option();
    } catch (err) {
      warn("customMetadata threw; the Feedback was sent without it.", err);
      return undefined;
    }
  }

  const { customMetadata, warnings } = normalizeCustomMetadata(input);
  for (const warning of warnings) warn(warning.message);
  return Object.keys(customMetadata).length > 0 ? customMetadata : undefined;
}
