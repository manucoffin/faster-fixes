import { FasterFixesClient, resolveReviewerToken } from "@fasterfixes/core";

import { createWidget } from "./create-widget.js";
import { createDeferredWidget, createInertWidget } from "./instance.js";
import type { Widget } from "./instance.js";
import { validateOptions } from "./options.js";
import type { WidgetOptions } from "./options.js";

let current: Widget | null = null;

function start(input: unknown): Widget {
  const result = validateOptions(input);
  if (!result.valid) return createInertWidget();

  const reviewerToken = resolveReviewerToken();
  if (!reviewerToken) return createInertWidget();

  const { projectId, ...options } = result.options;
  const client = new FasterFixesClient({
    apiKey: projectId,
    apiOrigin: options.apiOrigin,
  });
  const deferred = createDeferredWidget();

  client
    .getConfig()
    .then((config) => {
      // A later `init` or `destroy` may have landed while the request ran.
      if (deferred.destroyed) return;
      deferred.attach(
        createWidget({ ...options, client, reviewerToken, config }),
      );
    })
    .catch(() => {
      // Config fetch failed: the Widget stays unmounted, like the React Embed
    });

  return deferred.widget;
}

/**
 * Installs the Widget on the page. It mounts only when a Reviewer token is
 * present and the Project has the Widget enabled. Calling `init` again
 * destroys the previous instance first.
 */
export function init(options: WidgetOptions): Widget {
  current?.destroy();
  current = start(options);
  return current;
}
