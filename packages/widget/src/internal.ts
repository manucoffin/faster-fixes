/**
 * @unstable Internal API. No semver guarantees. May change or be removed in
 * any release. Runs the Widget against a custom `FeedbackClient`, for
 * example a localStorage backend for a demo or end-to-end tests.
 */
export { createWidget } from "./create-widget.js";
export type { CreateWidgetOptions } from "./create-widget.js";
export type { Widget } from "./instance.js";

export type { FeedbackClient } from "@fasterfixes/core";
