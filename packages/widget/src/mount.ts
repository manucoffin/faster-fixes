import { createDiagnosticsRecorder } from "@fasterfixes/core";
import type { DiagnosticsRecorder, WidgetPosition } from "@fasterfixes/core";

import type { Widget } from "./instance.js";
import type { ResolvedDisplayOptions } from "./options.js";
import { getPositionStyle } from "./position.js";
import { WIDGET_CSS } from "./styles.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function createMessageIcon(document: Document) {
  const svg = document.createElementNS(SVG_NS, "svg");
  for (const [name, value] of Object.entries({
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  })) {
    svg.setAttribute(name, value);
  }
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute(
    "d",
    "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  );
  svg.appendChild(path);
  return svg;
}

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

function createFloatingButton(
  document: Document,
  options: ResolvedDisplayOptions,
) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button";
  button.setAttribute("part", "button");
  button.setAttribute("aria-label", options.labels.startFeedback);
  button.appendChild(createMessageIcon(document));

  const tooltip = document.createElement("span");
  tooltip.className = "tooltip";
  tooltip.dataset.side = options.position.includes("right") ? "left" : "right";
  tooltip.setAttribute("aria-hidden", "true");
  tooltip.textContent = options.labels.startFeedback;
  button.appendChild(tooltip);

  return button;
}

/**
 * Renders the Widget into an open shadow root on a light-DOM host appended to
 * `document.body`. The caller has already decided the Widget should mount.
 */
export function mountWidget(options: ResolvedDisplayOptions): Widget {
  const host = document.createElement("div");
  host.setAttribute("data-ff-widget", "");
  host.style.setProperty("--ff-accent", options.color);

  const shadow = host.attachShadow({ mode: "open" });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(WIDGET_CSS);
  shadow.adoptedStyleSheets = [sheet];

  const stack = document.createElement("div");
  stack.className = "stack";
  applyStackLayout(stack, options.position);
  stack.appendChild(createFloatingButton(document, options));
  shadow.appendChild(stack);

  // Starts at mount, stops on destroy: an opted-out site never patches globals.
  let recorder: DiagnosticsRecorder | null = null;
  if (options.captureDiagnostics) {
    recorder = createDiagnosticsRecorder({ apiOrigin: options.apiOrigin });
    recorder.start();
  }

  let visible = true;
  let destroyed = false;
  document.body.appendChild(host);

  return {
    show() {
      if (destroyed || visible) return;
      visible = true;
      document.body.appendChild(host);
    },
    hide() {
      if (destroyed || !visible) return;
      visible = false;
      host.remove();
    },
    get isVisible() {
      return visible && !destroyed;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      recorder?.stop();
      recorder = null;
      host.remove();
    },
  };
}
