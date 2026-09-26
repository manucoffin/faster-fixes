import {
  captureElementContext,
  generateSelectors,
  getBrowserInfo,
} from "@fasterfixes/core";
import type { CreateFeedbackData, DiagnosticTrail } from "@fasterfixes/core";

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
  diagnosticTrail: DiagnosticTrail | undefined;
};

/** The create request body for a comment on `element`, read at submit time. */
export function buildFeedbackPayload({
  comment,
  element,
  click,
  diagnosticTrail,
}: FeedbackPayloadInput): CreateFeedbackData {
  const selectors = generateSelectors(element);
  const metadata: Record<string, unknown> = {
    ...captureElementContext(element, selectors.strategies),
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

  return {
    comment,
    pageUrl: window.location.href,
    selector: selectors.best,
    clickX: click.x,
    clickY: click.y,
    metadata,
    diagnosticTrail,
    ...getBrowserInfo(),
  };
}
