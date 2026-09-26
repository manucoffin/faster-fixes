import type { WidgetPosition } from "@fasterfixes/core";

import { createIcon } from "./icons.js";
import type { IconName } from "./icons.js";
import type { ResolvedDisplayOptions } from "./options.js";

type ToolbarActions = {
  onStart: () => void;
  onExit: () => void;
};

export type Toolbar = {
  element: HTMLElement;
  /** Collapsed shows the start button, active shows the controls. */
  setActive: (active: boolean) => void;
};

function tooltipSide(position: WidgetPosition) {
  return position.includes("right") ? "left" : "right";
}

function createTooltip(document: Document, text: string, side: string) {
  const tooltip = document.createElement("span");
  tooltip.className = "tooltip";
  tooltip.dataset.side = side;
  tooltip.setAttribute("aria-hidden", "true");
  tooltip.textContent = text;
  return tooltip;
}

function createControl(
  document: Document,
  label: string,
  icon: IconName,
  side: string,
  onClick: () => void,
) {
  const control = document.createElement("button");
  control.type = "button";
  control.className = "control";
  control.setAttribute("aria-label", label);
  control.appendChild(createIcon(document, icon, 16));
  control.appendChild(createTooltip(document, label, side));
  control.addEventListener("click", onClick);
  return control;
}

/**
 * The floating button while idle; once feedback mode starts it becomes a
 * toolbar with its controls, the exit control nearest the screen edge.
 */
export function createToolbar(
  document: Document,
  { labels, position }: ResolvedDisplayOptions,
  { onStart, onExit }: ToolbarActions,
): Toolbar {
  const side = tooltipSide(position);
  const toolbar = document.createElement("div");
  toolbar.className = "toolbar";

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "button";
  trigger.setAttribute("part", "button");
  trigger.setAttribute("aria-label", labels.startFeedback);
  trigger.appendChild(createIcon(document, "message", 18));
  trigger.appendChild(createTooltip(document, labels.startFeedback, side));
  trigger.addEventListener("click", onStart);

  const controls = document.createElement("div");
  controls.className = "controls";
  controls.hidden = true;
  controls.appendChild(
    createControl(document, labels.exitFeedbackMode, "close", side, onExit),
  );

  toolbar.append(trigger, controls);

  return {
    element: toolbar,
    setActive(active) {
      const root = toolbar.getRootNode();
      const focusWasInside =
        root instanceof ShadowRoot && toolbar.contains(root.activeElement);
      trigger.hidden = active;
      controls.hidden = !active;
      // Keeps keyboard users on the toolbar when the button they pressed hides.
      if (focusWasInside) {
        (active ? controls.querySelector("button") : trigger)?.focus();
      }
    },
  };
}
