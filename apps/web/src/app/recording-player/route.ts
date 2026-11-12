import {
  buildRecordingPlayerDocument,
  RECORDING_PLAYER_CONTENT_SECURITY_POLICY,
} from "./_helpers/build-recording-player-document";

// Holds no data and calls no API, so it is served without a session (ADR-0023).
export function GET() {
  return new Response(buildRecordingPlayerDocument(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": RECORDING_PLAYER_CONTENT_SECURITY_POLICY,
      "Referrer-Policy": "no-referrer",
    },
  });
}
