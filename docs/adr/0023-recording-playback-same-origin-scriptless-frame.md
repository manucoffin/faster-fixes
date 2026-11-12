# ADR-0023: A Recording plays on the dashboard's origin, in a script-less frame under its own CSP

- **Status**: Accepted
- **Date**: 2026-11-11

## Context

Playing a **Recording** (ADR-0021) rebuilds a customer's page in the dashboard: HTML and CSS that Faster Fixes did not write, sent by an anonymous Reviewer's browser and stored unchecked. The dashboard has no Content Security Policy for pages and embeds no untrusted content today.

The obvious isolation is to frame the player with `sandbox="allow-scripts"` and no `allow-same-origin`, which gives it an opaque origin with no access to the session or the dashboard's DOM. It does not work: rrweb rebuilds the page into an iframe of its own and must reach that iframe's document, which an opaque-origin parent cannot do. The replayer throws at start. Verified with `@rrweb/replay` 2.2.2 in Chromium.

rrweb 2.2 forces its own iframe to `sandbox="allow-same-origin"` and refuses to rebuild into anything else. In that frame no script runs, no form submits, nothing navigates and no popup opens, whatever the recorded HTML contains.

## Decision

- **The player runs on the dashboard's origin.** Isolation rests on rrweb's script-less iframe.
- **The player is a document of its own**, framed by the dashboard, never mounted in the dashboard's page. It receives the events and playback commands through `postMessage` and reports time back. The dashboard draws everything else around it: controls, the timeline, the log, the Selection frame.
- **That document is served with a strict CSP**: no connection, no form action, no script but the replayer, no referrer. Images, fonts and media may load from any host, since a Recording copies none of them.
- **The dashboard decompresses and parses the Recording**, with a cap on decompressed size, before handing it to the player.

## Alternatives considered

- **Opaque-origin sandbox.** Not possible with rrweb, as above.
- **A separate host for the player.** Real origin isolation, and the right hardening for the cloud later. Rejected for v1: self-hosted would need a second hostname, against "no mandatory extra piece" for the core of the feature.
- **Mounting the replayer in the dashboard's page.** Rejected: it has the same script-less frame but no CSP of its own, and the replayed page's requests would carry the dashboard's referrer policy.
- **Rendering the Recording to video or stills on the server.** Deferred in ADR-0021: it needs a headless browser.

## Consequences

- A flaw in rrweb's rebuild, or in the browser's sandbox, is a flaw in the dashboard's origin. The replayer version is pinned and its upgrades are read.
- The viewer's browser fetches images and fonts from the customer's site, so that site sees the viewer's IP address. No referrer is sent.
- Moving the player to a separate host later changes one URL and the `postMessage` origin check, not the design.
