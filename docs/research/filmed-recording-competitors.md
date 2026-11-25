# Filmed Recording at competitors

> How comparable feedback tools deliver a deliberate screen recording with voice, and what limits they attach to it, read from vendor pages on 2026-11-25. Research for [#494](https://github.com/manucoffin/faster-fixes/issues/494), part of the map [#490](https://github.com/manucoffin/faster-fixes/issues/490). This note reports facts. It does not choose a capture technique or a Plan limit.

## How to read this note

- **Scope**: BugHerd, Marker.io, Jam, Usersnap, Userback, Ruttl, Feedbucket, plus Ybug as a close competitor found during the search.
- **Angle**: the deliberate recording only (the counterpart of a **filmed Recording**) and its limits per plan. The retroactive DOM replay products (the counterpart of an **automatic Recording**) are covered in the earlier note `docs/research/recording-at-competitors.md` on branch `research/recording-at-competitors` (2026-11-10, for #363).
- **Vocabulary**: "reporter" is the vendor-side person who records, the counterpart of a **Reviewer**. "Screen video" is a pixel capture through the browser's screen-sharing prompt. "DOM replay" is a reconstruction of the page from recorded DOM mutations.
- **Evidence labels**:
  - No label: stated on a vendor page fetched on 2026-11-25. The URL follows the claim.
  - `[prior note]`: taken from the 2026-11-10 note, where it was read from a vendor page or from the vendor's served script. Not re-checked today.
  - `[inference]`: a conclusion drawn from documented facts, not stated by the vendor.
  - "Not documented": looked for on the vendor's pricing, feature and help pages and not found.
- Prices are list prices in the vendor's currency, as shown on the pricing page on 2026-11-25.
- No review site or third-party comparison backs any claim below.

## Summary

| Vendor    | Widget only or extension                                                                                  | What is captured                                                                                              | Transcript or AI summary                                                                   | Limits per plan                                                                                                                         | Entry plan and price for recording                                               |
| --------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| BugHerd   | Sidebar, loaded by the script install or by the extension. Desktop. Mobile video not documented.          | Screen video (screen, window or tab), microphone. OS and browser. No console or network.                      | Not documented                                                                             | 1 min per video, unlimited count, same on every plan. Plan storage 10, 25, 50 GB, then unlimited.                                       | Standard, $50/mo monthly ($42/mo annual). No free plan.                          |
| Marker.io | No deliberate recording. "doesn't currently have a built-in screen recording feature". In development.    | DOM replay of the last 2.5 min only, no voice. Loom link or file upload as the workaround.                    | No                                                                                         | Not applicable (replay: 100 simultaneous sessions)                                                                                      | Replay: Team, $199/mo monthly ($149/mo annual)                                   |
| Jam       | Recording Links: no extension for the reporter, but a link or a Jam page, not a widget. Desktop browsers. | Screen video. Microphone if the link creator enables it. Console and network only with Jam's scripts on site. | Transcript when voice is on, chapters, AI title and repro steps                            | Free: 5 links/month, 5 min, 30 AI uses. Team: 150 links/month, 30 min (15 on the plan card), 200 AI uses per person. Enterprise: unlimited. | Free, $0. Team, $14 per creator per month (yearly).                              |
| Usersnap  | Widget only. Desktop Chrome, Firefox, Edge. No desktop Safari, no mobile.                                 | Screen video (screen, window or tab), optional microphone, highlighted cursor. Console logs separately.       | Not documented                                                                             | 3 min per video, same on every plan. Count, storage, retention not documented.                                                          | Starter, EUR 49/mo                                                               |
| Userback  | Widget only. Latest Chrome, Firefox, Edge. "Not supported on mobile browsers."                            | Screen video, optional voice, console logs and browser details. Separate DOM replay on higher plans.          | Transcript with timestamps, AI summary, AI title, on Business and Business Plus            | Max length set by the customer in the widget editor. Values not documented (`[prior note]` default 3 min, range 1 to 5 min).            | Recording: all plans `[inference]`. Transcript: Business, $119/mo ($89 annual).  |
| Ruttl     | Inside Ruttl's own comment mode. Whether an installed script can record: not documented.                  | Screen video with spoken comments                                                                             | Not documented                                                                             | Not on the live pricing page. A dev-subdomain pricing page lists "10 mins of Video Commenting" on Pro. Workspace storage 1, 50, 100 GB. | Not documented. Pro is $18 per user per month.                                   |
| Feedbucket | Widget only, "No extension needed". Chrome, Firefox, Safari. No mobile.                                   | Screen video, optional microphone, pause and resume, continues across pages                                   | Not documented                                                                             | No cap documented on any page read                                                                                                      | Pro, $49/mo. No free plan.                                                       |
| Ybug      | Widget only. Browsers and mobile not documented.                                                          | Screen video, optional microphone, JS errors, warnings and network requests during the recording              | Not documented                                                                             | No cap documented. "Custom data retention" on the plans that record.                                                                    | Startup, EUR 29/mo monthly (EUR 23 annual). Free and Basic excluded.             |

## Market norm

1. **Widget-only recording is the norm, and it is always a pixel video.** BugHerd, Usersnap, Userback, Feedbucket and Ybug all record from the embedded script with no extension. Every one of them goes through the browser's screen-share prompt (the reporter picks a screen, a window or a tab) and a separate microphone permission. No vendor in this set pairs voice with a DOM replay.
2. **Voice is always optional and never priced separately.** The microphone is a toggle or a permission the reporter may refuse. No pricing page has a voice row.
3. **Desktop only.** Usersnap, Userback and Feedbucket state that recording does not work on mobile browsers. BugHerd's mobile article lists no video. Desktop Safari is excluded by Usersnap and absent from Userback's list; Feedbucket and Jam include it.
4. **The limit is duration per recording, not a count or a quota.** Documented caps: 1 min (BugHerd), 3 min (Usersnap), customer-configurable (Userback), 5 and 30 min (Jam). Feedbucket and Ybug document none. Only Jam meters a count (links per month). No vendor documents a per-recording file size, a monthly minutes allowance (Ruttl's "10 mins" on an unofficial page aside) or a retention period specific to recordings.
5. **Recording is rarely the paid gate.** It sits on the entry plan at BugHerd, Usersnap, Feedbucket and Userback, and on the second paid plan at Ybug. What moves up-plan is what surrounds it: transcript and AI summary (Userback Business), console and network logs (Userback Business, Feedbucket Business), longer duration and more links (Jam Team).
6. **Transcripts are the exception.** Only Jam and Userback transcribe. Jam meters AI uses per plan (30, then 200 per person per month); Userback bundles transcription into its AI features on the two top plans with no stated allowance.
7. **A full page load ends the recording, except where the recorder lives outside the page.** BugHerd, Usersnap and Ybug say so. Feedbucket holds the capture in a pop-up window and Jam in an iframe on a recorder origin, and both keep recording across pages.

## BugHerd

- **Delivery**: the sidebar's video button. The sidebar is loaded by the script install or by the extension. With the script, "browser extensions are no longer required" `[prior note]` ([Install with JavaScript](https://support.bugherd.com/en/articles/11424426-installing-bugherd-using-javascript)). No article states outright that video works without the extension; the recorder code sits in the sidebar bundle `[prior note]`.
- **Flow**: "On the BugHerd sidebar, click the video button", "Click to allow microphone permissions for audio recording", "Click to accept screen recording", then pick the entire screen, a window or a tab. "If you don't accept screen sharing or screen recording, you won't be able to use the video feedback feature." ([How to give feedback](https://support.bugherd.com/en/articles/11424269-how-do-i-give-feedback-or-log-a-bug))
- **Captured**: screen video and voice. "BugHerd captures the operating system and browser". Console and network logs: not documented. ([Video feedback](https://bugherd.com/feature/video-feedback))
- **Limits**: "Video captures are capped at 1 minute to ensure focus on the issue at hand." "There's no limit to the number of video captures you can create." The help article describes "a one-minute countdown timer". "you can't move to a different page without stopping the recording."
- **Mobile**: the mobile article lists element and page Feedback only. ([Mobile](https://support.bugherd.com/en/articles/11424274-leaving-feedback-using-a-mobile-phone-or-tablet))
- **Plans**: "Video feedback" is ticked on Standard ($50/mo monthly, $42 annual), Studio ($80, $67), Premium ($150, $125) and Custom. The cap does not vary by plan. Plan storage is 10 GB, 25 GB, 50 GB, then unlimited; whether video counts against it is not stated. Retention: not documented. ([Pricing](https://bugherd.com/pricing))
- **Transcript, AI summary**: not documented.
- **Technique**: screen video. `[prior note]` `getDisplayMedia`, an audio-only `getUserMedia`, `MediaRecorder` to WebM with an MP4 fallback.

## Marker.io

- **No deliberate recording.** "While Marker.io doesn't currently have a built-in screen recording feature, we're actively considering it for future updates." Article dated October 23, 2026. The listed workarounds are Session Replay, a Loom link pasted into the description, or an uploaded video, GIF or voice note. ([Record videos or GIFs](https://help.marker.io/en/articles/952693-how-to-record-videos-or-gifs))
- **In development**: "We are also developing a video recording feature that can be attached when reporting issues." It "will capture all visible UI", Shadow DOM dialogs and canvas included, which describes a pixel video. No date. ([Session replay](https://help.marker.io/en/articles/6673880-session-replay-videos))
- **What exists**: a retroactive DOM replay of "up to the last 2.5 minutes of activity before the issue was created", no voice, limited to 100 simultaneous visitor sessions, on Team ($199/mo monthly, $149 annual) and up. Starter ($59, $39) has none. ([Pricing](https://marker.io/pricing))

## Jam

- **Delivery**: three surfaces. The browser extension and the Mac app are out of the map's scope. **Recording Links** need nothing from the reporter: "Recipients do not need a Jam account or the browser extension." ([Recording Links](https://jam.dev/docs/recording-links))
- **Not a widget**: the entry point is a link. On a connected domain the customer installs `recorder.js`, which "shows the recording interface when a Recording Link is opened, and lets users record directly from your site", and `capture.js`. The recorder UI cannot be customized. ([Custom recording domain](https://jam.dev/docs/custom-recording-domain))
- **Browsers**: "Compatible with the desktop versions of Chrome, Edge, Firefox, and Safari." On a connected domain: "Supported in most Safari windows. Not supported in Safari Private Windows." The same docs page also says links "work on any device"; mobile is not otherwise documented.
- **Captured**: "By default, Recording Links capture screen recordings only." The microphone is enabled by the link creator with `jam-mic-enabled=enabled`, not chosen by the reporter. Console logs, network requests and click and key events require the connected domain: without it, "screen recordings still work, but developer logs aren't included."
- **Transcript and AI**: "Recordings with voiceover also generate a transcript." "Jam automatically generates chapters for every video recording". ([Video](https://jam.dev/docs/video)) AI title and AI repro steps, "available only for video Jams". ([Jam AI](https://jam.dev/docs/jam-ai)) Whether these apply to Recording Link submissions is not stated on either page; the MCP tool `getVideoTranscript` returns WebVTT for any video Jam recorded with the microphone `[prior note]`.
- **Limits** ([Pricing](https://jam.dev/pricing)):
  - Free ($0): 30 Jams, 5 Recording Links per month, recordings up to 5 minutes, 30 AI uses.
  - Team ($14 per creator per month, billed yearly): unlimited Jams, 150 Recording Links per month, 200 AI uses per person per month. Duration is "up to 15 minutes" on the plan card and 30 minutes for the extension in the comparison table and the docs.
  - Enterprise (custom): unlimited Recording Links, automatic data deletion.
  - A link is reusable, does not expire and accepts unlimited submissions. Whether the monthly figure counts links created or recordings received is not stated.
  - Duration cap for a Recording Link submission: not documented (`[prior note]` the recorder script falls back to 10 minutes).
  - Storage and retention: not documented below Enterprise.
- **Technique**: screen video. `[prior note]` `getDisplayMedia` and `MediaRecorder`, run inside an iframe on a recorder origin so the recording survives page changes.

## Usersnap

- **Delivery**: the embedded widget. ([Feedback with a screen recording](https://help.usersnap.com/docs/feedback-with-a-screen-recording))
- **Browsers**: "The screen recording (video) feature is not supported on mobile web browsers and it does not work on Safari browsers (desktop)." It "is only available in a secure context", and the host site must not send `display-capture 'none'`.
- **Captured**: the reporter chooses "the entire screen, the application window, and the browser tab". "If they allow Usersnap to use their microphone, the video will then include the audio as well." "The mouse cursor is highlighted." Console logs are a separate feature.
- **Limits**: "The Screen Recording feature offers your users to record a (max. 3 min) video of their issue." A page reload interrupts the recording; "only a single-page application (SPA) would avoid the intervention."
- **Plans**: "Video feedback and annotated screenshots" is ticked on all five plans: Starter (EUR 49/mo), Growth (EUR 129), Professional (EUR 219), Premium (EUR 459), Enterprise. The 3 minute cap does not vary by plan. Count, storage and retention: not documented. ([Pricing](https://usersnap.com/pricing))
- **Transcript, AI summary of a recording**: not documented.
- **Technique**: screen video `[inference]`. The API is not named; the secure context and `display-capture` constraints match `getDisplayMedia`.

## Userback

- **Delivery**: the embedded widget. Screen Recording is a capture tool "directly from the widget", next to Screenshot and Attachment, turned on by a toggle in the widget editor. ([Video feedback](https://support.userback.io/en/articles/15268500-video-feedback), [llms-full.txt](https://userback.io/llms-full.txt))
- **Browsers**: "Screen recording: The latest versions of Chrome, Firefox, and Edge. Not supported on mobile browsers." ([Supported browsers](https://support.userback.io/en/articles/5209193-what-browsers-does-userback-support))
- **Captured**: the screen and, "depending on their browser permissions", the reporter's voice. The feature page adds that it "Automatically collects console logs, browser details, and system information with each recording." ([Feature page](https://userback.io/feature/video-feedback/)) Console and network logs sit on Business and up `[prior note]`.
- **Transcript and AI**: "When AI features are enabled, every video submission is automatically transcribed", with timestamps in the comments panel, plus an AI summary and an AI title when the reporter gave none. Transcripts feed AI search and theme grouping. "AI Features are available on Business and Business Plus Plans." No per-minute or per-month allowance is stated.
- **Limits**: the widget editor's Media setting controls "the maximum length for screen recordings". ([Widget editor](https://support.userback.io/en/articles/10660327-create-and-edit-your-userback-widget)) The values are not documented. `[prior note]` The served script defaults to 180 seconds, clamps to 60 to 300 seconds and auto-submits at zero. A full page load ends the recording `[prior note]`. Count, storage and retention of video files: not documented.
- **Plans** ([Pricing](https://userback.io/pricing/)): Free, Team ($49/mo monthly, $39 annual), Business ($119, $89), Business Plus ($199, $159), Enterprise. Video recording is described as part of the widget; the per-plan checkmarks do not render as text, so "all plans, Free included" is `[inference]`.
- **Technique**: screen video for the deliberate recording. A separate DOM replay ("A replay isn't a screen video") is attached to Feedback on Business and up `[prior note]`.

## Ruttl

- **Delivery**: inside Ruttl. "Ruttl's comment mode has been enriched with screen recording capability." "While Ruttl records your screen, you can hover over elements and speak of the changes required." Launch post of May 27, 2021. ([Video commenting](https://www.ruttl.com/blog/video-feedback)) Whether a script installed on the customer's site can record, and which browsers are supported: not documented.
- **Captured**: screen video with spoken comments. Webcam: not verified on a Ruttl page that could be fetched.
- **Limits**: the live pricing page has no video row. It lists Basic (free, 5 users, 1 project), Pro ($18 per user per month) and Business (custom), with workspace storage of 1 GB, 50 GB and 100 GB. ([Pricing](https://ruttl.com/pricing))
- **Unverified**: a pricing page on a development subdomain lists "10 mins of Video Commenting" on Pro and nothing on Free. It is undated and its prices differ from the live page, so the figure may be stale. ([dev pricing](https://site.dev.ruttl.com/website-feedback-tool-pricing/))
- **Transcript, AI summary**: not documented.

## Feedbucket

- **Delivery**: the embedded widget. "Clients can record a video of the screen (with or without audio) directly in the browser." "No extension needed". "No downloads or software needed." ([Features](https://feedbucket.app/features))
- **Flow**: camera icon in the toolbar, "Start recording", a pop-up window that asks for the screen share, the browser's own picker, a 3 second countdown, pause and resume, "Stop recording", preview, then a title and an optional description. "Do NOT close the pop-up window. If you do, the recording will be lost." ([How to submit feedback using video recording](https://help.feedbucket.app/en/article/how-to-submit-feedback-using-video-recording-roajz9/))
- **Across pages**: "Go between pages and keep recording." "you can browse around the website if you want to and the recording should still work." `[inference]` The pop-up window holds the capture, which is why a page load does not end it.
- **Browsers**: Chrome, Firefox and Safari are named. Firefox does not return to the site automatically. Recordings made in Chrome or Firefox may not play in Safari. "Recording feedback does not work on a mobile device." "HTTPS is required by most browsers to share your screen and microphone."
- **Captured**: the help article recommends sharing only the current tab. "If you want use your microphone when recording you first have to allow access to your microphone." Console logs are captured "when feedback is submitted"; whether they cover the span of a recording is not stated.
- **Limits**: no maximum duration, count, file size or retention is stated on the pricing, features or help pages read.
- **Plans**: "Video feedback" is "Included" on Pro ($49/mo), Business ($89/mo) and Enterprise. No free plan. ([Pricing](https://www.feedbucket.app/pricing/))
- **Transcript, AI summary**: not documented.
- **Technique**: screen video `[inference]`, from the share prompt and the HTTPS and mobile constraints.

## Ybug

- **Delivery**: the embedded widget. "Screen recording is part of the Ybug feedback widget and available on the STARTUP and COMPANY plans." ([Screen recording](https://ybug.io/features/screen-recording))
- **Captured**: screen video through the browser's standard share dialog, "Optional mic narration for a guided walkthrough", and "JS errors, warnings, and network requests captured while recording", plus browser, OS, viewport and URL.
- **Limits**: no maximum duration or count is stated. "A full page load, like navigating to a different URL, ends the recording in progress."
- **Plans**: Free (EUR 0) and Basic (EUR 13/mo monthly, EUR 10 annual) have no video. Startup (EUR 29, EUR 23) and Company (EUR 59, EUR 47) do, both with "Custom data retention". ([Pricing](https://ybug.io/pricing))
- **Browsers and mobile, transcript, AI summary**: not documented.

## What the limits look like, side by side

| Dimension                 | Documented values                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Duration per recording    | 1 min (BugHerd). 3 min (Usersnap). Configurable (Userback). 5 min free, 30 min paid (Jam). None stated (Feedbucket, Ybug).    |
| Duration varies by plan   | Jam only                                                                                                                      |
| Count                     | Unlimited (BugHerd, stated). Links per month: 5, 150, unlimited (Jam). Not stated elsewhere.                                  |
| Storage                   | Plan-wide only: 10, 25, 50 GB (BugHerd); 1, 50, 100 GB (Ruttl). No vendor states a quota for recordings alone.                |
| Retention                 | Not documented for recordings by any vendor. Jam offers automatic deletion on Enterprise; Ybug "Custom data retention".       |
| Transcription allowance   | Jam: 30 AI uses on Free, 200 per person per month on Team. Userback: included in Business, no stated allowance.               |
| Plan that unlocks it      | Entry paid plan (BugHerd, Usersnap, Feedbucket), free plan (Jam, Userback `[inference]`), second paid plan (Ybug)             |
| Entry price with recording | $0 (Jam, Userback), EUR 29 (Ybug), $49 (Feedbucket), EUR 49 (Usersnap), $50 (BugHerd), all monthly billing                    |

## Conflicts inside vendor documentation

- **Jam**: Team recordings are "up to 15 minutes" on the plan card and 30 minutes in the comparison table and the docs. Recording Links "work on any device" and are "Compatible with the desktop versions" on the same page.
- **BugHerd**: additional members are priced per month in one place and "$80/year for each additional user" in another. The 1 minute cap is documented while the served bundle carries a 180 second constant `[prior note]`.
- **Ruttl**: the live pricing page shows Pro at $18 per user per month with no video row; the dev-subdomain page shows $6 and "10 mins of Video Commenting".

## Not verified

- **Whether BugHerd video works from the script install alone.** No help article says so outright; it rests on the reading of the sidebar bundle in the earlier note.
- **Userback's duration values** (default 3 min, range 1 to 5 min) and **Jam's 10 minute default for Recording Links** come from served scripts read on 2026-11-10, not from vendor statements, and were not re-read today.
- **Userback's video row per plan**, Free included: the checkmarks did not render as text.
- **A duration cap at Feedbucket and Ybug.** None is documented; an undocumented cap may exist in the product.
- **Whether Jam's transcript, chapters and AI title apply to Recording Link submissions**, and whether the monthly link figure counts links or recordings.
- **Ruttl**: the surface that records, browsers, webcam, and any current minutes allowance.
- **Retention and per-file size of video** for every vendor.
- **Mobile behaviour** for BugHerd video, Ybug and Jam Recording Links: absent from the docs rather than stated.
- **The capture API** for every vendor: none names it. It is read from code for BugHerd, Jam and Userback in the earlier note, and inferred for Usersnap, Feedbucket and Ybug.
- **Gleap** was not examined: the pricing page redirected and was not followed.
