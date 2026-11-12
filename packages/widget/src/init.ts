import { FasterFixesClient, resolveReviewerToken } from "@fasterfixes/core";

import { createWidget } from "./create-widget.js";
import { createDeferredWidget, createInertWidget } from "./instance.js";
import type { Widget } from "./instance.js";
import { validateOptions } from "./options.js";
import type { WidgetOptions } from "./options.js";
import type { LoadRecorder } from "./recorder/contract.js";
import { whenBodyReady } from "./script-options.js";

let current: Widget | null = null;

function start(input: unknown, loadRecorder: LoadRecorder): Widget {
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
  // Fetched alongside the config; started at mount, if the Widget mounts.
  const recorder = options.captureRecording ? loadRecorder() : undefined;

  // The script tag may run in the head, before `document.body` exists.
  Promise.all([client.getConfig(), whenBodyReady(document)])
    .then(([config]) => {
      // A later `init` or `destroy` may have landed while the request ran.
      if (deferred.destroyed) return;
      deferred.attach(
        createWidget({ ...options, client, reviewerToken, config, recorder }),
      );
    })
    .catch(() => {
      // Config fetch failed: the Widget stays unmounted, like the React Embed
    });

  return deferred.widget;
}

/**
 * `init` with the way the recorder file is reached, which differs between the
 * script embed and a bundled import.
 */
export function startWidget(
  options: WidgetOptions,
  loadRecorder: LoadRecorder,
): Widget {
  current?.destroy();
  current = start(options, loadRecorder);
  return current;
}
