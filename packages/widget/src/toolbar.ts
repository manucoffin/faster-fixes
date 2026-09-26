import type { WidgetPosition } from "@fasterfixes/core";

import { createIcon } from "./icons.js";
import type { IconName } from "./icons.js";
import type { ResolvedDisplayOptions } from "./options.js";

type ToolbarActions = {
  onStart: () => void;
  onExit: () => void;
  onTogglePins: () => void;
};

export type Toolbar = {
  element: HTMLElement;
  /** Collapsed shows the start button, active shows the controls. */
  setActive: (active: boolean) => void;
  /** Reflects whether pins are shown in the markers control. */
  setPinsShown: (shown: boolean) => void;
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
  control.addEventListener("click", onClick);
  const tooltip = createTooltip(document, label, side);
  control.append(createIcon(document, icon, 16), tooltip);

  function setContent(nextLabel: string, nextIcon: IconName) {
    control.setAttribute("aria-label", nextLabel);
    tooltip.textContent = nextLabel;
    control.firstChild?.replaceWith(createIcon(document, nextIcon, 16));
  }
  control.setAttribute("aria-label", label);
  return { control, setContent };
}

/**
 * The floating button while idle; once feedback mode starts it becomes a
 * toolbar with its controls, the exit control nearest the screen edge.
 */
export function createToolbar(
  document: Document,
  { labels, position }: ResolvedDisplayOptions,
  { onStart, onExit, onTogglePins }: ToolbarActions,
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
  const exit = createControl(
    document,
    labels.exitFeedbackMode,
    "close",
    side,
    onExit,
  );
  const markers = createControl(
    document,
    labels.hideMarkers,
    "eye",
    side,
    onTogglePins,
  );
  controls.append(
    ...(position.includes("top")
      ? [exit.control, markers.control]
      : [markers.control, exit.control]),
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
        (active ? exit.control : trigger).focus();
      }
    },
    setPinsShown(shown) {
      markers.setContent(
        shown ? labels.hideMarkers : labels.showMarkers,
        shown ? "eye" : "eyeOff",
      );
      markers.control.classList.toggle("control-pressed", !shown);
    },
  };
}
