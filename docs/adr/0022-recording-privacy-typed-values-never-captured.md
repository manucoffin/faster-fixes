# ADR-0022: A Recording never holds what the Reviewer typed; page text is captured and the site marks the rest

- **Status**: Accepted
- **Date**: 2026-11-11

## Context

A **Recording** (ADR-0021) is a DOM replay taken from a buffer that runs before any Feedback exists. It holds the text of the page and the Reviewer's interactions over the last minute, including what was typed and then erased. Nothing in the Widget masks DOM content today: the Screenshot shows the page as it is, and only the Diagnostic Trail is redacted (ADR-0009).

Session replay products split into two models. PostHog masks every input value and records page text. Sentry masks all text and blocks all media, which removes most of what a human, or an agent reading the timeline, would use. rrweb itself masks password inputs only.

The Reviewer is invited by the team to review the team's own site, often on staging, and the Screenshot of the same Feedback already shows the page text at the Selection.

## Decision

- **Typed values are never captured.** Every `input`, `textarea` and `select` value is masked, and so is the text of every `contenteditable` element. The Recording still shows that the Reviewer typed, and where. There is no way to unmask in v1.
- **Page text, images and media are captured as they are.**
- **The site marks the rest with two attributes**, which apply to the element and all its descendants, with no way to exempt a descendant: `data-ff-mask` replaces text with `*`; `data-ff-block` replaces the element with a placeholder of the same size. `data-ff-mask` on `<body>` is the "mask all text" mode.
- **`data-ff-block` also keeps the element out of the Screenshot.** Nothing else changes for the Screenshot: input values and `data-ff-mask` content still appear in it.
- **Masking happens in the browser only**, before any event exists. The buffer leaves the page only when a Feedback is submitted.
- **The site's switch is a Widget option**, `captureRecording` (default `true`), with `data-capture-recording` on the script tag, independent of `captureDiagnostics`. At `false` the recorder is never loaded. It is the only way a Project has no Recording.
- **The Reviewer is told by one line** in the comment form when a Recording will be attached, and has no way to remove it.
- **The team can remove a Recording** from a Feedback and keep the Feedback. Removal is final and open to any member who can delete the Feedback.

The agent's timeline is derived from the Recording, so it inherits all of the above with no rule of its own.

## Alternatives considered

- **Mask all text and block all media by default (Sentry's model).** Rejected: it empties the agent's timeline and the human playback, for content the Screenshot already shows.
- **Mask passwords only (rrweb's default).** Rejected: a minute of typing, including what was erased, is more than the Screenshot ever exposed.
- **Leave `contenteditable` to the site.** Rejected: "what the Reviewer types is never recorded" must not depend on how an editor is built.
- **CSS selector options in the Widget configuration, or rrweb's own `rr-mask` and `rr-block` classes.** Rejected for v1: the attributes are enough and do not expose the library. Selectors can be added later.
- **Server-side masking.** Rejected for the reason given in ADR-0009: the content would already have reached the server.
- **A Project setting in the dashboard.** Rejected, as in ADR-0009: the Widget is configured in code.
- **Off by default.** Rejected: almost no Feedback would have a Recording, which defeats "no step for the Reviewer". The cost is that a site that upgrades the package, or loads the script tag, starts capturing page text without acting; the changelog and the documentation must say so.
- **A Recording opt-out for the Reviewer.** Rejected earlier, when the capture flow was decided: no choice and no step for the Reviewer.

## Consequences

- Page text that the site did not mark is stored by Faster Fixes. Removing the Recording is the remedy after the fact.
- A bug that depends on the typed value has to be told in the comment.
- The Screenshot gains its first privacy rule, limited to `data-ff-block`.
- The documentation gives sites the two attributes, the switch, and a sentence for their privacy policy.
