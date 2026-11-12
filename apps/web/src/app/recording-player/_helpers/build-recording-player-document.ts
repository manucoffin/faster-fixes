/**
 * The player document of ADR-0023: the replayer and the script that speaks to
 * the dashboard, nothing else. Its script and stylesheet are built from
 * `_features/play-recording.ts` by `pnpm build:recording-player`.
 */

export const RECORDING_PLAYER_SCRIPT_PATH = "/recording-player/player.js";
const RECORDING_PLAYER_STYLESHEET_PATH = "/recording-player/player.css";

// rrweb rebuilds the page into a script-less frame that inherits this policy,
// so it bounds the recorded page as well as the player.
export const RECORDING_PLAYER_CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  // The recorded CSS is replayed inline, and its stylesheets and assets may sit on any host.
  "style-src * data: 'unsafe-inline'",
  "img-src * data: blob:",
  "font-src * data:",
  "media-src * data: blob:",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'self'",
].join("; ");

export function buildRecordingPlayerDocument() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Recording</title>
    <link rel="stylesheet" href="${RECORDING_PLAYER_STYLESHEET_PATH}" />
    <style>
      html, body { margin: 0; height: 100%; overflow: hidden; }
      #stage { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
      .replayer-wrapper > iframe { border: 0; background: #fff; }
    </style>
  </head>
  <body>
    <div id="stage"></div>
    <script src="${RECORDING_PLAYER_SCRIPT_PATH}"></script>
  </body>
</html>
`;
}
