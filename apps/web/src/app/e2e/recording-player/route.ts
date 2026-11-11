import sampleRecording from "@/app/_domains/feedback/_helpers/read-recording-steps.real-recording.json";

import {
  buildAttackRecording,
  buildPageRecording,
} from "../_helpers/build-fixture-recordings";
import { buildRecordingPlayerPage } from "../_helpers/build-recording-player-page";

// Well-formed events the replayer cannot play: no snapshot, no viewport.
const UNPLAYABLE_RECORDING = [
  { type: 3, timestamp: 1_000, data: { source: 2 } },
  { type: 3, timestamp: 2_000, data: { source: 2 } },
];

const RECORDINGS: Record<string, () => unknown[]> = {
  unplayable: () => UNPLAYABLE_RECORDING,
  attack: buildAttackRecording,
  page: () => buildPageRecording(),
  "page-missing-image": () => buildPageRecording({ missing: "image" }),
  "page-missing-font": () => buildPageRecording({ missing: "font" }),
};

export function GET(request: Request) {
  // A test fixture: `next build` sets NODE_ENV, so no deployment serves it.
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const events =
    RECORDINGS[searchParams.get("recording") ?? ""]?.() ?? sampleRecording;
  const page = buildRecordingPlayerPage(events, {
    listenLate: searchParams.get("listen") === "late",
  });

  return new Response(page, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
