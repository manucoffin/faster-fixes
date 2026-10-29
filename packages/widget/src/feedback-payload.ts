import {
  captureElementContext,
  generateSelectors,
  getBrowserInfo,
} from "@fasterfixes/core";
import type {
  CreateFeedbackData,
  DiagnosticTrail,
  SelectionGeometry,
} from "@fasterfixes/core";

import { resolveCustomMetadata } from "./custom-metadata.js";
import type { WidgetOptions } from "./options.js";
import {
  computePinAnchor,
  createPinPlacementMetadata,
  getViewportAnchoringKind,
} from "./pin-placement.js";
import type { PinPoint } from "./pin-placement.js";

type FeedbackPayloadInput = {
  comment: string;
  element: Element;
  click: PinPoint;
  /** Measured at Selection, unlike the rest of the payload. */
  selection: SelectionGeometry;
  diagnosticTrail: DiagnosticTrail | undefined;
  customMetadata: WidgetOptions["customMetadata"];
};

/** The create request body for a comment on `element`, read at submit time. */
export function buildFeedbackPayload({
  comment,
  element,
  click,
  selection,
  diagnosticTrail,
  customMetadata,
}: FeedbackPayloadInput): CreateFeedbackData {
  const selectors = generateSelectors(element);
  const metadata: Record<string, unknown> = {
    ...captureElementContext(element, selectors.strategies),
    selection,
  };

  const pinAnchor = computePinAnchor(element.getBoundingClientRect(), click);
  if (pinAnchor) {
    metadata.pinAnchor = pinAnchor;
    metadata.pinPlacement = createPinPlacementMetadata(
      getViewportAnchoringKind(element),
      click,
      { x: window.scrollX, y: window.scrollY },
    );
  }

  const resolvedCustomMetadata = resolveCustomMetadata(customMetadata);

  return {
    comment,
    pageUrl: window.location.href,
    selector: selectors.best,
    clickX: click.x,
    clickY: click.y,
    metadata,
    diagnosticTrail,
    ...getBrowserInfo(),
    ...(resolvedCustomMetadata && { customMetadata: resolvedCustomMetadata }),
  };
}
