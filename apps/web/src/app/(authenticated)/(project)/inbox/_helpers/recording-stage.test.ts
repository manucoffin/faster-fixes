import type { PlayerMessage } from "@/app/_domains/feedback/_helpers/recording-player-protocol";
import { describe, expect, it } from "vitest";
import {
  answerPlayerMessage,
  INITIAL_RECORDING_STAGE,
  type RecordingStage,
  reduceRecordingStage,
  seekRecording,
  togglePlayback,
} from "./recording-stage";

const VIEWPORT = { width: 1280, height: 800 };

function fold(messages: PlayerMessage[]) {
  return messages.reduce(reduceRecordingStage, INITIAL_RECORDING_STAGE);
}

const loaded: RecordingStage = {
  status: "loaded",
  state: "paused",
  time: 12_000,
  duration: 12_000,
};

describe("reduceRecordingStage", () => {
  it("is loading until the player reports it has loaded", () => {
    expect(fold([{ type: "ready" }]).status).toBe("loading");
    expect(
      fold([
        { type: "ready" },
        { type: "loaded", duration: 12_000, viewport: VIEWPORT },
      ]),
    ).toEqual({ status: "loaded", state: "paused", time: 0, duration: 12_000 });
  });

  it("follows the playhead and the player's state", () => {
    expect(
      fold([
        { type: "loaded", duration: 12_000, viewport: VIEWPORT },
        { type: "state", state: "playing" },
        { type: "time", time: 4_000 },
      ]),
    ).toMatchObject({ state: "playing", time: 4_000 });
  });

  it("is unplayable when the player fails, and stays so", () => {
    expect(
      fold([
        { type: "loaded", duration: 12_000, viewport: VIEWPORT },
        { type: "state", state: "playing" },
        { type: "failed" },
        { type: "state", state: "playing" },
        { type: "loaded", duration: 12_000, viewport: VIEWPORT },
      ]),
    ).toMatchObject({ status: "unplayable", state: "paused" });
  });
});

describe("answerPlayerMessage", () => {
  it("sends a loaded Recording to its last instant", () => {
    expect(
      answerPlayerMessage({
        type: "loaded",
        duration: 12_000,
        viewport: VIEWPORT,
      }),
    ).toEqual([{ type: "seek", time: 12_000 }]);
  });

  it("answers nothing else", () => {
    expect(answerPlayerMessage({ type: "time", time: 3 })).toEqual([]);
    expect(answerPlayerMessage({ type: "failed" })).toEqual([]);
  });
});

describe("togglePlayback", () => {
  it("does nothing until the Recording has loaded, or once it cannot play", () => {
    expect(togglePlayback(INITIAL_RECORDING_STAGE)).toEqual([]);
    expect(togglePlayback({ ...loaded, status: "unplayable" })).toEqual([]);
  });

  it("pauses while playing", () => {
    expect(togglePlayback({ ...loaded, state: "playing", time: 3 })).toEqual([
      { type: "pause" },
    ]);
  });

  it("plays from the playhead", () => {
    expect(togglePlayback({ ...loaded, time: 3_000 })).toEqual([
      { type: "play" },
    ]);
  });

  it("starts over from the last instant", () => {
    expect(togglePlayback(loaded)).toEqual([
      { type: "seek", time: 0 },
      { type: "play" },
    ]);
    expect(togglePlayback({ ...loaded, state: "ended" })).toEqual([
      { type: "seek", time: 0 },
      { type: "play" },
    ]);
  });
});

describe("seekRecording", () => {
  it("seeks to the time asked for", () => {
    expect(seekRecording(loaded, 4_500)).toEqual([
      { type: "seek", time: 4_500 },
    ]);
  });

  it("keeps the playhead within the Recording", () => {
    expect(seekRecording(loaded, -20)).toEqual([{ type: "seek", time: 0 }]);
    expect(seekRecording(loaded, 99_000)).toEqual([
      { type: "seek", time: 12_000 },
    ]);
  });

  it("does nothing until the Recording has loaded, or once it cannot play", () => {
    expect(seekRecording(INITIAL_RECORDING_STAGE, 10)).toEqual([]);
    expect(seekRecording({ ...loaded, status: "unplayable" }, 10)).toEqual([]);
  });
});
