import "@rrweb/replay/dist/style.css";

import { Replayer } from "@rrweb/replay";

import {
  buildPlayerMessage,
  type PlayerMessage,
  parseDashboardMessage,
  type RecordingPlayerEvent,
} from "@/app/_domains/feedback/_helpers/recording-player-protocol";

/**
 * The script of the player document (ADR-0023), bundled with the replayer by
 * `pnpm build:recording-player`. It plays the events the framing page posts
 * and reports the playhead back, and holds no data of its own.
 */

type ReplayerEvents = ConstructorParameters<typeof Replayer>[0];

const stage = document.getElementById("stage");
let replayer: Replayer | null = null;
let recordedViewport: { width: number; height: number } | null = null;
let playing = false;

function send(message: PlayerMessage) {
  window.parent.postMessage(
    buildPlayerMessage(message),
    window.location.origin,
  );
}

// Scales the recorded viewport to fit the frame, keeping its proportions.
function fitStage() {
  if (!stage || !recordedViewport) return;
  const { width, height } = recordedViewport;
  const scale = Math.min(
    window.innerWidth / width,
    window.innerHeight / height,
  );
  stage.style.transform = `scale(${String(scale)})`;
  stage.style.left = `${String((window.innerWidth - width * scale) / 2)}px`;
  stage.style.top = `${String((window.innerHeight - height * scale) / 2)}px`;
}

function reportTime() {
  if (!replayer) return;
  const { totalTime } = replayer.getMetaData();
  send({
    type: "time",
    time: Math.max(0, Math.min(totalTime, replayer.getCurrentTime())),
  });
}

function reportTimeWhilePlaying() {
  if (!playing) return;
  reportTime();
  requestAnimationFrame(reportTimeWhilePlaying);
}

function load(events: RecordingPlayerEvent[]) {
  if (replayer || !stage) return;
  // The protocol checks the fields every event carries; rrweb reads the rest.
  replayer = new Replayer(events as ReplayerEvents, {
    root: stage,
    mouseTail: false,
    skipInactive: false,
  });
  replayer.on("resize", (dimension) => {
    recordedViewport = dimension as { width: number; height: number };
    fitStage();
  });
  replayer.on("finish", () => {
    playing = false;
    reportTime();
  });
  replayer.pause(0);
}

window.addEventListener("resize", fitStage);

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.source !== window.parent) return;
  const message = parseDashboardMessage(event.data);
  if (!message) return;

  switch (message.type) {
    case "listening":
      send({ type: "ready" });
      break;
    case "load":
      load(message.events);
      break;
    case "play":
      if (!replayer || playing) return;
      replayer.play(replayer.getCurrentTime());
      playing = true;
      reportTimeWhilePlaying();
      break;
    case "pause":
      if (!replayer) return;
      replayer.pause();
      playing = false;
      reportTime();
      break;
  }
});

send({ type: "ready" });
