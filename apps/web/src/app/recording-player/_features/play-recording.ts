import "@rrweb/replay/dist/style.css";

import { Replayer } from "@rrweb/replay";

import {
  buildPlayerMessage,
  type PlayerMessage,
  parseDashboardMessage,
  type RecordingPlayerEvent,
  type RecordingPlayerState,
  type RecordingPlayerViewport,
} from "@/app/_domains/feedback/_helpers/recording-player-protocol";

import { readRecordingViewport } from "../_helpers/read-recording-viewport";

/**
 * The script of the player document (ADR-0023), bundled with the replayer by
 * `pnpm build:recording-player`. It plays the events the framing page posts,
 * reports the playhead and its state back, and holds no data of its own. A
 * Recording it cannot play is reported as failed, never thrown at the page.
 */

type ReplayerEvents = ConstructorParameters<typeof Replayer>[0];

const stage = document.getElementById("stage");
let replayer: Replayer | null = null;
let recordedViewport: RecordingPlayerViewport | null = null;
let duration = 0;
let speed = 1;
let state: RecordingPlayerState = "paused";
let failed = false;
let resourcesMissing = false;

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

function clampTime(time: number) {
  return Math.max(0, Math.min(duration, time));
}

function reportTime(time = replayer?.getCurrentTime() ?? 0) {
  send({ type: "time", time: state === "ended" ? duration : clampTime(time) });
}

function setState(next: RecordingPlayerState) {
  if (state === next) return;
  state = next;
  send({ type: "state", state });
}

function reportTimeWhilePlaying() {
  if (state !== "playing") return;
  reportTime();
  requestAnimationFrame(reportTimeWhilePlaying);
}

function reportResourcesMissing() {
  if (resourcesMissing || failed) return;
  resourcesMissing = true;
  send({ type: "resourcesMissing" });
}

// The replayed page lives in another realm, so its elements fail `instanceof`.
function reportFailedImage(event: Event) {
  const target = event.target as Element | null;
  if (target?.localName === "img" || target?.localName === "image") {
    reportResourcesMissing();
  }
}

// Firefox does not carry the player's referrer policy into the reopened
// document. Added last, this outranks any policy in the recorded snapshot, and
// precedes the requests for its images and fonts, which start after the rebuild.
function sendNoReferrer(document: Document) {
  const meta = document.createElement("meta");
  meta.name = "referrer";
  meta.content = "no-referrer";
  (document.querySelector("head") ?? document.documentElement).append(meta);
}

const watchedFonts = new WeakSet<FontFace>();

// Firefox fires no event on a failed font of the reopened document, but each
// font's own promise still rejects.
function watchFonts(document: Document) {
  for (const font of document.fonts) {
    if (watchedFonts.has(font)) continue;
    watchedFonts.add(font);
    font.loaded.catch(reportResourcesMissing);
  }
}

// A load error does not bubble, so it is caught on the way down. Rebuilding a
// snapshot reopens the document, which drops its listeners, so this runs again
// after each one.
function watchResources(document: Document) {
  document.addEventListener("error", reportFailedImage, true);
  watchFonts(document);
  // A font the page declares later starts loading on its first use.
  document.fonts.onloading = () => {
    watchFonts(document);
  };
}

function prepareRebuiltPage() {
  const document = replayer?.iframe.contentDocument;
  if (!document?.documentElement) return;
  sendNoReferrer(document);
  watchResources(document);
}

function fail() {
  if (failed) return;
  failed = true;
  state = "paused";
  try {
    replayer?.destroy();
  } catch {
    // The replayer is already broken; the dashboard only needs to hear it.
  }
  replayer = null;
  send({ type: "failed" });
}

function load(events: RecordingPlayerEvent[]) {
  if (replayer || failed || !stage) return;
  const viewport = readRecordingViewport(events);
  if (!viewport) {
    fail();
    return;
  }

  try {
    // The protocol checks the fields every event carries; rrweb reads the rest.
    replayer = new Replayer(events as ReplayerEvents, {
      root: stage,
      mouseTail: false,
      skipInactive: false,
      speed,
    });
    replayer.on("resize", (dimension) => {
      recordedViewport = dimension as RecordingPlayerViewport;
      fitStage();
    });
    replayer.on("fullsnapshot-rebuilded", prepareRebuiltPage);
    replayer.on("finish", () => {
      // rrweb also finishes when a paused seek reaches the last event.
      if (state !== "playing") return;
      setState("ended");
      reportTime();
    });
    replayer.pause(0);
  } catch {
    fail();
    return;
  }

  duration = replayer.getMetaData().totalTime;
  recordedViewport ??= viewport;
  fitStage();
  send({ type: "loaded", duration, viewport });
}

function play() {
  if (!replayer || state === "playing") return;
  replayer.play(replayer.getCurrentTime());
  setState("playing");
  reportTimeWhilePlaying();
}

function pause() {
  if (!replayer || state !== "playing") return;
  replayer.pause();
  setState("paused");
  reportTime();
}

function seek(time: number) {
  if (!replayer) return;
  const target = clampTime(time);
  if (state === "playing") {
    replayer.play(target);
  } else {
    replayer.pause(target);
    setState("paused");
  }
  reportTime(target);
}

function setSpeed(next: number) {
  speed = next;
  replayer?.setConfig({ speed });
}

window.addEventListener("resize", fitStage);

// An uncaught error here can only come from the replayer rebuilding the page.
window.addEventListener("error", fail);
window.addEventListener("unhandledrejection", fail);

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
      play();
      break;
    case "pause":
      pause();
      break;
    case "seek":
      seek(message.time);
      break;
    case "speed":
      setSpeed(message.speed);
      break;
  }
});

send({ type: "ready" });
