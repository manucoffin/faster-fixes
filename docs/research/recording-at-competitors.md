# Recording at competitors

> How comparable products let someone attach a recording to a bug report, read from primary sources on 2026-11-10. Research for [#363](https://github.com/manucoffin/faster-fixes/issues/363), part of the map [#362](https://github.com/manucoffin/faster-fixes/issues/362). This note reports facts. It does not choose a capture technique.

## How to read this note

- **Scope**: Marker.io, Jam, Userback, BugHerd, Usersnap, Atarim, PostHog (session replay), Sentry (User Feedback with Replay).
- **Vocabulary**: "reporter" is the vendor-side person who files the report, the counterpart of a **Reviewer**. "Screen video" is a pixel capture through the browser's screen-sharing API. "DOM replay" is a reconstruction of the page from recorded DOM mutations (rrweb and its forks). **Recording** stays the neutral Faster Fixes term for either.
- **Evidence labels**:
  - No label: stated on a vendor page (help center, docs, pricing, changelog, official blog). The URL follows the claim.
  - `[code]`: read from the vendor's publicly served, minified production script. It is primary, but it is a reading of code, not a vendor statement, and it can change on any deploy. The presence of the key strings was re-checked on 2026-11-10 for Jam, Userback, BugHerd and Marker.io.
  - `[inference]`: a conclusion drawn from documented facts, not stated by the vendor.
  - "Not documented": looked for and not found in a primary source.
- **No secondary source** (review sites, third-party comparisons) backs any claim below.

## Summary

| Product   | Technique from the embedded script alone                                         | Capture mode                                            | Voice              | Cap                                             | Recording tier                                        |
| --------- | -------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------ | ----------------------------------------------- | ----------------------------------------------------- |
| Marker.io | DOM replay (rrweb `[code]`). No screen video.                                    | Retroactive only, last 2.5 to 3 min                     | No                 | 2.5 to 3 min window                             | Team ($149/mo annual) and up                          |
| Jam       | Screen video (Recording Links). DOM replay exists only in the browser extension. | Deliberate only without the extension                   | Yes, set by sender | 10 min default `[code]`                         | Free: 5 links/month. Team: 150/month                  |
| Userback  | Both: screen video and DOM replay (rrweb `[code]`)                               | Deliberate (video) and retroactive (replay, 3 to 7 min) | Yes                | 3 min default, 1 to 5 min configurable `[code]` | Video: all plans. Replay: Business ($89/mo annual)    |
| BugHerd   | Screen video. A native rrweb replay sits behind an experiment flag `[code]`.     | Deliberate only (documented)                            | Yes                | 1 min (docs)                                    | All plans (from $42/mo annual)                        |
| Usersnap  | Screen video                                                                     | Deliberate only                                         | Yes                | 3 min                                           | All plans (from EUR 49/mo)                            |
| Atarim    | None. Screenshot only, video is a roadmap item.                                  | Not applicable                                          | Dictation to text  | Not applicable                                  | Not applicable                                        |
| PostHog   | DOM replay (rrweb fork)                                                          | Always-on, sampled, or triggered with a 1 min buffer    | No                 | Session: 30 min idle, 24 h max                  | 5,000 replays/month free, then from $0.005 per replay |
| Sentry    | DOM replay (rrweb fork), plus a single-frame screen capture for the screenshot   | Retroactive buffer (30 to 60 s) flushed on widget open  | No                 | 60 min per replay                               | 50 replays included on every plan, then about $0.003  |

Three patterns stand out:

1. **Voice exists only with screen video.** Every product with voice (Jam, Userback, BugHerd, Usersnap) records pixels. No DOM replay product documents audio capture.
2. **Retroactive capture exists only with DOM replay.** No product offers "the last N seconds" from a screen video without a browser extension.
3. **Recordings leave the product as links.** Where the form is documented, a Tracker receives a link back to the vendor's player, not a file.

## Marker.io

**Technique**

- DOM replay only. "While Marker.io doesn't currently have a built-in screen recording feature, we're actively considering it for future updates." ([Record a video or GIF](https://help.marker.io/en/articles/952693-record-a-video-or-gif-with-marker-io))
- Screen video was planned in December 2022, in progress in February 2023, then "postponed for now" in February 2024. ([feature request](https://feedback.marker.io/feature-request/p/video-and-gif-reporting))
- Works from the script, the npm package or the CMS plugins. The extension only collects replays when it injects the widget. ([Session replay](https://help.marker.io/en/articles/6673880-session-replay-videos), [extension FAQ](https://help.marker.io/en/articles/6501657-browser-extensions-faqs))
- `[code]` The widget bundles rrweb: `record({ checkoutEveryNms: 3e4, maskTextClass: "mk-mask", ... })`, with events uploaded on a 10 second interval. There is no `MediaRecorder` in the bundle. `getDisplayMedia` is called with `preferCurrentTab` for a single-frame native screenshot only.
- Documented fidelity limits: "content created with Canvas or WebGL won't be captured" and "Even open Shadow DOMs are not yet supported". ([Session replay](https://help.marker.io/en/articles/6673880-session-replay-videos))

**Capture mode**

- Retroactive only. "This automatically records short clips of a user's activity without them having to do anything extra."
- The window is stated as "the last 2.5 minutes" in the help center and as three minutes on the [feature page](https://marker.io/features/session-replay) and the [launch post](https://marker.io/blog/session-replay).
- The buffer is held on Marker.io's side: unreported buffers are "automatically deleted within 15 minutes". ([Data privacy overview](https://help.marker.io/en/articles/12383990-data-privacy-security-overview))

**Reporter flow**

- Click the widget, annotate the screenshot, fill in the details, send. The replay needs no step and no browser prompt.
- No voice, no webcam, no annotation over time. The documented workaround for video is a Loom link or a file upload.
- Limit: 100 simultaneous visitor sessions (500 during the trial).
- Mobile browsers and behaviour across page loads: not documented.

**What the team gets**

- A replay button on the issue page, next to console logs and network requests. Time alignment between the logs and the player: not documented.
- Guests and public reporters see "A simplified view" with "no replays or tech logs". ([Issue page](https://help.marker.io/en/articles/6559060-understanding-and-navigating-the-marker-io-issue-page))
- AI is text-only (title generation, rewrite, translation) and does not see the replay: "Metadata such as screenshots, session replays, console logs, and technical data are not sent to AI services." ([AI data security](https://help.marker.io/en/articles/12991910-ai-data-security-privacy))
- MCP server with 33 tools, covering "projects, issues, screenshots, attachments, console logs, network requests". No replay tool is listed. ([MCP integration](https://help.marker.io/en/articles/14034657-mcp-integration-model-context-protocol))

**What leaves the product**

- A link, explicitly. "These items don't get sent as raw data or file attachments. Instead, your ticket includes a clickable link for each one that opens it directly in Marker.io". The stated reasons are size limits, storage quotas of the integration ("Session replay videos in particular can be large files") and readability. ([Why linked instead of attached](https://help.marker.io/en/articles/14430683-why-are-console-logs-network-requests-and-replays-linked-instead-of-attached))
- The ticket itself carries the screenshot, the description, environment info and "A summary of recorded errors, console logs, and network requests".

**Gating** ([pricing](https://marker.io/pricing))

- Starter ($39/mo annual): no replay, no console or network logs.
- Team ($149/mo annual): replay, console and network logs.
- Business (custom): adds sensitive data masking.
- AI features and MCP: all plans.
- Retention: "Data is stored permanently. Admins have full control to delete it."

**Privacy**

- "Passwords are automatically hidden."
- Masking by CSS class (`.mk-exclude`, `.mk-mask`, `.mk-unmask`), applied in the browser "before the session replay is recorded", gated to the top plan. ([Sensitive data masking](https://help.marker.io/en/articles/9657817-sensitive-data-masking))
- Replay, console and network capture can each be turned off.
- A consent notice shown to the visitor: not documented. The docs say it "runs quietly in the background, similar to tools like Google Analytics."

## Jam

**Technique**

- Both, split by surface:
  - **Browser extension**: screen video, plus Instant Replay, which "is a DOM session replay, not a video recording of your screen". ([Instant Replay](https://jam.dev/docs/instant-replay.md))
  - **No extension (Recording Links)**: screen video only. "No browser extension, no account, no downloads required." "By default, Recording Links capture only screen recordings." ([Recording Links](https://jam.dev/docs/recording-links.md))
- An embedded script offering ("Connect your domain") adds two scripts to the customer's site: `recorder.js` "lets users record directly from your site" and `capture.js` "captures console logs, network requests, and click and key interactions while a recording is in progress." ([Custom recording domain](https://jam.dev/docs/custom-recording-domain.md))
- `[code]` `recorder.js` calls `getDisplayMedia` with `displaySurface: "monitor"`, `selfBrowserSurface: "exclude"` and audio on, records through a class that `extends MediaRecorder`, requires `SharedWorker`, and opens a Document Picture-in-Picture control window where supported. No rrweb.
- Architecture: both scripts run inside iframes served from `recorder.jam.dev` so they share state across the customer's pages. ([engineering post](https://jam.dev/blog/just-launched-recording-links-magic-links-for-bug-reports/))

**Capture mode**

- Without the extension: deliberate only. "They click Start Recording and capture the issue."
- With the extension: deliberate video, or retroactive Instant Replay from "a rolling 2-minute buffer of DOM activity".
- Retroactive capture without the extension: not documented.

**Reporter flow (Recording Link)**

- The entry point is a URL, not an in-page button: `https://recorder.jam.dev/<id>`, or `https://www.yoursite.com/?jam-recording=<id>` on a connected domain. The docs list "Feedback buttons embedded in your product" as a use for a reusable link.
- Steps: open the link, press a large Start Recording button, reproduce, stop. "Recording uploads automatically".
- "Can I customize the recorder UI? Not currently."
- Voice: set by whoever creates the link (`jam-mic-enabled=enabled`), not chosen by the reporter.
- Webcam and drawing while recording: documented for the Mac app and the extension only.
- Pause exists. ([Auto-blur](https://jam.dev/docs/auto-blur.md))
- Duration cap for Recording Links: not documented. `[code]` The recorder falls back to a 10 minute timeout. The extension is capped at 5 minutes on Free and 30 minutes on Team. ([Video](https://jam.dev/docs/video.md))
- Browsers: "Compatible with the desktop versions of Chrome, Edge, Firefox, and Safari." On a connected domain: "Supported in most Safari windows. Not supported in Safari Private Windows."
- Page loads: "Logs are only captured from pages where the Capture script is running", and redirects must keep all `jam-` query parameters.

**What the team gets**

- A player with a DevTools panel: console logs, network requests with bodies and timing, user events, device info. For Recording Link Jams this requires the connected domain. ([DevTools](https://jam.dev/docs/devtools.md))
- "Jam automatically generates chapters for every video recording... Recordings with voiceover also generate a transcript."
- AI titles and AI reproduction steps, video Jams only, through Google Gemini. ([Jam AI](https://jam.dev/docs/jam-ai.md))
- MCP server, the most complete agent surface found ([Jam MCP](https://jam.dev/docs/jam-mcp.md)):
  - `getVideoTranscript`: "the spoken transcript from a video Jam where the microphone was enabled, in WebVTT format with timestamps."
  - `getVideoChapters`: "AI-generated chapter markers for a video Jam: titled segments with start and end timestamps. Text only."
  - `getFrames`: "Return frames at specific timestamps, evenly across a window, or one labeled overview grid spanning the whole recording."
  - `getUserEvents`: "Read each click, input, and page navigation change in plain language."
  - `getEvents`: "Read network, console, and user events together in time order".
  - The video tools return nothing for Instant Replay Jams. The agent receives still frames and text, never the video stream.

**What leaves the product**

- Slack: links "automatically expand into rich previews showing error timelines". ([Slack](https://jam.dev/docs/slack.md))
- Jira, Linear, GitHub: the docs list console logs, network requests and device info as included. Whether the video is attached, embedded or linked: not documented. These integrations require the extension.
- Webhooks carry `jamUrl`, a link. Video download or export: not documented.

**Gating** ([pricing](https://jam.dev/pricing))

- Free: 30 Jams and 5 Recording Links per month, 5 minute recordings, 30 AI uses, MCP included.
- Team ($14 per creator per month, yearly): unlimited Jams, 150 Recording Links per month, 200 AI uses per person per month.
- Enterprise: unlimited, custom retention.
- Auto-blur is not on Free.

**Privacy**

- Consent is the explicit start and submit: "An end customer must actively choose to start a recording and then submit it before any visual or browser data is stored by Jam." ([Security](https://jam.dev/docs/security.md))
- Auto-blur on a pixel video is done by blurring the live page before capture, and requires the connected domain. Defaults cover password fields, card numbers, phone and email. It also honours other vendors' selectors: `.rr-block`, `.rr-mask`, `.fs-exclude`, `[data-hj-suppress]`, `[data-private]`, `.sentry-mask`. ([Auto-blur](https://jam.dev/docs/auto-blur.md))
- Documented blur limits: "Content in iframes cannot be selectively blurred" and "Flashes of unblurred content may occur during captured pageloads".
- "Recording Links are accessible to anyone with the URL."

## Userback

**Technique**

- Both, as two separate features, both from the embedded widget.
- Screen video: "The video feedback tool works directly in their browser". ([Video feedback feature](https://userback.io/feature/video-feedback/)) `[code]` `getDisplayMedia` at 30 fps, an optional microphone track, `MediaRecorder` to WebM or MP4. `preferCurrentTab` is used only on the screenshot path, so the video path shows the browser's full share picker.
- DOM replay: "A replay isn't a screen video. Userback rebuilds the page and replays what the user did". ([Feedback vs full session replay](https://support.userback.io/en/articles/17212348-feedback-session-replay-vs-full-session-replay-what-s-the-difference)) `[code]` The widget lazy-loads a separate script and calls `rrweb.record`.
- The extension does not support replay, console logs or network requests: "Those all require the installed widget." ([Extension](https://support.userback.io/en/articles/5322214-installing-the-userback-browser-extension))

**Capture mode**

- Video is deliberate: the reporter "records their screen (and, depending on their browser permissions, their voice), and stops the recording when they're done." ([Video feedback](https://support.userback.io/en/articles/15268500-video-feedback))
- Replay is retroactive and attached to every Feedback: "roughly the last three to seven minutes a user spent on your site before they opened the feedback widget."
- A separate always-on product records every visit.

**Reporter flow**

- Open the widget, pick Screen Recording (next to Screenshot and Attachment), record, stop, submit.
- `[code]` Order of prompts: microphone permission, then the screen-share picker, then a 3 second countdown. If the microphone is refused the recording proceeds muted. A `beforeunload` guard is registered while recording. Pause and a draw tool are available during recording, with strokes stored on an annotation timeline.
- Duration: a configurable "maximum length for screen recordings". `[code]` Default 180 seconds, clamped to 60 to 300 seconds, auto-submit when the timer reaches zero.
- Browsers: "Screen recording: The latest versions of Chrome, Firefox, and Edge. Not supported on mobile browsers." ([Supported browsers](https://support.userback.io/en/articles/5209193-what-browsers-does-userback-support))
- Page loads: "If moving to another page triggers a full page load, Userback loads again from scratch and the recording ends." The documented workarounds are a single-page app, the extension, or a server-side change. ([Recording across multiple pages](https://support.userback.io/en/articles/9417968-troubleshooting-video-or-screen-recording-across-multiple-pages))
- Webcam: not documented.

**What the team gets**

- Video player in the item. "When AI features are enabled, every video submission is automatically transcribed. The full transcript appears in the comments panel with timestamps". Also an AI summary and an AI title.
- Replay player with event markers (rage clicks), skip inactivity, and a share link with a start time. A Dev Tools drawer holds console logs, network requests and an events timeline. ([Play back a replay](https://support.userback.io/en/articles/17212418-play-back-and-share-a-session-replay))
- Replay limits: "They don't record iframes, video, audio, or canvas elements." "Replays only record pages where the page's DOM is smaller than 5 MB." "Can I download a replay as a video? No."
- Replay playback depends on the live site: "Userback doesn't store full copies of your stylesheets, images, or videos. It loads them from your site when you play a replay." ([Broken replays](https://support.userback.io/en/articles/10113918-troubleshoot-session-replays-are-broken-or-missing))
- MCP server with `get_feedback` and `get_feedback_logs` (console and network). No tool for video, transcript or replay is listed. ([Userback MCP](https://docs.userback.io/docs/userback-mcp))

**What leaves the product**

- "Each item sent to a project management tool includes the feedback title and description, the annotated screenshot or video recording, and metadata". "Console logs and events are included. Network request data is not currently sent to integrations." ([How integrations work](https://support.userback.io/en/articles/5264262-how-integrations-work-in-userback))
- Jira and GitHub articles both say the recording is "attached". Whether that is a file, an embed or a link: not documented.
- A replay leaves only as a private link that requires workspace access.

**Gating** ([pricing](https://userback.io/pricing/))

- Video recording: no plan is excluded in the comparison table, Free included.
- Replay attached to Feedback, console logs and network requests: Business ($89/mo annual) and up.
- Transcript, AI summary, AI title: Business and up.
- Masking controls: Business Plus ($159/mo annual).
- Always-on replay: Business Plus add-on.
- Voice: no separate gating.

**Privacy**

- Replay: block, ignore and mask rules by selector, with email and password inputs masked by default. ([Session replay](https://support.userback.io/en/articles/5762135-session-replay))
- Masking for screen video: not documented. Rules are described for screenshots and replay only.
- Consent: no in-widget prompt documented. Userback supplies disclosure copy for the customer's own privacy page. ([Privacy and cookies](https://support.userback.io/en/articles/11958045-privacy-and-cookies))
- Screen Recording and replay are each a toggle. AI features can be turned off for the workspace.

## BugHerd

**Technique**

- Documented: screen video only. `[code]` `getDisplayMedia`, an audio-only `getUserMedia`, `MediaRecorder` to WebM with an MP4 fallback, all inside the sidebar bundle that the script install loads.
- The sidebar is delivered by the extension or by a script. With the script, "browser extensions are no longer required." ([Install with JavaScript](https://support.bugherd.com/en/articles/11424426-installing-bugherd-using-javascript)) No help article states outright that video works without the extension.
- Session replay is documented only as a link to a third-party session (FullStory, LogRocket). ([FullStory integration](https://support.bugherd.com/en/articles/11430568-bugherd-and-fullstory-integration))
- `[code]` Undocumented: the script bundles rrweb and a native session replay behind a per-project experiment flag, with 20 second checkpoints and the last two segments kept (roughly the last 20 to 40 seconds). No help article, pricing row or changelog entry mentions it.

**Capture mode**

- Deliberate only, as documented.

**Reporter flow**

- "On the BugHerd sidebar, click the video button." "Click to allow microphone permissions for audio recording." "Click to accept screen recording." Then pick a screen, a window or a tab, record, stop, fill in the task, create it. ([How to give feedback](https://support.bugherd.com/en/articles/11424269-how-do-i-give-feedback-or-log-a-bug))
- "If you don't accept screen sharing or screen recording, you won't be able to use the video feedback feature."
- Duration: "Video captures are capped at 1 minute to ensure focus on the issue at hand." ([Video feedback](https://bugherd.com/feature/video-feedback)) `[code]` The current bundle carries a 180 second constant whose use was not traced.
- "Note that you can't move to a different page without stopping the recording."
- Mobile: the mobile help article lists element and whole-page Feedback only.
- macOS needs the system screen-recording permission. A manual video upload exists as a fallback. ([macOS permissions](https://support.bugherd.com/en/articles/11430658-video-feedback-and-mac-os-system-permissions))
- Account-less clients: share-link clients are asked for a name and an email on their first Feedback, and "In the background, BugHerd creates a guest account for your client." ([Feedback from clients](https://support.bugherd.com/en/articles/11424313-get-feedback-from-clients-on-websites-and-files))
- `[code]` The anonymous Public Feedback bundle contains no recording code, so video does not appear to be offered to anonymous visitors.

**What the team gets**

- Playback on the task, with operating system and browser.
- Console logs, network requests, transcripts, AI summaries of a video, reproduction steps: not documented. BugHerd's own comparison table marks console and network logs as absent.
- MCP server (beta). Per-task data includes "Screenshot or screen recording". How the recording reaches the agent (URL or file): not documented. ([MCP server](https://support.bugherd.com/en/articles/14835206-getting-started-with-the-bugherd-mcp-server))

**What leaves the product**

- Slack unfurls the task with the screenshot and links. GitHub receives the description, status and comments. Jira receives a screenshot attachment.
- What a video becomes in any of them: not documented.

**Gating** ([pricing](https://bugherd.com/pricing))

- Video feedback: all plans, from Standard ($42/mo annual). No free plan.
- Limits: 1 minute per video, unlimited count, storage of 10 GB, 25 GB, 50 GB, then unlimited.
- Jira and Linear integrations: Premium and up.

**Privacy**

- The only stated gate is the browser's own permission prompt, on HTTPS only.
- Masking and a per-project switch to disable video: not documented.

## Usersnap

**Technique**

- Screen video only, from the embedded widget. "No more 3rd party extensions necessary to get video feedback". ([Screen recording](https://usersnap.com/l/screen-recording))
- The reporter picks the surface: "the entire screen, the application window, and the browser tab."
- The API is not named. `[inference]` The documented constraints (secure context, the `display-capture` policy) point to `getDisplayMedia`.
- No native DOM replay. The only replay path is a session ID from a third party (Quantum Metric).

**Capture mode**

- Deliberate only. Retroactive capture: not documented.

**Reporter flow**

- Click Feedback, click the camera icon, choose what to share, record, optionally click the microphone icon, click stop. ([Capture video from a website](https://usersnap.com/blog/capture-video-from-website/))
- Duration: "The Screen Recording feature offers your users to record a (max. 3 min) video of their issue." A progress bar shows the remaining time. ([Feedback with a screen recording](https://help.usersnap.com/docs/feedback-with-a-screen-recording))
- "The mouse cursor is highlighted" and "The record button is also Drag-able so nothing from the webpage will be blocked while recording."
- "The screen recording (video) feature is not supported on mobile web browsers and it does not work on Safari browsers (desktop)."
- "Once the page is reloaded, the current page will be destroyed including the Usersnap widget. Hence the recording will be interrupted in such cases and only a single-page application (SPA) would avoid the intervention."
- Host-site requirements: no `display-capture 'none'` policy, the Usersnap origin allowed in a `microphone` Permissions-Policy, and the upload origin allowed in the CSP.
- Webcam and annotation while recording: not documented.

**What the team gets**

- A player in the Feedback list, with download.
- Console and network logs in a separate tab. Time alignment with the video: not documented.
- AI summary or transcript of a recording, reproduction steps: not documented.
- MCP connector with read access to Feedback. Whether it exposes recordings: not documented. ([MCP connector](https://help.usersnap.com/docs/mcp-connector))

**What leaves the product**

- Marketing says video bug reports can be shared "to Jira, Azure Devops and 50+ other integration tools." The form (link, file or embed) is not documented, and the Jira, Linear, GitHub and Slack articles do not mention video.

**Gating** ([pricing](https://usersnap.com/pricing))

- "Video feedback and annotated screenshots" is ticked on all five plans, from Starter (EUR 49/mo). Audio is part of the same row.
- No transcript and no session replay rows.

**Privacy**

- "You can define elements that are automatically hidden on every screenshot or video" through the `usprivacy` CSS class. How it applies to a pixel video is not documented. ([Privacy FAQ](https://help.usersnap.com/docs/privacy-and-security-faq))
- "The screen recording feature can be turned on and off in the project settings."
- Consent: the browser's own prompts only.

## Atarim

- **No recording feature.** A comment captures a still: "Every comment captures a screenshot of the page as it looked at that moment." ([Visual collaboration overview](https://atarim.io/help/visual-collaboration/visual-collaboration-tools-overview/))
- Video is on the public roadmap, not shipped: "Video Tasks" under "2026 Roadmap", and a user-submitted idea marked "In Development". ([roadmap](https://labs.atarim.io/roadmap/video-tasks))
- **Worth noting: Atarim uses the tab-share prompt for stills, and explains it first.** Without the extension, in Chrome or Edge, a card titled "Share exactly what you see" offers "Most accurate" and "Less accurate". Then: "Your browser then asks which screen to share: pick this tab and confirm."
  - One share covers the whole visit: "One share covers every task for the rest of the visit, and leaving Collaborate stops it. Nothing is recorded, and you can stop sharing at any time from your browser."
  - Idle stop: "If nothing happens on the page for two minutes, Still working on this page? appears with a 20-second countdown."
- Voice is dictation into the comment box, in Chrome and Edge. Whether audio is stored: not documented.
- No account for the client: a name, an email and a terms checkbox. "That is all that is required: no password, no account."
- MCP server exposing projects, pages and screenshots.

## PostHog

**Technique**

- "PostHog captures session replays by capturing the DOM, not videos or screenshots." It "uses rrweb under the hood", as a vendored fork. ([Troubleshooting](https://posthog.com/docs/session-replay/troubleshooting))
- The recorder is lazy-loaded by the main script. No extension.
- Documented fidelity limits:
  - Canvas is off by default. When enabled, "Canvas elements are recorded at a rate of 4 frames per second" as images, and are "not covered by DOM-based masking". ([Canvas recording](https://posthog.com/docs/session-replay/canvas-recording))
  - Third-party iframes: "The iframe is recorded as an empty placeholder element." ([Iframes](https://posthog.com/docs/session-replay/iframes))
  - Assets are fetched from the customer's origin at playback, so CORS failures break the replay, and a URL that is "signed, expired, or otherwise not available" means "the replay will not be able to reconstruct the DOM correctly."
  - Heavy SVG or Lottie animations "may be throttled or ignored entirely".
- Bundle size and measured overhead: not documented.

**Capture mode**

- Always-on by default, with sampling and URL, event or feature-flag triggers.
- Triggered mode is retroactive: "the client buffers recording data in-memory while waiting for a trigger to match" and "the buffer contains up to 1 minute of activity before the trigger".
- "Full page navigations (page refreshes) clear the buffer and start over from a new snapshot." ([Control which sessions you record](https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record))
- Deliberate API: `posthog.startSessionRecording()` and `posthog.stopSessionRecording()`.

**Reporter flow**

- The reporter does nothing. A survey answer or a support ticket is tied to the replay by the shared session ID.
- For a custom widget: `posthog.get_session_replay_url({ withTimestamp: true, timestampLookBack: 30 })` returns a link to the replay at a moment. ([JS features](https://posthog.com/docs/libraries/js/features))
- One recording spans tabs and page loads of the same session; the session ID is persisted in local storage and a cookie.
- Reporter-side voice, webcam, annotation, and a consent notice rendered by PostHog: not documented.

**What the team gets**

- A player with "the synced activity, console, and network panels", a DOM inspector, skip inactivity, comments.
- AI summary (Replay Vision) works on a rendered video, not on the events: "PostHog renders the recording, sends it to Gemini, and produces a result. This usually takes a couple of minutes." It is priced per observation. ([Replay Vision](https://posthog.com/docs/replay-vision/start-here))
- MCP: session replay tools return metadata ("duration, interaction counts, console log counts, and a person summary") and console logs. Replay Vision tools let an agent "answer a one-off question about specific sessions". Raw events or DOM snapshots over MCP: not documented. ([MCP tools](https://posthog.com/docs/model-context-protocol/tools))

**What leaves the product**

- Linear, GitHub, GitLab, Jira: "The issue will automatically include a link back to the session replay". ([Integrations](https://posthog.com/docs/session-replay/integrations))
- Public link, optionally password protected, embeddable in an iframe.
- "Export to MP4" for a full recording, with a monthly cap (10 on free, 15 on paid). Also JSON export. ([Sharing](https://posthog.com/docs/session-replay/sharing))

**Gating**

- "5,000 recordings free every month, then starting at $0.0050 / recording". ([Pricing](https://posthog.com/docs/session-replay/pricing))
- Retention: 30 days on free, 90 days on pay-as-you-go, up to 1 year and 5 years on higher plans.

**Privacy**

- Inputs are masked by default. "General text is not masked by default". Elements are blocked with `ph-no-capture`. ([Privacy](https://posthog.com/docs/session-replay/privacy))
- Network bodies and headers are off by default.
- Consent is the integrator's job, through `opt_in_capturing()` and `opt_out_capturing()`.

## Sentry

**Technique**

- "A session replay is not a video recording. It's a video-like reproduction of a user session, built using the rrweb recording library." ([Session Replay](https://docs.sentry.io/product/session-replay/web/))
- The Feedback screenshot is a real pixel capture: the source calls `getDisplayMedia({ video, audio: false, preferCurrentTab: true })` for one frame. ([useTakeScreenshot.tsx](https://github.com/getsentry/sentry-javascript/blob/develop/packages/feedback/src/screenshot/components/useTakeScreenshot.tsx)) A source comment notes that "Safari drops the user gesture that `getDisplayMedia` needs 1s after the click".
- No extension. Loader script or CDN bundle.
- Bundle size: "about 50 kb (gzipped)" on one page, "an additional ~36KB gzipped" on another. ([Performance overhead](https://docs.sentry.io/product/session-replay/web/performance-overhead/))
- Buffer mode holds "approximately 2-5MB" in memory. Emitting 10,000 or more mutated nodes at once ends the replay.
- Documented fidelity limits: canvas is opt-in, with "no PII scrubbing in canvas recordings"; "Streamed videos and similar are not supported"; cross-origin iframes must be blocked; fonts that fail CORS shift the layout so clicks appear in the wrong place. ([Troubleshooting](https://docs.sentry.io/platforms/javascript/session-replay/troubleshooting/))

**Capture mode**

- Buffer mode: "Replay will continuously record data, but won't send any of it. It stores the last 60 seconds of event logs in a memory ring buffer". ([Understanding sessions](https://docs.sentry.io/platforms/javascript/session-replay/understanding-sessions/))
- With the Feedback widget: "the Replay SDK will buffer up to 30 seconds of the user's session until the user _opens_ the User Feedback widget." Product pages say 60 seconds; the source constant is 60 seconds. ([User Feedback](https://docs.sentry.io/platforms/javascript/user-feedback/))
- The flush happens when the widget opens, whether or not the Feedback is submitted, and the replay then keeps recording. ([addGlobalListeners.ts](https://github.com/getsentry/sentry-javascript/blob/develop/packages/replay-internal/src/util/addGlobalListeners.ts))
- Deliberate API: `replay.start()`, `replay.startBuffering()`, `replay.flush()`, `replay.stop()`.

**Reporter flow**

- A button opens a form with name, email and message, all optional by default. No account. The replay is invisible to the reporter.
- Screenshot with "Highlight" and "Hide" tools. "Screenshots aren't supported on mobile devices, so the screenshot button will be hidden automatically". The source states: "Mobile browsers do not support `mediaDevices.getDisplayMedia` even though they have the api implemented". ([isScreenshotSupported.ts](https://github.com/getsentry/sentry-javascript/blob/develop/packages/feedback/src/util/isScreenshotSupported.ts))
- A replay continues across page loads in the same tab: "The session will capture any pageloads, refreshes, or navigations as long as the SDK is re-initialized on the same domain, and in the same browser tab". The session key lives in `sessionStorage`. Whether the pre-feedback buffer survives a page load: not documented.
- Cap: 60 minutes per replay.
- Voice, webcam, screen video: not documented.

**What the team gets**

- A replay page with player, breadcrumbs, console, network, errors, trace and memory: "Almost every component on this page is connected through timestamps." Clicking an element in the player shows its DOM state. ([Replay details](https://docs.sentry.io/product/session-replay/replay-details/))
- AI summary with chapters built from breadcrumbs, network requests and console logs, where "pink chapters highlight user feedback submissions". It is built from event data, not from pixels.
- MCP: the source defines `get_replay_details`, "a Sentry replay's summary and a timeline of what the user did". Each timeline event carries `offsetSeconds`, `label`, `target` (a selector, URL or message) and `details`, and the timeline can be windowed, with negative offsets counted from the end. It returns no DOM snapshot. ([get-replay-details.ts](https://github.com/getsentry/sentry-mcp/blob/main/packages/mcp-core/src/tools/catalog/get-replay-details.ts))

**What leaves the product**

- An issue created from a Feedback carries "a link to the feedback in Sentry and the user's message."
- Replays are shared with organization members only. Public link, embed, and video export from the UI: not documented. The API returns recording segments as rrweb events.

**Gating** ([pricing](https://sentry.io/pricing/))

- 50 replays included on Developer (free), Team ($26/mo annual) and Business ($80/mo annual), then about $0.003 per replay.
- Retention: 90 days on paid plans, 30 days on free.
- Screenshots count against the attachment quota (1 GB included).

**Privacy**

- Mask-everything by default: "the Session Replay SDK will mask all text content with `*` and block all media elements". `maskAllText`, `maskAllInputs` and `blockAllMedia` all default to `true`. ([Privacy](https://docs.sentry.io/platforms/javascript/session-replay/privacy/))
- Network bodies and headers only for allow-listed URLs.
- The replay masking does not apply to the pixel screenshot; the reporter has a "Hide" tool instead.
- No built-in consent notice documented.

## State of the art

Read across the eight products, the best documented version of each part is:

- **Least reporter effort**: a retroactive DOM replay attached with no step and no prompt (Marker.io, Userback, Sentry, PostHog). Windows range from 30 seconds (Sentry) to 7 minutes (Userback).
- **Richest deliberate capture from a script**: Userback's screen video, with microphone, pause, drawing on a timeline, a countdown, a configurable cap, then a transcript, an AI summary and an AI title.
- **Both techniques on one Feedback**: Userback only, from the script alone. Jam has both, but its DOM replay needs the extension.
- **Team playback**: a player whose console and network panels follow the timeline. Sentry and PostHog state the alignment explicitly; Jam, Userback, Marker.io and Usersnap show the logs next to the recording without documenting the alignment.
- **Agent surface**: Jam's MCP (frames at chosen timestamps, an overview grid, a WebVTT transcript, chapters, and console, network and user events merged in time order). Sentry's MCP is the DOM replay counterpart: a windowed text timeline with offsets and selectors. PostHog answers questions about a replay by rendering it to video and sending it to a vision model.
- **Leaving the product**: a link back to the vendor's player. Marker.io documents this as a deliberate choice. PostHog is the only one documenting a public link, an iframe embed and an MP4 export of a DOM replay.
- **Masking**: Sentry's mask-everything default for DOM replay. For pixels, Jam's in-page blur before capture, which reuses other vendors' masking selectors.

## Hard limits

**Screen video (browser screen capture)**

- **A browser prompt on every recording.** Each product shows the browser's share picker, and a second permission prompt for the microphone. BugHerd states that refusing it means no video.
- **No mobile browsers.** Stated by Usersnap, Userback, BugHerd, and by Sentry's source for the same API.
- **Safari is partial.** Usersnap: "does not work on Safari browsers (desktop)". Userback lists Chrome, Firefox and Edge only. Jam: "Supported in most Safari windows."
- **A full page load ends the recording.** Stated by Usersnap, Userback and BugHerd. Jam continues across pages through iframes on a separate recorder origin, and requires its script on every page.
- **Deliberate only.** No product offers retroactive screen video without an extension.
- **Short caps.** 1 minute (BugHerd), 3 minutes (Usersnap, Userback default), 10 minutes (Jam links `[code]`).
- **Host-site and OS requirements.** HTTPS, no `display-capture` or `microphone` Permissions-Policy block, and the macOS screen-recording permission for the browser.
- **Masking is weak.** Only Jam documents a mechanism for pixels, with documented leaks (iframes, page loads, resizes). The picker can also capture a whole screen rather than the tab.

**DOM replay**

- **Not captured, or captured poorly**: canvas and WebGL (opt-in images at a few frames per second in PostHog and Sentry, absent in Marker.io and Userback), cross-origin iframes, streamed video and audio, Shadow DOM (Marker.io), pages over 5 MB of DOM (Userback).
- **Playback depends on the live site.** Stylesheets, images and fonts are fetched from the customer's origin when the replay is watched, so CORS rules, expired URLs and later deploys change what the replay shows (PostHog, Sentry, Userback).
- **No voice.** No DOM replay product documents audio capture.
- **No file to hand over.** A replay is event data. A video file exists only if the vendor renders one (PostHog's MP4 export; Userback says no).
- **Page loads.** An in-memory buffer is lost on a full page load (PostHog). Products that survive it persist a session key and re-initialize (Sentry, PostHog session mode) or upload continuously (Marker.io `[code]`).
- **Weight.** Sentry documents 36 to 50 KB gzipped for the replay SDK and 2 to 5 MB of memory for the buffer. PostHog and Userback lazy-load the recorder.

## What none of them does

Each gap below is an absence in the documentation read, not a proof that the capability does not exist.

- **Voice with a DOM replay.** Narration and a transcript exist only on pixel video. No product pairs a microphone track with a DOM replay.
- **A Recording tied to a selected element.** No product documents linking a recording to the element the reporter pointed at. Jam's Recording Links have no element selection; Marker.io's replay is not connected to the annotated screenshot.
- **DOM state for an agent.** Sentry's MCP returns a text timeline with selectors, and Jam's returns still frames. No MCP surface documents returning the DOM or an element's state at a given moment of a recording.
- **One agent call for the whole evidence.** Jam comes closest (events merged in time order, plus frames), but only for pixel video, only with its script on a connected domain, and through a link-based flow rather than an in-page widget.
- **Reproduction steps without a model.** Jam generates steps from the video through a vision model. No product documents steps derived from recorded DOM events, or steps the reporter confirms before sending.
- **AI that reads the replay cheaply.** Marker.io's AI does not see the replay at all. PostHog renders the replay to video for a vision model, at a per-observation price. Sentry summarizes from events, for the team rather than for a coding agent.
- **Something durable in the Tracker.** Every documented case is a link back to the vendor. None documents still frames, a step list or a transcript written into the Issue body.
- **The reporter marking the moment.** No product documents a "the bug is here" marker placed by the reporter during capture. Userback's bookmarks are placed by the team afterwards.
- **Self-hosting.** PostHog and Sentry are self-hostable as whole platforms. No Feedback-widget product in this set documents a self-hosted recording feature.

## Flows that fit the map's constraints

All of these work with no browser extension and a Reviewer without an account. They are listed by technique so the capture-technique ticket can weigh them; this note does not rank them.

**Either technique**

- **Explicit start and submit as the consent act.** Jam: nothing is stored until the reporter starts and then submits.
- **A link back, with a text summary inline.** Marker.io's Tracker format. It fits the 1 hour expiry of signed asset URLs noted on the map.
- **A deep link at a moment.** PostHog's `withTimestamp` and `timestampLookBack`, Userback's "Start at".
- **A per-Project switch to turn recording off.** Usersnap, Userback, Marker.io.
- **Reusing other vendors' masking selectors as defaults.** Jam honours `.rr-block`, `.sentry-mask`, `[data-private]` and others, so a site already instrumented for another tool is masked from day one.
- **A text timeline for the agent.** Sentry's MCP shape: offset in seconds, label, target selector, details, windowed, with negative offsets counted from the end.

**Screen video**

- **Explain the browser picker before it appears.** Atarim's "Share exactly what you see" card, with a "Less accurate" way out, "Nothing is recorded" reassurance and "Don't show this again".
- **Userback's recording sequence.** Microphone prompt, picker, 3 second countdown, visible timer, auto-submit at the cap, pause, a muted fallback when the microphone is refused, a `beforeunload` guard.
- **Usersnap's recording chrome.** A draggable stop button, a highlighted cursor, a progress bar.
- **A short cap by default.** BugHerd's 1 minute, justified as focus.
- **A file upload fallback** where screen capture is unavailable (BugHerd, Marker.io).
- **Frames and transcript for the agent.** Jam's `getFrames` (timestamps, a window, or an overview grid) and WebVTT transcript.
- **Microphone enabled by the customer, not asked of the reporter.** Jam's link parameter.

**DOM replay**

- **Attach the last minutes silently.** Marker.io and Userback: no step for the reporter.
- **Flush the buffer when the Widget opens.** Sentry: the replay ends where the reporter decided to report, not after they typed the comment.
- **Lazy-load the recorder.** PostHog and Userback keep it out of the initial bundle.
- **Mask everything by default.** Sentry's defaults, with opt-out per element.
- **Survive page loads with a persisted session key.** Sentry (`sessionStorage`, per tab) and PostHog.

## Conflicts inside vendor documentation

- **Marker.io**: the replay window is 2.5 minutes (help center) or 3 minutes (feature page, launch post). The masking tier is "Business" (pricing) or "Enterprise" (help article).
- **Jam**: Team recordings are "up to 15 minutes" (plan card) or 30 minutes (comparison grid, docs). Recording Links "work on any device" and are "Compatible with the desktop versions" in the same note.
- **Sentry**: the pre-feedback buffer is 30 seconds (SDK docs) or 60 seconds (product docs, source). The replay bundle is 36 KB or 50 KB gzipped.
- **BugHerd**: the cap is 1 minute (docs) while the shipped bundle carries a 180 second constant.
- **Userback**: MCP is on "all Userback plans" (help article) or Team and up (pricing table).
- **Usersnap**: console logs are on all plans (pricing) or "a gated feature" (help article).

## Not verified

- **Whether a Tracker receives a file, an embed or a link** for Jam, Userback, BugHerd and Usersnap video. Only Marker.io, PostHog and Sentry document the form (a link).
- **The capture API** for Jam, Userback, BugHerd and Marker.io rests on reading minified scripts, not on vendor statements. For Usersnap it is an inference.
- **Numbers taken from code**: Userback's 60 to 300 second clamp, Jam's 10 minute default for Recording Links (the constant's value was not re-checked), BugHerd's experiment buffer of 20 to 40 seconds.
- **BugHerd's native session replay** is undocumented. Its rollout, plan and masking are unknown.
- **Whether BugHerd's anonymous Public Feedback visitors can record video.** The script suggests not.
- **Time alignment of logs with the recording** for Marker.io, Userback, Usersnap and Jam's share page.
- **Mobile browser behaviour of DOM replay** for Marker.io, PostHog and Sentry. None states it.
- **Whether the pre-feedback buffer survives a full page load** for Sentry and Marker.io.
- **Whether MCP exposes the recording** for Marker.io, Userback, Usersnap and BugHerd (BugHerd lists it without saying in what form).
- **A consent notice shown to the visitor** for any background DOM replay. None is documented.
- **Per-plan checkmarks rendered as icons**: Jam's Instant Replay, transcription and chapters rows; Userback's video row on Free.
- **Retention of video files** for Userback, BugHerd and Usersnap.
- **Shadow DOM, font and `<video>` fidelity** for PostHog, and Shadow DOM for Sentry.
- **Atarim**: whether dictated audio is stored, and whether a video file is accepted as an attachment.
