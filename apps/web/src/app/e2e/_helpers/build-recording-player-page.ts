/**
 * The end-to-end fixture for the player document: a page that frames the real
 * player and plays the dashboard's side of the protocol by hand, so a spec can
 * drive it with no session and no database. It answers the player's `ready`
 * with the sample Recording, sent once, records every valid message from the
 * player in `window.playerMessages`, and exposes `window.sendToPlayer`.
 */

const CHANNEL = "fasterfixes/recording-player";

// Keeps the events from closing the inline script they are embedded in.
function embedJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildRecordingPlayerPage(events: unknown[]) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Recording player fixture</title>
    <style>body { margin: 0; } iframe { width: 900px; height: 562px; border: 0; }</style>
  </head>
  <body>
    <iframe id="player" title="Recording" src="/recording-player"></iframe>
    <script>
      const channel = "${CHANNEL}";
      const events = ${embedJson(events)};
      const frame = document.getElementById("player");
      let loaded = false;
      window.playerMessages = [];
      window.sendToPlayer = (message) => {
        frame.contentWindow.postMessage({ channel, ...message }, location.origin);
      };
      addEventListener("message", (event) => {
        if (event.origin !== location.origin) return;
        if (event.source !== frame.contentWindow) return;
        if (event.data?.channel !== channel) return;
        window.playerMessages.push(event.data);
        if (event.data.type === "ready" && !loaded) {
          loaded = true;
          window.sendToPlayer({ type: "load", events });
        }
      });
      window.sendToPlayer({ type: "listening" });
    </script>
  </body>
</html>
`;
}
