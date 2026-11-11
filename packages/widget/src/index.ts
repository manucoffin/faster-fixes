import { startWidget } from "./init.js";
import type { Widget } from "./instance.js";
import type { WidgetOptions } from "./options.js";
import { importRecorder } from "./recorder/import-loader.js";

export type { Widget } from "./instance.js";
export type { WidgetOptions } from "./options.js";

/**
 * Installs the Widget on the page. It mounts only when a Reviewer token is
 * present and the Project has the Widget enabled. Calling `init` again
 * destroys the previous instance first.
 */
export function init(options: WidgetOptions): Widget {
  return startWidget(options, importRecorder);
}

export type {
  CustomMetadata,
  CustomMetadataValue,
  Labels,
  WidgetPosition,
} from "@fasterfixes/core";
