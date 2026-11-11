import sampleRecording from "@/app/_domains/feedback/_helpers/read-recording-steps.real-recording.json";

import { buildRecordingPlayerPage } from "../_helpers/build-recording-player-page";

export function GET() {
  // A test fixture: `next build` sets NODE_ENV, so no deployment serves it.
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  return new Response(buildRecordingPlayerPage(sampleRecording), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
