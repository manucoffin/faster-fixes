# Replay fidelity on an authenticated app

Evidence for the wayfinder ticket "Replay fidelity on an authenticated app" (issue 374). The findings are in the ticket's resolution comment; this folder holds what produced them.

## Setup

- Recorded: the Faster Fixes dashboard (`next dev`, self-hosted mode, local storage) at `http://localhost:3200`, signed in, with three Feedback that each carry a Screenshot.
- Session, 9.4 s: Task board, open a Feedback (drawer with its Screenshot), close, Reviewers, account settings. Client-side navigation only.
- Recorder: `@rrweb/record` 2.2.2, injected after load. Replayer: `@rrweb/replay` 2.2.2.
- Played back from `http://127.0.0.1:4400` in a fresh browser context with no cookie, in two conditions: the recorded site still up, and every request to it refused (a preview deployment that was torn down).
- Playwright 1.63, headless Chromium, viewport 1440x900.

## Files

- `record.mjs`: records the session once per option set and writes the events and facts about the live page.
- `replay.mjs`, `replay.html`: serve the replayer on the second origin, log every request the replay makes, and read the replayed document.
- `shots.mjs`: screenshots taken while the replay is playing.
- `original.png`: the live page with the drawer open.
- `replay-default-origin-up.png`: default options, recorded site reachable, no session.
- `replay-default-origin-gone.png`: default options, recorded site unreachable.
- `replay-no-inline-css.png`: `inlineStylesheet: false`.
- `replay-cold-seek-paused.png`: default options, seeking straight to a paused instant.

The scripts carry absolute paths from the machine they ran on. They are a record of the method, not a maintained tool.
