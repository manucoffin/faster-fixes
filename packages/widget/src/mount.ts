import { createDiagnosticsRecorder } from "@fasterfixes/core";
import type {
  DiagnosticsRecorder,
  FeedbackClient,
  WidgetPosition,
} from "@fasterfixes/core";

import { createAnnotationMode } from "./annotation.js";
import { createCommentPopover } from "./comment-popover.js";
import { buildFeedbackPayload } from "./feedback-payload.js";
import type { Widget } from "./instance.js";
import type { ResolvedDisplayOptions } from "./options.js";
import type { PinPoint } from "./pin-placement.js";
import { getPositionStyle } from "./position.js";
import { WIDGET_CSS } from "./styles.js";
import { createToolbar } from "./toolbar.js";

type MountInput = {
  options: ResolvedDisplayOptions;
  client: FeedbackClient;
  reviewerToken: string;
};

// `selected` covers the comment popover in every state: typing, submitting, error.
type WidgetMode = "idle" | "annotating" | "selected";

function stackAlignment(position: WidgetPosition) {
  if (position.includes("bottom")) return "flex-end";
  if (position.includes("top")) return "flex-start";
  return "center";
}

// The stack hugs the screen edge it is anchored to, and grows away from it.
function applyStackLayout(stack: HTMLElement, position: WidgetPosition) {
  Object.assign(stack.style, getPositionStyle(position));
  stack.style.flexDirection = position.includes("right")
    ? "row-reverse"
    : "row";
  stack.style.alignItems = stackAlignment(position);
}

/**
 * Renders the Widget into an open shadow root on a light-DOM host appended to
 * `document.body`. The caller has already decided the Widget should mount.
 */
export function mountWidget({
  options,
  client,
  reviewerToken,
}: MountInput): Widget {
  const host = document.createElement("div");
  host.setAttribute("data-ff-widget", "");
  host.style.setProperty("--ff-accent", options.color);

  const shadow = host.attachShadow({ mode: "open" });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(WIDGET_CSS);
  shadow.adoptedStyleSheets = [sheet];

  // Starts at mount, stops on destroy: an opted-out site never patches globals.
  let recorder: DiagnosticsRecorder | null = null;
  if (options.captureDiagnostics) {
    recorder = createDiagnosticsRecorder({ apiOrigin: options.apiOrigin });
    recorder.start();
  }

  let mode: WidgetMode = "idle";
  let selection: { element: Element; click: PinPoint } | null = null;

  function setMode(next: WidgetMode) {
    mode = next;
    toolbar.setActive(next !== "idle");
    if (next === "annotating") annotation.start();
    else annotation.stop();
    if (next !== "selected") {
      selection = null;
      popover.close();
    }
  }

  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.setAttribute("part", "overlay");
  overlay.hidden = true;

  const annotation = createAnnotationMode(document, overlay, {
    onSelect(element, click) {
      setMode("selected");
      selection = { element, click };
      popover.open(element);
    },
    onCancel: () => setMode("idle"),
  });

  const popover = createCommentPopover(document, shadow, options.labels, {
    async onSubmit(comment) {
      if (!selection) return;
      await client.createFeedback(
        buildFeedbackPayload({
          comment,
          element: selection.element,
          click: selection.click,
          diagnosticTrail: recorder?.snapshot(),
        }),
        reviewerToken,
      );
    },
    onClose() {
      if (mode === "selected") setMode("idle");
    },
  });

  const toolbar = createToolbar(document, options, {
    onStart: () => setMode("annotating"),
    onExit: () => setMode("idle"),
  });

  const stack = document.createElement("div");
  stack.className = "stack";
  applyStackLayout(stack, options.position);
  stack.appendChild(toolbar.element);
  shadow.append(overlay, stack);

  let visible = true;
  let destroyed = false;
  document.body.appendChild(host);

  function show() {
    if (destroyed || visible) return;
    visible = true;
    document.body.appendChild(host);
  }

  return {
    show,
    hide() {
      if (destroyed || !visible) return;
      visible = false;
      setMode("idle");
      host.remove();
    },
    get isVisible() {
      return visible && !destroyed;
    },
    startAnnotation() {
      if (destroyed) return;
      show();
      setMode("annotating");
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      setMode("idle");
      recorder?.stop();
      recorder = null;
      host.remove();
    },
  };
}
