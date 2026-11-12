import type { eventWithTime, mutationData } from "@rrweb/types";

// What a Recording says about its page session, and what an rrweb event costs
// the buffer. Plain data in and out, so it is tested without a browser.

export type NavigationType = "load" | "reload" | "back_forward";

/**
 * How the page session started. `referrerPath` is set for a same-origin
 * referrer only: an external origin is never recorded.
 */
export type PageSessionMarker = {
  navigationType: NavigationType;
  referrerPath?: string;
};

/** The tag of the rrweb custom event that carries the marker in the file. */
export const PAGE_SESSION_TAG = "fasterfixes/page-session";

// rrweb's EventType values; `@rrweb/types` is a types-only dependency here.
const FULL_SNAPSHOT = 2;
const CUSTOM = 5;

export type PageSessionEvent = {
  type: typeof CUSTOM;
  timestamp: number;
  data: { tag: typeof PAGE_SESSION_TAG; payload: PageSessionMarker };
};

export function readPageSessionMarker({
  navigationType,
  referrer,
  origin,
}: {
  /** A `PerformanceNavigationTiming` type, or `back_forward` on a cache return. */
  navigationType: string | undefined;
  referrer: string;
  origin: string;
}): PageSessionMarker {
  const marker: PageSessionMarker = {
    navigationType:
      navigationType === "reload" || navigationType === "back_forward"
        ? navigationType
        : "load",
  };
  try {
    const url = new URL(referrer);
    // The path alone: a query string or a fragment may carry a token.
    if (url.origin === origin) marker.referrerPath = url.pathname;
  } catch {
    // No referrer, or not a URL.
  }
  return marker;
}

/**
 * The events with the marker right after the first full snapshot, so the file
 * still opens with rrweb's meta event and full snapshot.
 */
export function withPageSessionMarker<
  E extends { type: number; timestamp: number },
>(events: E[], marker: PageSessionMarker | null): (E | PageSessionEvent)[] {
  if (!marker || events.length === 0) return events;
  const snapshotIndex = events.findIndex(
    (event) => event.type === FULL_SNAPSHOT,
  );
  const anchor = events[Math.max(snapshotIndex, 0)] as E;
  const markerEvent: PageSessionEvent = {
    type: CUSTOM,
    timestamp: anchor.timestamp,
    data: { tag: PAGE_SESSION_TAG, payload: marker },
  };
  const at = snapshotIndex + 1;
  return [...events.slice(0, at), markerEvent, ...events.slice(at)];
}

// Only rrweb's mutation data carries `adds`.
function isMutation(data: unknown): data is mutationData {
  return typeof data === "object" && data !== null && "adds" in data;
}

/** Nodes added, removed or changed by a mutation event; zero for any other. */
export function countMutations(event: eventWithTime) {
  const { data } = event;
  if (!isMutation(data)) return 0;
  return (
    data.adds.length +
    data.removes.length +
    data.texts.length +
    data.attributes.length
  );
}
