/**
 * The end-to-end fixture for the player document: a page that frames the real
 * player and plays the dashboard's side of the protocol by hand, so a spec can
 * drive it with no session and no database. It answers the player's `ready`
 * with the given events, sent once, records every valid message from the
 * player in `window.playerMessages` with the time it arrived, and exposes
 * `window.sendToPlayer`. `window.postFromStranger` posts to the player from
 * another frame, of another origin unless `sameOrigin` is set.
 *
 * With `listenLate`, the page starts listening only once the player is loaded,
 * so the player announces it is ready before anyone hears it.
 */

const CHANNEL = "fasterfixes/recording-player";

// Keeps the events from closing the inline script they are embedded in.
function embedJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildRecordingPlayerPage(
  events: unknown[],
  { listenLate = false }: { listenLate?: boolean } = {},
) {
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
      window.postFromStranger = (message, { sameOrigin = false } = {}) =>
        new Promise((resolve) => {
          const stranger = document.createElement("iframe");
          // A sandbox without allow-same-origin gives the frame an opaque origin.
          if (!sameOrigin) stranger.sandbox = "allow-scripts";
          const posted = JSON.stringify({ channel, ...message });
          stranger.srcdoc =
            "<script>parent.frames[0].postMessage(" + posted + ", '*');" +
            "parent.postMessage('stranger-posted', '*');<\\/script>";
          addEventListener("message", function onPosted(event) {
            if (event.source !== stranger.contentWindow) return;
            removeEventListener("message", onPosted);
            resolve();
          });
          document.body.append(stranger);
        });
      function listen() {
        addEventListener("message", (event) => {
          if (event.origin !== location.origin) return;
          if (event.source !== frame.contentWindow) return;
          if (event.data?.channel !== channel) return;
          window.playerMessages.push({ ...event.data, receivedAt: performance.now() });
          if (event.data.type === "ready" && !loaded) {
            loaded = true;
            window.sendToPlayer({ type: "load", events });
          }
        });
        window.sendToPlayer({ type: "listening" });
      }
      ${listenLate ? 'frame.addEventListener("load", () => setTimeout(listen, 200));' : "listen();"}
    </script>
  </body>
</html>
`;
}
