import type { FeedbackClient, WidgetConfig } from "@fasterfixes/core";

import { createInertWidget } from "./instance.js";
import type { Widget } from "./instance.js";
import { mountWidget } from "./mount.js";
import { validateDisplayOptions } from "./options.js";
import type { DisplayOptions } from "./options.js";
import type { RecorderModule } from "./recorder/contract.js";
import { shouldMount } from "./visibility.js";

export type CreateWidgetOptions = DisplayOptions & {
  client: FeedbackClient;
  reviewerToken: string;
  config: WidgetConfig;
  /** The recorder file, started at mount. Without it there is no Recording. */
  recorder?: Promise<RecorderModule | null>;
};

/**
 * @unstable Internal API. No semver guarantees. May change or be removed in
 * any release.
 *
 * Runs the Widget against an injected `client`, with the Reviewer token and
 * config already resolved. The public `init` resolves both, then calls this.
 */
export function createWidget(input: CreateWidgetOptions): Widget {
  const { client, reviewerToken, config, recorder } = input;
  const result = validateDisplayOptions(input);
  if (
    !result.valid ||
    typeof document === "undefined" ||
    !shouldMount(reviewerToken, config)
  ) {
    return createInertWidget();
  }
  return mountWidget({
    options: result.options,
    client,
    reviewerToken,
    branding: config.branding,
    recorder,
  });
}
