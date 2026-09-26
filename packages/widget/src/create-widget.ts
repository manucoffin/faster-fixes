import type { FeedbackClient, WidgetConfig } from "@fasterfixes/core";

import { createInertWidget } from "./instance.js";
import type { Widget } from "./instance.js";
import { mountWidget } from "./mount.js";
import { validateDisplayOptions } from "./options.js";
import type { DisplayOptions } from "./options.js";
import { shouldMount } from "./visibility.js";

export type CreateWidgetOptions = DisplayOptions & {
  client: FeedbackClient;
  reviewerToken: string;
  config: WidgetConfig;
};

/**
 * @unstable Internal API. No semver guarantees. May change or be removed in
 * any release.
 *
 * Runs the Widget against an injected `client`, with the Reviewer token and
 * config already resolved. The public `init` resolves both, then calls this.
 */
export function createWidget(input: CreateWidgetOptions): Widget {
  const { reviewerToken, config } = input;
  const result = validateDisplayOptions(input);
  if (
    !result.valid ||
    typeof document === "undefined" ||
    !shouldMount(reviewerToken, config)
  ) {
    return createInertWidget();
  }
  return mountWidget(result.options);
}
