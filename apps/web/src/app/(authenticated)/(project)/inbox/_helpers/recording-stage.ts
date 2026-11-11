import type { RecordingFileRefusal } from "@/app/_domains/feedback/_helpers/read-recording-file";
import type {
  DashboardMessage,
  PlayerMessage,
  RecordingPlayerEvent,
  RecordingPlayerState,
} from "@/app/_domains/feedback/_helpers/recording-player-protocol";

/** How long the player document has to answer the handshake. */
export const RECORDING_HANDSHAKE_TIMEOUT_MS = 10_000;

/** Why a Recording cannot be played. Every cause shows the same notice. */
export type RecordingUnplayableCause =
  | "not-fetched"
  // The server's own read of the file failed, so the dashboard skips its own.
  | "unreadable-on-server"
  | RecordingFileRefusal
  | "player-failed"
  | "no-handshake";

/** The Recording file as the dashboard fetched and read it. */
export type RecordingFile =
  | { readable: true; events: RecordingPlayerEvent[] }
  | {
      readable: false;
      cause: Extract<
        RecordingUnplayableCause,
        "not-fetched" | "unreadable-on-server" | RecordingFileRefusal
      >;
    };

/**
 * What the dashboard knows of the player document while a Recording plays,
 * folded from the player's messages. `unplayable` is final: once the player
 * has failed, nothing it says brings the stage back.
 */
export type RecordingStage = {
  status: "loading" | "loaded" | "unplayable";
  state: RecordingPlayerState;
  time: number;
  duration: number;
  /** Whether the player document has answered the handshake. */
  isAnswered: boolean;
  /** Whether an image or a font of the replayed page failed. Never reset. */
  isResourceMissing: boolean;
  cause: RecordingUnplayableCause | null;
};

export const INITIAL_RECORDING_STAGE: RecordingStage = {
  status: "loading",
  state: "paused",
  time: 0,
  duration: 0,
  isAnswered: false,
  isResourceMissing: false,
  cause: null,
};

/** A player message, or the dashboard's own timer on the handshake. */
export type RecordingStageAction = PlayerMessage | { type: "handshakeTimeout" };

export function reduceRecordingStage(
  stage: RecordingStage,
  action: RecordingStageAction,
): RecordingStage {
  if (stage.status === "unplayable") return stage;

  switch (action.type) {
    case "handshakeTimeout":
      return stage.isAnswered ? stage : unplayable(stage, "no-handshake");
    case "failed":
      return unplayable({ ...stage, isAnswered: true }, "player-failed");
    case "ready":
      return { ...stage, isAnswered: true };
    case "loaded":
      return {
        ...stage,
        isAnswered: true,
        status: "loaded",
        duration: action.duration,
      };
    case "time":
      return { ...stage, time: action.time };
    case "state":
      return { ...stage, state: action.state };
    case "resourcesMissing":
      return { ...stage, isResourceMissing: true };
  }
}

function unplayable(
  stage: RecordingStage,
  cause: RecordingUnplayableCause,
): RecordingStage {
  return { ...stage, status: "unplayable", state: "paused", cause };
}

/**
 * What the player shows for a Recording file and the player document's
 * stage: the notice replaces the stage for every cause, and the line on
 * missing fonts or images only shows on a stage that still plays.
 */
export function viewRecordingStage(
  file: RecordingFile | undefined,
  stage: RecordingStage,
): {
  status: RecordingStage["status"];
  cause: RecordingUnplayableCause | null;
  areControlsEnabled: boolean;
  isResourceNoticeShown: boolean;
} {
  if (file && !file.readable) {
    return {
      status: "unplayable",
      cause: file.cause,
      areControlsEnabled: false,
      isResourceNoticeShown: false,
    };
  }
  // Until the file is read, the player document has nothing to play.
  const status = file ? stage.status : "loading";
  return {
    status,
    cause: stage.cause,
    areControlsEnabled: status === "loaded",
    isResourceNoticeShown: status !== "unplayable" && stage.isResourceMissing,
  };
}

/**
 * What the dashboard answers a player message with. A loaded Recording is
 * sent to its last instant, the one the Screenshot shows.
 */
export function answerPlayerMessage(
  message: PlayerMessage,
): DashboardMessage[] {
  return message.type === "loaded"
    ? [{ type: "seek", time: message.duration }]
    : [];
}

/** The messages one press of the play and pause button sends. */
export function togglePlayback(stage: RecordingStage): DashboardMessage[] {
  if (stage.status !== "loaded") return [];
  if (stage.state === "playing") return [{ type: "pause" }];
  // From the last instant, playing starts over rather than ending at once.
  if (stage.time >= stage.duration) {
    return [{ type: "seek", time: 0 }, { type: "play" }];
  }
  return [{ type: "play" }];
}

/** The playback rates the player offers, where 1 is the recorded pace. */
export const RECORDING_SPEEDS = [1, 2, 4] as const;

export type RecordingSpeed = (typeof RECORDING_SPEEDS)[number];

/** The messages a seek on the timeline sends, clamped to the Recording. */
export function seekRecording(
  stage: RecordingStage,
  time: number,
): DashboardMessage[] {
  if (stage.status !== "loaded") return [];
  return [{ type: "seek", time: Math.min(stage.duration, Math.max(0, time)) }];
}

/**
 * Whether the Selection frame is drawn over the stage. The Selection was made
 * on the last instant only, so anywhere else it would mark a place the
 * Reviewer did not select.
 */
export function isSelectionFrameShown(stage: RecordingStage): boolean {
  return stage.status === "loaded" && stage.time >= stage.duration;
}
