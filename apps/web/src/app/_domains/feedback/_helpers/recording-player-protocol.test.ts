import { describe, expect, it } from "vitest";

import {
  buildDashboardMessage,
  buildPlayerMessage,
  parseDashboardMessage,
  parsePlayerMessage,
} from "./recording-player-protocol";

const EVENTS = [
  { type: 4, timestamp: 1_000, data: { width: 1280, height: 720 } },
  { type: 2, timestamp: 1_001, data: {} },
];

describe("parseDashboardMessage", () => {
  it.each([
    buildDashboardMessage({ type: "listening" }),
    buildDashboardMessage({ type: "play" }),
    buildDashboardMessage({ type: "pause" }),
  ])("accepts %o", (message) => {
    expect(parseDashboardMessage(message)).toEqual(message);
  });

  it("accepts load with the events and keeps their own fields", () => {
    const message = buildDashboardMessage({ type: "load", events: EVENTS });

    expect(parseDashboardMessage(message)).toEqual(message);
  });

  it.each([
    ["no channel", { type: "play" }],
    ["another channel", { channel: "other", type: "play" }],
    [
      "an unknown type",
      { channel: "fasterfixes/recording-player", type: "stop" },
    ],
    ["a player message", buildPlayerMessage({ type: "ready" })],
    [
      "load without events",
      { channel: "fasterfixes/recording-player", type: "load" },
    ],
    [
      "load with an event lacking a timestamp",
      {
        channel: "fasterfixes/recording-player",
        type: "load",
        events: [{ type: 2 }],
      },
    ],
    ["a string", "play"],
    ["null", null],
  ])("rejects %s", (_, data) => {
    expect(parseDashboardMessage(data)).toBeNull();
  });
});

describe("parsePlayerMessage", () => {
  it.each([
    buildPlayerMessage({ type: "ready" }),
    buildPlayerMessage({ type: "time", time: 0 }),
    buildPlayerMessage({ type: "time", time: 4_250.5 }),
  ])("accepts %o", (message) => {
    expect(parsePlayerMessage(message)).toEqual(message);
  });

  it.each([
    ["no channel", { type: "ready" }],
    [
      "a negative time",
      { channel: "fasterfixes/recording-player", type: "time", time: -1 },
    ],
    [
      "a time that is not a number",
      { channel: "fasterfixes/recording-player", type: "time", time: "1" },
    ],
    ["a dashboard message", buildDashboardMessage({ type: "listening" })],
    ["undefined", undefined],
  ])("rejects %s", (_, data) => {
    expect(parsePlayerMessage(data)).toBeNull();
  });
});
