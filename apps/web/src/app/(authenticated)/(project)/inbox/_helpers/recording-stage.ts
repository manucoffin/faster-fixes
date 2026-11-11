import type {
  DashboardMessage,
  PlayerMessage,
  RecordingPlayerState,
} from "@/app/_domains/feedback/_helpers/recording-player-protocol";

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
};

export const INITIAL_RECORDING_STAGE: RecordingStage = {
  status: "loading",
  state: "paused",
  time: 0,
  duration: 0,
};

export function reduceRecordingStage(
  stage: RecordingStage,
  message: PlayerMessage,
): RecordingStage {
  if (stage.status === "unplayable") return stage;

  switch (message.type) {
    case "failed":
      return { ...stage, status: "unplayable", state: "paused" };
    case "loaded":
      return { ...stage, status: "loaded", duration: message.duration };
    case "time":
      return { ...stage, time: message.time };
    case "state":
      return { ...stage, state: message.state };
    case "ready":
    case "resourcesMissing":
      return stage;
  }
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
