# Filming the screen from the Widget alone

> What a script running in the customer's page (the Widget, in a shadow root, no extension) can do to make a **filmed Recording** with the Reviewer's voice, and at what cost. Research for [issue 492](https://github.com/manucoffin/faster-fixes/issues/492), part of the map [Filmed Recording](https://github.com/manucoffin/faster-fixes/issues/490).

Researched on 2026-11-25. This note reports facts and does not pick a capture technique.

It builds on [`docs/research/browser-screen-capture.md`](https://github.com/manucoffin/faster-fixes/blob/research/browser-screen-capture/docs/research/browser-screen-capture.md) (branch `research/browser-screen-capture`, researched 2026-11-10 for the automatic Recording). That note holds the full support tables and spec quotes. This one re-checks what matters for a deliberate, narrated capture, and adds what the earlier note did not cover: the cursor, the microphone flow, surviving a page load, realistic sizes, and `chrome-capture`.

Reading conventions:

- **Verified** means read in a primary source on 2026-11-25 (W3C spec, MDN browser-compat-data 8.1.10, vendor docs, browser source code, the repository itself).
- **Carried** means verified in the 2026-11-10 note and not re-read today.
- **Inference** means a consequence drawn from verified facts, not tested in a browser.
- Everything else is listed in [Unverified](#unverified).

## Answer in short

- `getDisplayMedia()` plus `MediaRecorder` is the only way a page script can film the screen. It works on desktop Chrome, Edge, Firefox and Safari. It does not work on Android. On iOS it is listed from Safari 27 on thin evidence.
- Only Chromium can film the Reviewer's own tab. Firefox and Safari film a window or a whole screen, browser chrome included.
- Every filmed Recording starts with a click and a browser share prompt. No browser can remember the grant. The microphone is a second prompt, which the browser can remember for the customer's origin.
- A full page load or reload kills the capture, the recorder and the Widget. Nothing resumes it without a new click and a new prompt. Competitors accept this and document it; none works around it without an extension.
- The cursor is drawn into the film by the browser. Clicks are not shown: the Widget would have to draw them in the page.
- The ADR-0021 figure of about 19 MB per minute is the arithmetic of the Chromium and Firefox default bitrate (2.5 Mbps video plus 128 kbps audio is 19.7 MB per minute). It is a ceiling the Widget chooses, not a property of the technique. Safari's default is four times higher. At 1 Mbps video and 32 kbps voice the same minute is about 7.7 MB.
- No single format is both recordable everywhere and playable everywhere without transcoding. MP4 (H.264, AAC) plays everywhere but Firefox cannot record it.
- `chrome-capture` is not applicable. It drives Chrome from outside through the DevTools Protocol, which a page script cannot reach.

## Support

All rows from MDN browser-compat-data 8.1.10, read 2026-11-25 ([`api/MediaDevices.json`](https://github.com/mdn/browser-compat-data/blob/main/api/MediaDevices.json), [`api/MediaRecorder.json`](https://github.com/mdn/browser-compat-data/blob/main/api/MediaRecorder.json), `CropTarget.json`, `RestrictionTarget.json`). Verified.

| Browser             | `getDisplayMedia` | `MediaRecorder` | Own tab as source | Surface audio | Verdict for a filmed Recording                         |
| ------------------- | ----------------- | --------------- | ----------------- | ------------- | ------------------------------------------------------ |
| Chrome (desktop)    | 72                | 47              | Yes (94)          | Yes (74)      | Works, best case                                       |
| Edge                | 79                | 79              | Yes               | Yes           | Same as Chrome                                         |
| Firefox (desktop)   | 66                | 25              | No                | No            | Works, window or screen only, WebM only                |
| Safari (macOS)      | 13                | 14.1            | No (see below)    | No            | Works, window or screen only                           |
| Chrome for Android  | No                | Yes             | No                | No            | Not possible                                           |
| Firefox for Android | No                | Yes (mirror)    | No                | No            | Not possible                                           |
| Safari on iOS       | 27 (unproven)     | 14              | No                | No            | Treat as not possible                                  |
| Samsung Internet    | No                | Yes             | No                | No            | Not possible                                           |

- Chrome for Android: "From Chrome Android 72 to 88, this method was exposed, but always failed with `NotAllowedError`" (compat data, citing [bug 40418135](https://crbug.com/40418135)). A 2025 Chromium Intent to Ship states that Android and Android WebView "don't support the getDisplayMedia API" ([CapturedSurfaceResolution](https://groups.google.com/a/chromium.org/g/blink-dev/c/jdCVfxAUFLc), read through a search result). No Chrome Platform Status entry announcing Android support was found.
- Safari on iOS: the compat data still says 27. The [Safari 27.0 feature post](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/) (17 September 2026) does not mention `getDisplayMedia` in the first two thirds of its text; the rest was not read. The entry rests on an existence test and one user report (carried). Other iOS browsers use WebKit and follow Safari.
- Firefox still offers no tab as a source: the tab sharing meta bug [1651145](https://bugzilla.mozilla.org/show_bug.cgi?id=1651145) is open (status read through a search result on 2026-11-25).
- Safari: the 16.1 release post describes sharing "their screen or a specific window of an application". No WebKit source mentions tab capture (carried).
- Chromium-only controls, all `false` for Firefox, Safari and Chrome for Android in the compat data: `preferCurrentTab` (94), `selfBrowserSurface` (107, default `exclude` from 112), `surfaceSwitching` (107), `monitorTypeSurfaces` (119), `systemAudio` (105), Region Capture `CropTarget` (104), Element Capture `RestrictionTarget` (132).

## The permission flow, every time

### Screen

From the [Screen Capture spec](https://www.w3.org/TR/screen-capture/) (W3C Working Draft, 27 August 2026; the draft states it "is not complete"). Verified.

- The call rejects unless the window "has transient activation", and consumes the activation. So: a click, then the call, with nothing slow in between. Sentry's source notes that "Safari drops the user gesture that `getDisplayMedia` needs 1s after the click" (carried, from `sentry-javascript`).
- "The user agent MUST NOT store a 'granted' permission entry." The permission state "MUST NOT ever" be `granted`. Two filmed Recordings in a row are two prompts, in every browser.
- The page cannot choose the surface. Options are hints the browser "MAY ignore".

What the Reviewer sees:

- **Chrome, Edge with `preferCurrentTab: true`**: the [WICG draft](https://wicg.github.io/prefer-current-tab/) says the browser should make the current tab "the most prominent of any option presented" and "MAY rely on this preference to limit the set of options presented to the user", while it "does not obviate user agents' duty to ensure active user consent". A secondary source with a Chrome 139 screenshot (3 September 2025) reports that the prompt is now a plain Allow or Cancel for the current tab, with tab audio offered, and no surface chooser ([Pipe blog](https://blog.addpipe.com/screen-sharing-a-single-tab-with-getviewportmedia-or-getdisplaymedia/)). Not confirmed in a Chrome document: see [Unverified](#unverified). `preferCurrentTab: true` cannot be combined with `selfBrowserSurface: "exclude"` ([Chrome docs](https://developer.chrome.com/docs/web-platform/screen-sharing-controls)).
- **Chrome, Edge without it**: the full picker with tabs, windows and screens. `displaySurface: "browser"` preselects the tabs pane: "The ordering of the offer remains unchanged, but the relevant pane is pre-selected". `selfBrowserSurface: "include"` puts the current tab back in the list. `monitorTypeSurfaces: "exclude"` removes whole screens. `surfaceSwitching` controls the "Share this tab instead" button (same Chrome doc).
- **Firefox**: a prompt for a window or a screen. **Safari**: a prompt for a screen or a window (carried).
- In all browsers a sharing indicator stays visible and the Reviewer can stop the capture from the browser's own UI, which ends the track.

After the grant, Chromium only, and only when the Reviewer picked the current tab:

- **Region Capture** (`CropTarget`, Chrome 104, desktop only) crops the track to an element's rectangle. Occluding pixels are still captured (carried).
- **Element Capture** (`RestrictionTarget`, Chrome 132, "on desktop only") restricts the track to one subtree and "crops and removes both occluding and occluded content". The target must "form its own stacking context", must not be `display: none`, and frames stop while it is ineligible. It "is only enabled for self-capture for now" ([Chrome docs](https://developer.chrome.com/docs/web-platform/element-capture)). Inference: restricting to the page's root would film the page without the Widget's own interface only if the Widget is mounted outside that subtree.
- Neither feature changes the prompt.

### Microphone

- The voice comes from a separate `getUserMedia({ audio: true })` call with its own prompt. First filmed Recording on a site: two prompts. Unlike the screen, the browser may remember this grant per origin, and that origin is the customer's site, not Faster Fixes (carried, MDN).
- Userback asks for the microphone first, then the share picker, then shows a 3 second countdown, and records muted if the microphone is refused. BugHerd's documented order is the same: microphone, then screen (carried, from `recording-at-competitors.md`). Inference: the time a Reviewer spends on the microphone prompt can outlive the transient activation of the click, so the screen call that follows may need a click of its own.
- `MediaRecorder` in Chromium records one audio track. Voice plus tab audio means mixing both into one track with the Web Audio API before `start()`; the spec stops the recording if a track is added later (carried). Voice alone needs no mixing: add the microphone track to the stream before `start()`.
- macOS: filming a window or a screen needs the browser to hold the system Screen Recording permission, and the microphone needs the system Microphone permission. A Reviewer who never granted them to their browser gets a system dialog on top of the browser prompts (carried, Apple Support; tab capture in Chrome is reported exempt, unverified).

### What the customer's site can block

Verified in the spec and [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture):

- "This specification defines a policy-controlled feature identified by the string `display-capture`. Its default allowlist is `self`." The Widget runs in the customer's top-level document, so it is allowed by default.
- Blocked, with `NotAllowedError`, when the site sends `Permissions-Policy: display-capture=()`, or when the page hosting the Widget is itself in a cross-origin iframe without `allow="display-capture"`.
- The microphone has the same shape: `microphone` directive, default `self`. A site that sends `Permissions-Policy: microphone=()` (a common hardening header) leaves the film possible and the voice impossible. Usersnap documents both requirements for its host sites, plus the upload origin in the site's CSP (carried).
- A secure context is required: `navigator.mediaDevices` is undefined on plain HTTP outside `localhost`.
- The shadow root is irrelevant to `getDisplayMedia()` and `MediaRecorder`: neither takes a DOM element.
- The site's CSP applies to the upload (`connect-src`) and to any worker the Widget would start (`worker-src`).

## Cursor and clicks

- **Chromium tab capture draws the cursor.** The tab capture device uses a `MouseCursorOverlayController` "to manage the mouse cursor overlay in the `viz::FrameSinkVideoCapturer` session based on the behavior of the mouse cursor reported by the windowing system" ([Chromium source](https://github.com/chromium/chromium/blob/main/content/browser/media/capture/mouse_cursor_overlay_controller.h)). Verified that the mechanism exists; the exact show and hide rule was not read.
- **The page cannot control it reliably.** The spec defines a `cursor` constraint with `never`, `always` and `motion`, and no default. A Chromium Intent to Prototype dated 17 September 2026 says Chromium "exposes the cursor setting today" but "does not expose and honor the complete constraint/capabilities surface consistently across capture backends", and that the new implementation stays behind a default-disabled flag ([blink-dev](http://www.mail-archive.com/blink-dev@chromium.org/msg17490.html)). The compat data has no entry for the constraint.
- **Firefox and Safari**: window and screen capture go through the operating system's capturer, which includes the cursor. A 2020 Firefox bug shows it has regressed per platform before ([bug 1625694](https://bugzilla.mozilla.org/show_bug.cgi?id=1625694)). Current behaviour unverified.
- **Clicks are not visible in any browser.** A film holds pixels: a click shows only through what the page does in response. Usersnap advertises that "the mouse cursor is highlighted" (carried), and the `chrome-capture` README draws click rings with a DOM overlay tracking `pointermove` and `pointerdown`. Inference: a click marker has to be an element the Widget draws in the page during capture, which then is part of the film. It works only when the tab itself is filmed; on a window or screen capture it still shows, since the page is in the picture.
- The Widget's own interface (a stop button, a timer) is in the picture too, unless Element Capture excludes it (Chromium desktop) or it lives in a Document Picture-in-Picture window (Chrome 116 desktop, Firefox 151, not Safari, per [Chrome docs](https://developer.chrome.com/docs/web-platform/document-picture-in-picture)). Jam opens such a window for its controls (carried).

## Full page navigation or reload mid-recording

- **The capture dies with the document.** The Media Capture and Streams spec stops all sources when the document unloads (carried, section 4.3). Chromium's `MediaRecorder` checks `IsContextDestroyed()` on every operation ([`media_recorder.cc`](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/modules/mediarecorder/media_recorder.cc), verified). The Widget's script, its recorder and the chunks in memory all go.
- **Nothing resumes it silently.** The new document needs a new click and a new prompt, because the grant cannot be stored.
- **A same-document route change (SPA) keeps it** (inference from the History API, consistent with what Userback and Usersnap document).
- **How others handle it.** No competitor survives a page load from a script alone:
  - Userback: "If moving to another page triggers a full page load, Userback loads again from scratch and the recording ends." Its workarounds are a single-page app, the browser extension ("records through the browser itself"), or a server-side change ([Userback help](https://support.userback.io/en/articles/9417968-troubleshooting-video-or-screen-recording-across-multiple-pages), verified today). It also registers a `beforeunload` guard while recording (carried).
  - Usersnap: "Once the page is reloaded, the current page will be destroyed including the Usersnap widget. Hence the recording will be interrupted" (carried).
  - Jam's no-extension recorder runs from a separate page (`recorder.jam.dev/<id>`) and asks for the whole screen (`displaySurface: "monitor"`, `selfBrowserSurface: "exclude"`), so the capturing document is not the page under review and survives its navigations (carried, code reading).
- **What is technically open** (all inference, none tested):
  - _A second document holds the capture_: a popup window, or a recorder page as Jam does. It films another tab, a window or a screen while the reviewed page navigates freely. Cost: the Reviewer picks the surface by hand in the full picker, `preferCurrentTab`, Region Capture and Element Capture do not apply (self-capture only), the popup needs its own click and can be blocked, and it runs on whichever origin serves it. Chromium fires `capturehandlechange` on the track when "a cross-document navigation occurs in the captured web app" ([Capture Handle](https://developer.chrome.com/docs/web-platform/capture-handle), Chrome 102), which implies a tab capture continues across the captured tab's navigations.
  - _A Document Picture-in-Picture window does not help_: it "never outlives the opening window" and "cannot be navigated".
  - _Save what exists, then stitch_: chunks from `start(timeslice)` or `requestData()` can be written to IndexedDB before unload, and a new capture started after the load with a new prompt. The result is several files, or one file per segment: chunks of one recorder are not independent files, and the spec only guarantees that "the combination of all the Blobs from a completed recording MUST be playable" (carried). Chunked recording also loses Chromium's seekable WebM (carried).
  - _Stop cleanly_: end the filmed Recording at `pagehide` and keep what was uploaded or persisted so far. This needs incremental upload or persistence during the capture, since an upload started at unload is not reliable for megabytes.

## Codecs, containers, playability

Recheck of the three engines' recorder sources on 2026-11-25 confirmed the default bitrates. Codec lists are carried from the 2026-11-10 note.

| Browser             | Can record                                                      | Default video | Default audio |
| ------------------- | --------------------------------------------------------------- | ------------- | ------------- |
| Chrome, Edge        | WebM (VP8, VP9, AV1, Opus). From 126: MP4 (H.264 + AAC, others) | 2.5 Mbps      | 128 kbps      |
| Firefox             | WebM (VP8 + Opus) only                                          | 2.5 Mbps      | 128 kbps      |
| Safari 14.1 to 18.3 | MP4 (H.264 + AAC) only                                          | 10 Mbps       | 192 kbps      |
| Safari 18.4+        | MP4 (fragmented; H.264, HEVC, AV1) and WebM (VP8 or VP9 + Opus) | 10 Mbps       | 192 kbps      |

Sources: Chromium [`media_recorder.cc`](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/modules/mediarecorder/media_recorder.cc) (`kDefaultVideoBitRate = 2500e3`, `kDefaultAudioBitRate = 128e3`); Firefox [`MediaRecorder.cpp`](https://github.com/mozilla-firefox/firefox/blob/main/dom/media/MediaRecorder.cpp) (`DEFAULT_VIDEO_BITRATE_BPS = 2500e3`, `DEFAULT_AUDIO_BITRATE_BPS = 128e3`, bounds 10 kbps to 100 Mbps); WebKit [`MediaRecorderPrivate.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/mediarecorder/MediaRecorderPrivate.cpp) (`LargeVideoBitRate = 10000000`, `LargeAudioBitRate = 192000`).

Playback without transcoding (carried, caniuse):

| Recorded format    | Recordable in                          | Plays in                                                                        |
| ------------------ | -------------------------------------- | ------------------------------------------------------------------------------- |
| MP4, H.264 and AAC | Chrome 126+, Safari 14.1+, not Firefox | Every browser                                                                   |
| WebM, VP8 and Opus | Chrome, Firefox, Safari 18.4+          | Chrome, Firefox, Safari 16.0+ on macOS, Safari on iOS 17.4+                     |

- A Widget that asks for MP4 (H.264, AAC) where `MediaRecorder.isTypeSupported()` accepts it, and falls back to WebM (VP8, Opus), gets a universally playable file from Chrome, Edge and Safari, and a WebM from Firefox that plays everywhere except Safari on iOS before 17.4.
- H.264 and AAC in Chromium exist only in builds with proprietary codecs: Chrome and Edge yes, plain Chromium builds no (carried).
- Files from `MediaRecorder` may lack duration and seek metadata. Chromium writes a seekable WebM only when recording without a timeslice, holding the whole file in memory (carried). Firefox and Safari behaviour not checked.
- Transcription services generally want audio in a common container. That question belongs to the transcription ticket; the fact here is that the voice is Opus in WebM or AAC in MP4, depending on the browser.

## Megabytes per minute

Size is bitrate times duration. `videoBitsPerSecond` is "a hint for the encoder and the value might be surpassed, not achieved" (MediaStream Recording spec, carried).

| Setting                                            | Video    | Audio    | MB per minute | 5 minutes |
| -------------------------------------------------- | -------- | -------- | ------------- | --------- |
| Safari default                                     | 10 Mbps  | 192 kbps | 76.4          | 382 MB    |
| Chromium and Firefox default                       | 2.5 Mbps | 128 kbps | 19.7          | 99 MB     |
| Chromium default video, voice at 32 kbps           | 2.5 Mbps | 32 kbps  | 19.0          | 95 MB     |
| Requested 1.5 Mbps, voice at 32 kbps               | 1.5 Mbps | 32 kbps  | 11.5          | 57 MB     |
| Requested 1 Mbps, voice at 32 kbps                 | 1 Mbps   | 32 kbps  | 7.7           | 39 MB     |
| Requested 0.5 Mbps, voice at 32 kbps               | 0.5 Mbps | 32 kbps  | 4.0           | 20 MB     |

(MB = 10^6 bytes; bits per second times 60, divided by 8.)

**ADR-0021's "about 19 MB per minute": confirmed as arithmetic, to be corrected in meaning.**

- It is exact for the Chromium and Firefox default (18.75 MB of video, 19.7 MB with default audio).
- It is not a constant of the technique. It is wrong by a factor of four for Safari left at its default, and it is a number the Widget sets by passing `videoBitsPerSecond` and `audioBitsPerSecond`. Leaving the bitrate unset is the one thing not to do, because of Safari.
- It is an upper bound, not a measurement: encoders may undershoot on static screen content.

What is "usable quality" was not established from a primary source and needs a measurement per engine. Two reference points:

- Chromium's own DevTools screen recorder (AV1, a more efficient codec than VP8 or H.264) targets 2 Mbps at 720p30 and scales "linearly with pixel rate", 9 Mbps at 1080p60 (`chrome-capture` README, describing Chromium's encoder settings).
- Resolution and frame rate are set through track constraints on `getDisplayMedia()` (for example `frameRate: 15` to `30`, a `width` cap), applied by scaling after the Reviewer has chosen the surface (MDN). A Retina screen filmed at native size has four times the pixels of the same window at 1x, at the same bitrate.

Inference: a working range for planning is 8 to 20 MB per minute, video included, with voice adding 0.24 MB per minute at 32 kbps Opus. Against the known limits: the 4 MiB cap of the automatic Recording's upload path holds 12 to 30 seconds of film, so a filmed Recording needs a different upload path; 500 MB (the free Plan's Video storage) holds 25 to 60 minutes.

## Is `chrome-capture` applicable

No. Verified from the [repository](https://github.com/paulirish/chrome-capture) (created 2026-11-08, last push 2026-11-17, Apache-2.0) and the Chromium protocol definition.

- What it is: a Node CLI and library ("`npx chrome-capture <url> demo.mp4 4s`") that records a tab "straight to a AV1 `.mp4`" by calling the Chrome DevTools Protocol command `Page.startScreenRecording`, which "landed" in September 2026 and needs "Chrome 153+". Its `startRecording()` "takes a Playwright `Page`, a Puppeteer `Page`, or a CDP session".
- The command is defined in Chromium as `experimental command startScreenRecording` in the `Page` domain, returning an `IO.StreamHandle` ([`Page.pdl`](https://github.com/chromium/chromium/blob/main/third_party/blink/public/devtools_protocol/domains/Page.pdl)).
- Why it does not apply:
  1. **Wrong side of the browser.** The DevTools Protocol is reached by a process that launched Chrome with a debugging port, or by an extension holding the `debugger` permission. A script in a web page has no access to it. The Widget-only constraint excludes both.
  2. **It records a browser it controls**, typically headless, on the machine that runs the script. It cannot film a Reviewer's own session on their own machine.
  3. **No microphone.** Its audio option is "48kHz stereo Opus tab audio".
  4. **Chrome 153+ only**, and the command is experimental.
  5. **No cursor of its own**: the README says to draw one in the DOM.
- Where it could matter later, outside this ticket's question: ADR-0021 notes that "stills or a video file from a replay need a headless Chromium on the server". `Page.startScreenRecording` is the current efficient way to turn an rrweb replay into an MP4 on a server (the README reports 17 ms to stop against 3.8 s for the older `Page.startScreencast` plus ffmpeg pipeline). That would produce a film of a reconstruction, without voice, and is a server component, not a Widget capability.
- Two details of the README are still useful here: the click-ring DOM overlay as the way to make clicks visible, and Chromium's own bitrate choice for screen content.

## Hard limits for a filmed Recording

1. One click and one browser prompt per filmed Recording, in every browser, forever by spec.
2. The Reviewer chooses the surface. Chromium lets the page steer toward the current tab; Firefox and Safari cannot film a tab at all.
3. First voice capture on a site costs a second prompt; the site's `microphone` policy can forbid it while the film stays possible.
4. A full page load ends the filmed Recording. From a script, the only continuations are a new prompt or a second window holding the capture.
5. No Android. iOS unproven and to be treated as absent.
6. The format depends on the recording browser; Firefox cannot produce MP4.
7. The cursor is in the film; clicks are not, unless the Widget draws them.
8. The film is pixels of whatever was on the chosen surface, the Widget's interface included, with none of the masking the automatic Recording applies.
9. Size is set by the bitrate the Widget requests; unset, it ranges from about 20 to 76 MB per minute depending on the browser.

## Unverified

- **Chrome's current dialog with `preferCurrentTab`** (Allow or Cancel only, since which version, whether tab audio is a checkbox): one secondary source with a Chrome 139 screenshot. No Chrome document describes the current UI.
- **Cursor rule in Chromium tab capture** (always, or only while moving over the tab), and **cursor presence in current Firefox and Safari captures** on each operating system.
- **Safari on iOS 27**: one compat-data entry; no Apple or WebKit statement; the last third of the Safari 27.0 post was not read.
- **Chrome for Android**: no evidence of work in progress, but Chrome Platform Status was not searched exhaustively.
- **Firefox tab sharing**: bug status read through a search result, not on the bug page.
- **Usable bitrate for page content** per engine and resolution, and how far real files fall under the requested bitrate. Needs a measurement.
- **A capture held by a popup across the reviewed tab's navigations**: inferred from the Capture Handle documentation, not tested. Popup blocking, focus behaviour and the picker in that flow are untested.
- **Element Capture with a target in or around a shadow tree**, and whether restricting to the page root cleanly removes a Widget mounted outside it.
- **Mixing microphone and tab audio through Web Audio**, and echo when the page plays sound: not tested.
- **Duration and seek metadata** in Firefox WebM and Safari MP4 recordings.
- **macOS system permission dialogs** for window and screen capture in current Safari, Chrome and Firefox.
- **The `Page.startScreenRecording` change itself**: the Gerrit page could not be read; the command was read in Chromium's `Page.pdl`, and the Chrome 153 requirement comes from the `chrome-capture` README.
- Facts marked "carried" were verified on 2026-11-10 and not re-read today.
