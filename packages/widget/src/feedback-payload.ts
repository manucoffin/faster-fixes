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
  /** The clicked element, or the container of an area (ADR-0026). */
  element: Element;
  /** Where the Pin goes: the click, or the area's top-left corner. */
  pinPoint: PinPoint;
  /** Measured at Selection, unlike the rest of the payload. */
  selection: SelectionGeometry;
  diagnosticTrail: DiagnosticTrail | undefined;
  customMetadata: WidgetOptions["customMetadata"];
};

/** The create request body for a comment on `element`, read at submit time. */
export function buildFeedbackPayload({
  comment,
  element,
  pinPoint,
  selection,
  diagnosticTrail,
  customMetadata,
}: FeedbackPayloadInput): CreateFeedbackData {
  const isArea = "area" in selection;
  const selectors = generateSelectors(element);
  const { nearbyText, ...context } = captureElementContext(
    element,
    selectors.strategies,
  );
  const metadata: Record<string, unknown> = {
    ...context,
    // A container's text is not what an area is about.
    ...(!isArea && { nearbyText }),
    selection,
  };

  const pinAnchor = computePinAnchor(element.getBoundingClientRect(), pinPoint);
  if (pinAnchor) {
    metadata.pinAnchor = pinAnchor;
    metadata.pinPlacement = createPinPlacementMetadata(
      getViewportAnchoringKind(element),
      pinPoint,
      { x: window.scrollX, y: window.scrollY },
    );
  }

  const resolvedCustomMetadata = resolveCustomMetadata(customMetadata);

  return {
    comment,
    pageUrl: window.location.href,
    selector: selectors.best,
    ...(!isArea && { clickX: pinPoint.x, clickY: pinPoint.y }),
    metadata,
    diagnosticTrail,
    ...getBrowserInfo(),
    ...(resolvedCustomMetadata && { customMetadata: resolvedCustomMetadata }),
  };
}
