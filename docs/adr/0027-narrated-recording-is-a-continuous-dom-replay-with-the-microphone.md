# ADR-0027: A narrated Recording is a continuous DOM replay with the microphone, not a screen video

- **Status**: Accepted
- **Date**: 2026-11-26
- **Amends**: ADR-0021, on the deliberate capture mode it deferred

## Context

ADR-0021 made the automatic **Recording** a DOM replay (rrweb) and deferred a deliberate mode, noting that voice would bring one back. That mode is now specified (issue #490): a **narrated Recording**, which a Reviewer starts on purpose, speaks over and stops, and which is the subject of its Feedback.

Three techniques can run from the Widget alone: a screen video through `getDisplayMedia`, a continuous rrweb capture with the microphone recorded alongside, or both with a fallback. Every competitor that records from a widget films the screen, on desktop only.

The criteria of ADR-0021 still apply, in the same order when they conflict: (1) Reviewer effort, (2) usability by an agent, (3) fidelity for the human who watches, (4) cost and self-hosted compatibility. Mobile coverage is not a requirement; it weighs under criterion 1 as a strong tie-breaker.

## Decision

- **A narrated Recording is a continuous rrweb capture plus the Reviewer's microphone.** No screen video, and no fallback to one.
- **The voice is mandatory.** If the Reviewer refuses the microphone, or the customer's site blocks it (`Permissions-Policy: microphone=()`), there is no narrated Recording: the Widget says why and offers an ordinary Feedback. A silent narrated Recording with no written note would be a Feedback that says nothing.
- **Target browsers**: Chrome, Edge, Firefox, Safari on macOS 14.1+, Safari on iOS 14.3+ and Android browsers, in a secure context. Where the capture cannot work at all (no `MediaRecorder`, no HTTPS) the Widget does not offer it.
- **A full page load does not end the Recording.** What is captured is persisted locally as it is produced. After the load the Widget resumes by itself, with no gesture from the Reviewer, and the Recording carries a short gap. Where it cannot resume (the microphone is refused again, or the Reviewer left the origin) the Recording stops there and the Widget offers to send what was captured. Nothing spoken is lost silently.

## Alternatives considered

- **Screen video.** Rejected. One share prompt per Recording that no browser may remember, a wrong surface the Reviewer can pick, own-tab capture on Chromium only, and no phones (criterion 1). No interactions as data unless rrweb runs alongside anyway (criterion 2). 8 to 20 MB per minute against about 0.3 to 0.5, a format that depends on the recording browser, and a direct-to-storage upload path (criterion 4). It also films whatever is on screen, so the masking of ADR-0022 cannot apply. It wins only on fidelity (criterion 3), and the content Reviewers demonstrate is the page itself.
- **Both, with a fallback.** Rejected for the reason ADR-0021 gave: two storage paths, two players, two privacy models, two agent surfaces, and a team that cannot know which one it will receive.
- **Stopping at a full page load**, as most competitors do. Rejected as the target: many reviewed sites are multi-page, where every link is a full load, and a Recording that ends at each one is close to unusable. It remains the floor when resuming fails.

## Consequences

- Faster Fixes goes against the market norm. A Reviewer sees no share picker; the team never sees anything outside the page: browser chrome, other tabs, native dialogs, canvas content, video frames or third-party iframes.
- Playback gains an audio track to keep in step with the replay, and the audio needs remuxing before playback (Chromium's WebM carries no duration or seek index).
- The narrated Recording shares the one rrweb instance of the automatic Recording, and cannot keep its 30-second slicing: checkpoints decide the size.
- Sizes are extrapolated, and the microphone's behaviour after a full load (a new prompt, a required gesture, the length of the gap) is unverified per browser. Both are to be measured before Plan limits and the Widget flow are fixed.
- Reopen this decision if the fidelity limits turn out to hide the problems Reviewers narrate most, or if resuming after a full page load proves unreliable on the browsers Reviewers use.
