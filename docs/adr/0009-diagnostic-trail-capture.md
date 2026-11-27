---
status: accepted
---

# Diagnostic Trail: capture console + network in the widget

To help agencies reproduce reported bugs, the Widget captures a **Diagnostic Trail** —
the recent console and network history — and attaches it to each Feedback. Capture works
by monkey-patching `console.*`, `fetch`, and `XMLHttpRequest` at Widget mount and pushing
into a fixed-size Ring Buffer; submitting a Feedback snapshots the buffer. There is no way
to recover events from _before_ mount, so the Trail is the recent tail, not the full session.

## Scope (v1)

- Console: all levels. Network: all requests, **metadata only** (method, URL, status, duration, timestamp) — no request/response bodies.
- Bounds: 50 console + 50 network entries (independent rings), each entry truncated to ~2 KB, total Trail < ~64 KB.
- Capture is invisible to the Reviewer.

## Privacy

- **Redaction is client-side**, before the Trail leaves the page: sensitive URL query-param _values_ (`token`, `key`, `secret`, `password`, `auth`, `session`, `signature`, `email`, `access_token`, …) are replaced with `[redacted]`; keys and host/path are kept. The denylist is hard-coded in v1.
- **Console messages are stored raw** (truncated only). Pattern-scrubbing free-text logs over-redacts and destroys debugging value. Documented limitation: a client logging secrets to the console will have them captured.
- The Widget's own traffic to the Faster Fixes API is excluded from the Network stream.

## Governance

- Capture is gated by a `captureDiagnostics` **prop** on `FeedbackProvider` (default `true`),
  not a dashboard/DB setting — the Widget is configured in code, like color and position.
  `false` means the Widget never installs the instrumentation, so nothing is captured.

## Considered options (rejected)

- **Server-side redaction** — rejected: ingesting then scrubbing means the secret already
  touched our servers. Client-side scrubbing means it never does.
- **Capturing request/response bodies in v1** — rejected: that is where most PII/secrets and
  payload bloat live. Deferred to an opt-in future iteration.
- **Storing the Trail in `Feedback.metadata`** — rejected: the Widget reads `metadata` on every
  `getFeedback` to resolve pins on the live host page, so a Trail there would be re-downloaded
  to every Reviewer's browser. Stored instead in a dedicated `Feedback.diagnosticTrail Json?`
  column, never selected except by the dashboard "View diagnostics" modal.
- **Storing the Trail as an S3/R2 Asset blob** (like screenshots) — rejected for v1: 64 KB fits
  comfortably in Postgres JSONB; a blob adds an upload round-trip on submit and a new authed
  fetch endpoint for no current benefit. Revisit if Trails grow (bodies, larger caps).
- **A dashboard/DB toggle for capture** — rejected: widget behaviour is code-managed; a prop is
  simpler and avoids a Project schema field plus settings UI.
- **A `<head>` early-init snippet** to capture pre-mount events — rejected for v1: adds install
  friction; most reproduction-relevant activity happens after mount.

## Amendment 2026-11-27: the Trail of a narrated Recording

The bounds above hold for a Feedback with a Selection. With a narrated Recording (ADR-0027, issue #505) the Trail is the ring as it stands when the Recording starts (50 + 50), then every entry until the stop, pauses and full page loads included, within 256 KB before compression, then a ring of 50 + 50 until the Reviewer sends. It is persisted locally with the Recording so that it survives a full page load. Past the 256 KB, consecutive identical console entries are already collapsed into one with a count, and entries are left out by priority: successful requests and `log`, `info`, `debug` first, oldest first, errors, warnings and failed requests last. The Trail carries the number left out per stream.

It stays in the `Feedback.diagnosticTrail` column, with a cap in bytes in place of the cap of 200 entries: the column is read on demand only, and one read path serves the inbox and the agent surface. The Asset blob rejected above stays rejected at this size.
