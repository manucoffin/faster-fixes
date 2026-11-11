import { describe, expect, it } from "vitest";
import {
  answerPlayerMessage,
  INITIAL_RECORDING_STAGE,
  isSelectionFrameShown,
  type RecordingFile,
  type RecordingStage,
  type RecordingStageAction,
  reduceRecordingStage,
  seekRecording,
  togglePlayback,
  viewRecordingStage,
} from "./recording-stage";

const VIEWPORT = { width: 1280, height: 800 };

function fold(messages: RecordingStageAction[]) {
  return messages.reduce(reduceRecordingStage, INITIAL_RECORDING_STAGE);
}

const loaded: RecordingStage = {
  ...INITIAL_RECORDING_STAGE,
  status: "loaded",
  isAnswered: true,
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
    ).toEqual({
      ...INITIAL_RECORDING_STAGE,
      status: "loaded",
      isAnswered: true,
      duration: 12_000,
    });
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
    ).toMatchObject({
      status: "unplayable",
      state: "paused",
      cause: "player-failed",
    });
  });

  it("is unplayable when the player never answers the handshake", () => {
    expect(fold([{ type: "handshakeTimeout" }])).toMatchObject({
      status: "unplayable",
      cause: "no-handshake",
    });
  });

  it("ignores the handshake timeout once the player has answered", () => {
    expect(fold([{ type: "ready" }, { type: "handshakeTimeout" }]).status).toBe(
      "loading",
    );
    expect(
      fold([
        { type: "loaded", duration: 12_000, viewport: VIEWPORT },
        { type: "handshakeTimeout" },
      ]).status,
    ).toBe("loaded");
  });

  it("keeps playing when a resource is missing, and remembers it", () => {
    expect(
      fold([
        { type: "loaded", duration: 12_000, viewport: VIEWPORT },
        { type: "state", state: "playing" },
        { type: "resourcesMissing" },
        { type: "time", time: 4_000 },
        { type: "state", state: "paused" },
      ]),
    ).toMatchObject({
      status: "loaded",
      state: "paused",
      time: 4_000,
      isResourceMissing: true,
    });
  });
});

describe("viewRecordingStage", () => {
  const readable: RecordingFile = { readable: true, events: [] };

  it("shows the loading state until the file is read", () => {
    expect(viewRecordingStage(undefined, loaded)).toEqual({
      status: "loading",
      cause: null,
      areControlsEnabled: false,
      isResourceNoticeShown: false,
    });
  });

  it("enables the controls once the Recording has loaded", () => {
    expect(viewRecordingStage(readable, INITIAL_RECORDING_STAGE)).toMatchObject(
      { status: "loading", areControlsEnabled: false },
    );
    expect(viewRecordingStage(readable, loaded)).toEqual({
      status: "loaded",
      cause: null,
      areControlsEnabled: true,
      isResourceNoticeShown: false,
    });
  });

  it.each([
    "not-fetched",
    "unreadable-on-server",
    "too-large",
    "not-gzip",
    "invalid-events",
    "unknown-format-version",
  ] as const)("shows the notice for a file refused as %s", (cause) => {
    expect(
      viewRecordingStage({ readable: false, cause }, INITIAL_RECORDING_STAGE),
    ).toEqual({
      status: "unplayable",
      cause,
      areControlsEnabled: false,
      isResourceNoticeShown: false,
    });
  });

  it.each([
    ["player-failed", { type: "failed" }],
    ["no-handshake", { type: "handshakeTimeout" }],
  ] as const)("shows the notice when the cause is %s", (cause, action) => {
    expect(viewRecordingStage(readable, fold([action]))).toEqual({
      status: "unplayable",
      cause,
      areControlsEnabled: false,
      isResourceNoticeShown: false,
    });
  });

  it("shows the line on a missing resource while the Recording plays", () => {
    expect(
      viewRecordingStage(readable, { ...loaded, isResourceMissing: true }),
    ).toMatchObject({ status: "loaded", isResourceNoticeShown: true });
    expect(
      viewRecordingStage(readable, fold([{ type: "resourcesMissing" }])),
    ).toMatchObject({ status: "loading", isResourceNoticeShown: true });
  });

  it("drops the line once the notice replaces the stage", () => {
    expect(
      viewRecordingStage(
        readable,
        fold([{ type: "resourcesMissing" }, { type: "failed" }]),
      ),
    ).toMatchObject({ status: "unplayable", isResourceNoticeShown: false });
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

describe("isSelectionFrameShown", () => {
  it("shows on the last instant, where the player opens", () => {
    expect(isSelectionFrameShown(loaded)).toBe(true);
  });

  it("shows when playback has ended on the last instant", () => {
    expect(isSelectionFrameShown({ ...loaded, state: "ended" })).toBe(true);
  });

  it("hides as soon as the playhead leaves the last instant", () => {
    expect(isSelectionFrameShown({ ...loaded, time: 11_999 })).toBe(false);
    expect(isSelectionFrameShown({ ...loaded, time: 0 })).toBe(false);
  });

  it("hides while playing towards the end", () => {
    expect(
      isSelectionFrameShown({ ...loaded, state: "playing", time: 6_000 }),
    ).toBe(false);
  });

  it("hides until the Recording has loaded", () => {
    expect(isSelectionFrameShown(INITIAL_RECORDING_STAGE)).toBe(false);
  });

  it("hides on a Recording that cannot be played", () => {
    expect(isSelectionFrameShown({ ...loaded, status: "unplayable" })).toBe(
      false,
    );
  });

  it("hides until the opening seek lands on the last instant", () => {
    const opened = fold([
      { type: "ready" },
      { type: "loaded", duration: 12_000, viewport: VIEWPORT },
    ]);
    expect(isSelectionFrameShown(opened)).toBe(false);
    expect(
      isSelectionFrameShown(
        reduceRecordingStage(opened, { type: "time", time: 12_000 }),
      ),
    ).toBe(true);
  });
});
