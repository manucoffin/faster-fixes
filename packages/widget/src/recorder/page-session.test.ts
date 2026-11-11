import type { eventWithTime } from "@rrweb/types";
import { describe, expect, it } from "vitest";

import {
  countMutations,
  PAGE_SESSION_TAG,
  readPageSessionMarker,
  withPageSessionMarker,
} from "./page-session.js";

const ORIGIN = "https://shop.example";

describe("readPageSessionMarker", () => {
  it.each([
    ["navigate", "load"],
    ["reload", "reload"],
    ["back_forward", "back_forward"],
    ["prerender", "load"],
    [undefined, "load"],
  ])("reads the navigation type %s as %s", (navigationType, expected) => {
    expect(
      readPageSessionMarker({ navigationType, referrer: "", origin: ORIGIN }),
    ).toEqual({ navigationType: expected });
  });

  it("keeps the path of a same-origin referrer, without its query or fragment", () => {
    expect(
      readPageSessionMarker({
        navigationType: "navigate",
        referrer: `${ORIGIN}/cart?token=secret#step`,
        origin: ORIGIN,
      }),
    ).toEqual({ navigationType: "load", referrerPath: "/cart" });
  });

  it("never records an external referrer", () => {
    expect(
      readPageSessionMarker({
        navigationType: "navigate",
        referrer: "https://search.example/results?q=shop",
        origin: ORIGIN,
      }),
    ).toEqual({ navigationType: "load" });
  });
});

describe("withPageSessionMarker", () => {
  const events = [
    { type: 4, timestamp: 10 },
    { type: 2, timestamp: 11 },
    { type: 3, timestamp: 12 },
  ];

  it("places the marker right after the first full snapshot", () => {
    expect(
      withPageSessionMarker(events, {
        navigationType: "reload",
        referrerPath: "/",
      }),
    ).toEqual([
      events[0],
      events[1],
      {
        type: 5,
        timestamp: 11,
        data: {
          tag: PAGE_SESSION_TAG,
          payload: { navigationType: "reload", referrerPath: "/" },
        },
      },
      events[2],
    ]);
  });

  it("leaves the events as they are without a marker", () => {
    expect(withPageSessionMarker(events, null)).toBe(events);
  });

  it("adds nothing to an empty Recording", () => {
    expect(withPageSessionMarker([], { navigationType: "load" })).toEqual([]);
  });
});

describe("countMutations", () => {
  it("counts the nodes a mutation adds, removes or changes", () => {
    const mutation = {
      type: 3,
      timestamp: 0,
      data: {
        source: 0,
        adds: [{}, {}, {}],
        removes: [{}],
        texts: [{}, {}],
        attributes: [{}],
      },
    } as unknown as eventWithTime;
    expect(countMutations(mutation)).toBe(7);
  });

  it("counts nothing for any other event", () => {
    const scroll = {
      type: 3,
      timestamp: 0,
      data: { source: 3, id: 1, x: 0, y: 10 },
    } as unknown as eventWithTime;
    const meta = {
      type: 4,
      timestamp: 0,
      data: { href: ORIGIN, width: 1, height: 1 },
    } as unknown as eventWithTime;
    expect(countMutations(scroll)).toBe(0);
    expect(countMutations(meta)).toBe(0);
  });
});
