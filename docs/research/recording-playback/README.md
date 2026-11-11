# Inbox playback of a Recording prototype

Primary source for the wayfinder ticket "Inbox playback of a Recording prototype" (issue 377). The verdict is in the ticket's resolution comment.

## Run it

`pnpm --filter web dev`, then:

- `http://localhost:3000/inbox?variant=B`, open any Feedback (the real host, needs a session).
- `http://localhost:3000/prototype-recording?variant=B` (no sign-in).

`?variant=A|B|C` picks the variant, `?recording=missing|ok|broken|none` forces the state. The bar at the bottom does both.

## Where it lives

- `apps/web/src/app/(authenticated)/(project)/inbox/_features/feedback-panel/_prototype-recording/`: the three variants and the player hook.
- `apps/web/public/_prototype-recording/`: the framed player document, the rrweb replayer 2.2.2 build (stored as `.txt` and served by `apps/web/src/app/prototype-recording/replay.js/route.ts`, because the repo lints every committed `.js` file), and the sample Recording (13 s of a fake billing site, with typed values masked, a `data-ff-mask` text and a `data-ff-block` card).
- `apps/web/src/app/prototype-recording/`: the standalone page.

## Files here

- `fake-site.html`, `record.mjs`: the fake site and the script that recorded it with `@rrweb/record` 2.2.2 and wrote the sample, its Diagnostic Trail and its Screenshot.
- `iso.mjs`: the isolation test. Second argument is the iframe `sandbox` value. It was run against an earlier layout where the replayer build sat next to `player.html`. With `allow-scripts` alone the replayer throws; with `allow-scripts allow-same-origin` it plays.

The scripts carry absolute paths from the machine they ran on. They are a record of the method, not a maintained tool.
