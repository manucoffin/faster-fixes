---
"@fasterfixes/widget": minor
"@fasterfixes/core": minor
"@fasterfixes/react": minor
---

Recording is on by default: every site that installs this version attaches to each page Feedback a reconstruction of the last minute on the page (its content as it changed, and the Reviewer's clicks, scrolling and pointer, never the values typed into form fields). Turn it off with `captureRecording: false`, or `data-capture-recording="false"` on the script tag. See https://faster-fixes.com/docs/widget/recording.

The Widget keeps a short buffer of the recent past while the page is open and uploads it after the Feedback is created. The comment form shows one muted line when a Recording is attached, set through the new `recordingIncluded` label. `data-ff-mask` replaces the text of an element and its descendants in the Recording; `data-ff-block` replaces the element with a placeholder in the Recording and keeps it out of the Screenshot. The option is independent of `captureDiagnostics`. At `false` the recorder is never loaded. The script embed loads the recorder as a second file from jsDelivr, at its own exact version and with the nonce of its own script tag; a framework Embed bundles it. When the recorder cannot load, the Feedback is sent without a Recording and no error is shown.

`FeedbackProvider` in `@fasterfixes/react` accepts `captureRecording` as a prop. `@fasterfixes/vue`, `@fasterfixes/angular` and `@fasterfixes/svelte` forward it unchanged. `@fasterfixes/core` adds `attachRecording` to `FasterFixesClient`, as an optional method of `FeedbackClient` so an injected client written before this release keeps working, the `RecordingDetails` type, `recordingFollows` on `CreateFeedbackData`, and the `recordingIncluded` label.
