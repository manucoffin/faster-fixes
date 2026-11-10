# ADR-0021: A Recording is a DOM replay captured retroactively, not a screen video

- **Status**: Accepted
- **Date**: 2026-11-10

## Context

A Feedback is a comment frozen on one point of a page, and a Screenshot cannot show a bug that only exists as a sequence. The request that started this, more than once, was for a "tab recorder". Two techniques can run from the Widget without a browser extension: a screen video through `getDisplayMedia`, and a DOM replay (rrweb), which records a snapshot of the page and its mutations and reconstructs it at playback.

The criteria, in order when they conflict: (1) Reviewer effort, a non-technical client must manage without friction; (2) usability by an agent; (3) fidelity for the human who watches; (4) cost and self-hosted compatibility.

## Decision

In v1 a **Recording** is a DOM replay, captured retroactively: the Widget keeps a buffer of the recent past and attaches it to the Feedback at submission. The recorder is lazy-loaded and the customer's site can turn it off. A Recording and the **Diagnostic Trail** stay two concepts on a common clock.

## Alternatives considered

- **Screen video.** Rejected for v1. The browser shows a share picker at every capture and cannot remember the grant, the Reviewer can share the wrong surface, and only Chromium offers the Reviewer's own tab (criterion 1). It holds no interactions, so an agent, which reads text and stills and never video, gets no timeline unless the Widget captures one alongside (criterion 2). No mobile, nothing retroactive, about 19 MB per minute in a format that depends on the recording browser (criterion 4). It wins only on pixel fidelity (criterion 3).
- **Both techniques.** Rejected for v1: two storage paths, two players, two privacy models and two agent surfaces.
- **Deliberate capture (start, reproduce, stop).** Deferred. With a replay, the buffer already covers a Reviewer who reproduces a bug and then creates the Feedback, with no extra step. Voice cannot be captured retroactively, so a decision to ship voice brings a deliberate mode back.

## Consequences

- Accepted limits: a Recording shows no canvas content, video frames or third-party iframes; playback fetches images and fonts from the customer's site and can decay when that site changes or serves them behind a session; the buffer does not survive a full page load.
- An agent gets a timeline of steps as text plus the existing Screenshot, and no stills over time. Trackers and Notification channels get a link, not a file.
- Stills or a video file from a replay need a headless Chromium on the server. That is out of the core and may come later as an optional part that degrades on a self-hosted instance.
- The recorder runs for whoever loads the Widget, before any Feedback exists, as the Diagnostic Trail recorder already does.
- Reopen this decision if playback of a Recording taken on an authenticated application proves unusable, or if the fidelity limits turn out to hide the bugs Reviewers report most.
