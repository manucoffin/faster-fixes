# A continuous rrweb Recording with the microphone as a filmed Recording

> Research for [#493](https://github.com/manucoffin/faster-fixes/issues/493), part of the map [#490 Filmed Recording](https://github.com/manucoffin/faster-fixes/issues/490). It answers one question: can the filmed Recording be the existing rrweb reconstruction, run continuously from start to stop, with the Reviewer's voice captured from the microphone alone, instead of a film of the screen? It reports facts and does not choose the capture technique.

- **Date of the checks**: 2026-11-25.
- **Vocabulary**: the terms of `CONTEXT.md`. **Automatic Recording** is the existing rrweb replay of the last 60 seconds; **filmed Recording** is the one a Reviewer makes on purpose, with their voice.
- **Evidence labels**:
  - **[spec]** a W3C or IETF specification,
  - **[doc]** first-party documentation or a vendor's own post,
  - **[src]** read in source code: `rrweb` 2.2.2 as installed in this repo, Chromium `main`, or this repo,
  - **[prior]** measured or established in an earlier note of this repo, `docs/research/dom-session-replay.md` (commit `7436d1bee`, 2026-11-10) or `docs/research/browser-screen-capture.md` (commit `d25ea10ff`),
  - **[report]** a bug report or a comment by a browser engineer: lower trust, dated.
- **Inference** marks what is deduced rather than read. Nothing was run for this note: no figure here is a new measurement. What could not be confirmed is repeated in [Not verified](#not-verified).

## Answer

**Feasible, with one structural weakness and the fidelity limits the automatic Recording already has.**

- Both halves exist in every current browser, phones included: `@rrweb/record` is already shipped, and `getUserMedia` plus `MediaRecorder` for audio work in Chrome, Edge, Firefox and Safari, on desktop, Android and iOS 14.3+. This is the main advantage over a film: `getDisplayMedia` is absent on Android and unproven on iOS **[prior]**.
- It is small. Ten minutes is about 0.05 to 2 MB of gzipped events plus about 2.4 MB of voice at 32 kbit/s, against about 190 MB for a film at the Chromium default **[prior]**. It does not fit the current single 4 MiB body once voice is added to a long Recording.
- One clock is achievable: rrweb stamps events with `Date.now()`, and the audio timeline can be pinned to that clock at start, at each pause and at each chunk.
- **The weak point is a full page load.** The document owns both the recorder and the microphone. Both stop, the voice has a hole until the next page asks for the microphone again, and that request can show a new permission prompt depending on the browser and on how the Reviewer answered the first one.
- It is still a reconstruction: no canvas, video frames, third-party iframes, native browser UI, other tabs or exact rendering.

## 1. rrweb running continuously

### What changes compared with the automatic Recording

- The automatic Recording keeps two 30-second slices, each opened by a full snapshot, drops a slice past 10,000 mutated nodes, and caps the gzipped file at 4 MiB. **[src]** `packages/widget/src/recorder/recording-buffer.ts`, `recording-file.ts`
- A continuous recording needs one full snapshot at the start. Further full snapshots (checkpoints) are optional and serve two purposes: bounding the cost of a seek, and recovering after a gap (resume after pause, new page load).
- rrweb's own mechanism is `checkoutEveryNms` / `checkoutEveryNth`, which calls `takeFullSnapshot(true)` once the interval has passed. This repo drives `record.takeFullSnapshot()` from its own timer instead. Either way each checkpoint emits a Meta event followed by a FullSnapshot. **[src]** `rrweb.js` `record()`, `takeFullSnapshot`
- **Seek cost depends on checkpoints.** On `play(t)` or `pause(t)`, the replayer discards everything before the last Meta event at or before `t`, then applies every remaining event before `t` synchronously before resuming. With no checkpoint, a seek to minute 9 replays nine minutes of mutations in one task. **[src]** `discardPriorSnapshots`, `createPlayerService` in `rrweb.js`
- `rrweb` exposes one recorder per page (`record` holds module-level state). **Inference**: a filmed Recording has to share the recorder instance the automatic Recording already started, with a second consumer of `emit`, rather than start its own.
- The mutation threshold cannot be kept as is. Dropping a slice of a filmed Recording leaves a hole under a voice that keeps talking. **Inference.**

### Size over 1, 5 and 10 minutes

No new measurement. The figures below extrapolate the five pages measured on 2026-11-10 (`@rrweb/record` 2.2.2, 60 seconds, pointer moves and wheel scrolling only) **[prior]**: a full snapshot of 12 to 629 KB gzipped, and 4 to 66 KB gzipped of activity per minute.

Model: `size(T) = snapshot x (1 + checkpoints during T) + activity per minute x T`. **Inference**: gzip's 32 KB window does not deduplicate one snapshot against the next, so each checkpoint costs a full snapshot.

| Page profile [prior]                              | Checkpoints | 1 min  | 5 min  | 10 min  |
| ------------------------------------------------- | ----------- | ------ | ------ | ------- |
| Light (Hacker News: 12 KB + 4 KB/min)             | none        | 16 KB  | 32 KB  | 52 KB   |
| Heavy CSS, quiet (GitHub repo: 629 KB + 4 KB/min) | none        | 633 KB | 649 KB | 669 KB  |
| Animated (stripe.com: 143 KB + 66 KB/min)         | none        | 209 KB | 473 KB | 803 KB  |
| Heavy CSS, quiet                                  | every 5 min | 633 KB | 1.3 MB | 1.9 MB  |
| Animated                                          | every 5 min | 209 KB | 0.6 MB | 1.1 MB  |
| Heavy CSS, quiet                                  | every 60 s  | 1.3 MB | 3.8 MB | 6.9 MB  |
| Heavy CSS, quiet                                  | every 30 s  | 1.9 MB | 6.9 MB | 13.2 MB |
| Animated                                          | every 30 s  | 0.5 MB | 1.9 MB | 3.7 MB  |

- **Checkpoints, not duration, decide the size.** The current 30-second slicing would pass 4 MiB within three minutes on a page with a large stylesheet; with a checkpoint every five minutes or none, ten minutes stays under 2 MB on every page of the sample.
- Raw JSON is 6 to 9 times the gzipped size **[prior]**, so ten minutes holds roughly 0.5 to 15 MB in memory before compression.
- These are lower bounds for a demonstration. The sample had no clicks, typing, or route changes; a client-side route change rewrites much of the DOM as mutations, and each full page load adds a full snapshot. Not measured.
- Vendor yardsticks: PostHog takes a full snapshot every 5 minutes and caps one event at about 0.9 MB; Sentry flushes every 5 seconds and caps a replay at 60 minutes **[prior]**. New Relic gives "an average of 5.3 MB per replay as a rough approximation", with no duration attached. **[doc]** [New Relic, session replay additional information](https://docs.newrelic.com/docs/browser/browser-monitoring/browser-pro-features/session-replay/additional-information/). No vendor read publishes a per-minute figure.

### Fidelity gaps

Unchanged from the automatic Recording, and listed with their sources in `docs/research/dom-session-replay.md`, section 3 **[prior]**. With the options this repo sets (`recordCanvas: false`, `inlineImages: false`, `collectFonts: false`):

- **Canvas and WebGL**: nothing. Turning it on needs a worker on the host page and `UNSAFE_replayCanvas`, which removes the script sandbox ADR-0023 relies on.
- **Video and audio elements**: the URL and the play, pause and seek events, never the frames. Streamed media never replays.
- **Cross-origin iframes** (payment forms, embedded players, maps): an empty placeholder.
- **Cross-origin stylesheets without CORS**: the URL only. Images, fonts and `url()` references are fetched from the customer's site at playback and decay when it changes or sits behind a session.
- **Layout**: re-rendered by the viewer's browser, so fonts, scrollbars and masking can shift it. Hover is simulated.
- **Longer recordings widen two of these.** A ten-minute Recording crosses more states of the page, so more asset URLs must still resolve at playback. And every typed value stays masked (ADR-0022), so a Reviewer who says "I enter my email here" is heard over asterisks.

## 2. Voice from the microphone alone

### Support

| Browser                | `getUserMedia` | `MediaRecorder`                     | Audio formats recorded                 |
| ---------------------- | -------------- | ----------------------------------- | -------------------------------------- |
| Chrome, Edge (desktop) | 53 / 12        | 47 (audio and options from 49)      | WebM with Opus                         |
| Chrome for Android     | Yes            | Yes                                 | WebM with Opus                         |
| Firefox (desktop)      | 36             | 25 (`audioBitsPerSecond` from 71)   | WebM or Ogg with Opus                  |
| Safari (macOS)         | 11             | 14.1                                | MP4 with AAC; WebM with Opus from 18.4 |
| Safari on iOS          | 11             | 14 per compat data, 14.3 per WebKit | Same as macOS                          |
| Firefox for Android    | Yes            | Conflicting sources                 | See [Not verified](#not-verified)      |

Sources: **[doc]** MDN browser-compat-data, [`api/MediaDevices.json`](https://github.com/mdn/browser-compat-data/blob/main/api/MediaDevices.json) and [`api/MediaRecorder.json`](https://github.com/mdn/browser-compat-data/blob/main/api/MediaRecorder.json); [WebKit, MediaRecorder API](https://webkit.org/blog/11353/mediarecorder-api/) ("Safari currently supports the MP4 file format with H.264 as video codec and AAC as audio codec"); [WebKit features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/) ("now supports creating WebM files using the Opus audio codec").

- **Secure context only**, in every browser. **[doc]** compat data, `secure_context_required`
- **Permissions Policy**: the `microphone` feature has a default allowlist of `'self'`. **[spec]** [Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/), section 14. The Widget runs in the customer's top-level document, so it is allowed by default. **Inference**: a site that sends `Permissions-Policy: microphone=()`, a common hardening header, or that is itself framed without `allow="microphone"`, blocks it, and the Widget cannot override that.
- **The prompt names the customer's site**, not Faster Fixes, since the call is made from its origin. **Inference** from the permission model.
- **The browser shows a capture indicator** for as long as the microphone is open; the spec requires it. **[spec]** same document, section 15
- **No single recorded format.** Safari before 18.4 produces AAC in MP4 only, Chromium and Firefox produce Opus. The Widget has to pick with `MediaRecorder.isTypeSupported()` and the server has to accept both. Playback of WebM in Safari on iOS needs 17.4 **[prior]**.
- **Chromium's WebM has no duration and no seek index**: "This is by design of the webm live format and is tracked in crbug/642012". **[doc]** [Chromium MediaRecorder README](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/mediarecorder/README.md). An `<audio>` element given that file reports an unknown duration and seeks poorly, so the file must be remuxed or transcoded before playback (inference on the consequence; the README names rebuilding the Cues as the workaround).
- **iOS interruptions**: reports describe the microphone track muted or ended when Safari goes to the background, the screen locks or a call comes in, with a new `getUserMedia` call as the workaround. **[report]** WebKit bugs [204681](https://bugs.webkit.org/show_bug.cgi?id=204681), [208516](https://bugs.webkit.org/show_bug.cgi?id=208516), [226620](https://bugs.webkit.org/show_bug.cgi?id=226620)

### Size per minute

Size is bitrate times duration; the bitrate is a request, not a guarantee: "audioBitrate is a hint for the encoder and the value might be surpassed, not achieved". **[spec]** [MediaStream Recording](https://www.w3.org/TR/mediastream-recording/), section 2.3

Opus "sweet spots" for a 20 ms frame: 8 to 12 kbit/s narrowband speech, 16 to 20 kbit/s wideband speech, 28 to 40 kbit/s fullband speech. **[spec]** [RFC 7587](https://www.rfc-editor.org/rfc/rfc7587.html), section 3.1.1

| `audioBitsPerSecond` | Per minute | 5 min  | 10 min |
| -------------------- | ---------- | ------ | ------ |
| 16 kbit/s            | 120 KB     | 0.6 MB | 1.2 MB |
| 24 kbit/s            | 180 KB     | 0.9 MB | 1.8 MB |
| 32 kbit/s            | 240 KB     | 1.2 MB | 2.4 MB |
| 64 kbit/s            | 480 KB     | 2.4 MB | 4.8 MB |
| 128 kbit/s           | 960 KB     | 4.8 MB | 9.6 MB |

- **Leaving the bitrate unset is not an option.** The spec lets the browser "choose a target value the User Agent deems reasonable". Chromium passes `OPUS_AUTO` to libopus when none is given; a comment dated 2013 puts that at "up to 102kbps for 2-channel, 48 kHz audio". **[src]** [`audio_track_opus_encoder.cc`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/mediarecorder/audio_track_opus_encoder.cc)
- Safari: the 2021 WebKit post says bitrates were not yet configurable; compat data lists `audioBitsPerSecond` from 14.1. Safari's default AAC bitrate and the lowest it honours were not found.
- Order of magnitude against a film: about 19 MB per minute at the Chromium default **[prior]**, so voice plus events is 40 to 80 times smaller.
- **Against the 4 MiB body limit**: ten minutes of voice at 32 kbit/s (2.4 MB) plus the events (0.05 to 2 MB) is at or over the cap in one request. Two uploads, or a direct upload to storage as Videos use, is needed past a few minutes. **Inference.**

## 3. One clock for voice and replay

### At capture

- rrweb stamps every event with `Date.now()`. **[src]** `nowTimestamp` in `rrweb.js`. The Diagnostic Trail uses the same wall clock **[src]** `recording-buffer.ts` (`now`).
- The audio file has its own timeline starting at zero: "the timecode in the first produced BlobEvent MUST contain 0", later ones carrying the offset from it. **[spec]** MediaStream Recording, section 3.2
- **Anchor**: note `Date.now()` when the recorder's `start` event fires and store it with the Recording, for instance through `record.addCustomEvent`, which this repo already uses for the page session marker. Audio time `a` is then wall time `anchor + a`.
- **Pauses**: `pause()` is to "stop gathering data into blob (but keep it available so that recording can be resumed in the future)". **[spec]** section 2.3. The spec does not say whether paused time is removed from the file's timeline; in practice it is (inference, to be checked per browser). rrweb has no pause. The recorder in this repo already has the needed pattern: drop events while suspended and take a full snapshot on resume. **[src]** `packages/widget/src/recorder/index.ts`
- **Inference, a workable scheme**: keep the list of pause intervals as custom events, and give the player one "recording time" that is wall time minus the pauses before it. Events, Trail entries and audio all map to it with the same function.
- **Drift**: the audio timeline counts samples the encoder received, not wall time. A muted track, a device switch or an iOS interruption can make the file shorter than the wall time it covers (inference). Recording with a timeslice and storing each chunk's `timecode` next to `Date.now()` gives resynchronisation points every few seconds. Browser support for `BlobEvent.timecode` was not checked.

### At playback

- The replayer has no external clock input. Its timer advances by `performance.now()` deltas multiplied by `speed`, inside `requestAnimationFrame`. **[src]** `Timer` in `rrweb.js`
- What it offers: `play(timeOffset)`, `pause(timeOffset)`, `getCurrentTime()`, `setConfig({ speed })`. **[src]** `rrweb.d.ts`. The player document of ADR-0023 already exposes exactly these over `postMessage` (play, pause, seek, speed) and reports its playhead on every frame. **[src]** `apps/web/src/app/recording-player/_features/play-recording.ts`
- **Inference, the driving scheme**: the `<audio>` element lives in the inbox page and is the master clock, since a glitch is heard and a jump in the replay is not.
  - Play, pause and seek are sent to both. Speed sets `audio.playbackRate` and the replayer's `speed`.
  - Every second or two, compare the reported playhead with the audio time and re-seek the replayer past a threshold of 150 to 250 ms. A re-seek is not free (it fast-forwards from the last checkpoint), so it cannot run on every frame.
  - `requestAnimationFrame` stops in a hidden tab while audio keeps playing, so resynchronise when the tab becomes visible.
  - `skipInactive` must stay off, as it is today: it changes the replay speed on its own.
- A Recording that spans several page loads has several audio files, each with its own anchor, and silence between them.

## 4. A full page load during the Recording

A change of route without a load is harmless: the page session continues, and so do both captures. The rest of this section is about a full navigation or a reload.

### The rrweb stream

- The recorder and the events held in memory die with the document. The next page starts a new stream with its own Meta event and full snapshot, and streams from successive loads can be played as one. **[prior]**, **[src]** `discardPriorSnapshots` handles several Meta events in one array.
- **To lose nothing, events must leave memory as they are produced**: chunks written to IndexedDB on the customer's origin, or uploaded as they come. A write started at unload is not guaranteed to finish (inference).
- **Lost in every case**: the time between the unload and the moment the Widget has mounted, lazy-loaded the recorder and taken the first snapshot. rrweb waits for `load` by default (`recordAfter`). **[src]** `record()` options in `rrweb.js`
- **Across origins** (another subdomain, a payment page): storage is per origin, so the continuation cannot be found locally, and the Widget may not be installed there. **Inference.**

### The microphone

- The capture stops, by specification: the browser "MUST stop all sources" of a document when "the unloading document cleanup steps are executed", and the tracks become ended. **[spec]** Media Capture and Streams, section 4.3
- The recording spec does not address unload. With a timeslice, the chunks already delivered are safe if they were persisted; the last partial chunk is lost (inference). "The individual Blobs need not be playable", only "the combination of all the Blobs from a completed recording MUST be playable". **[spec]** MediaStream Recording, section 2.3. Whether a recording cut before its end plays is expected for live WebM and not confirmed for Safari's MP4.
- **The next page must call `getUserMedia` again.** Whether that prompts depends on the browser and on the Reviewer's first answer:

| Browser          | Behaviour on the next page load                                                                                                                                                                                          | Evidence                                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chrome (desktop) | No prompt after "Allow on every visit". After "Allow this time", the grant ends when "the page has been closed, was navigated away from, or was discarded". Whether a same-origin load counts is not stated.             | **[doc]** [One-time permissions in Chrome](https://developer.chrome.com/blog/one-time-permissions)                                                                       |
| Safari           | Historically a new prompt after a reload unless the site is set to "Allow" in Safari's settings. 18.4 fixed a case "to not re-prompt for camera or microphone permission after a page-initiated same origin navigation". | **[report]** [WebKit bug 215884](https://bugs.webkit.org/show_bug.cgi?id=215884); **[doc]** [Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/) |
| Firefox          | A temporary grant unless the Reviewer ticks "Remember this decision". A grace period is said to cover a reload in the same tab for up to an hour.                                                                        | **[report]** a comment in [Mozilla bug 2069282](https://bugzilla.mozilla.org/show_bug.cgi?id=2069282), "as I recall"; the Firefox test file for it could not be fetched  |

- **What is lost for the voice**: everything said from the unload until the new stream is live, a few seconds at best and until the Reviewer answers a prompt at worst. This is the moment a Reviewer narrates ("now I click on Pay").
- **One audio file per page load.** Files from separate `MediaRecorder` sessions cannot be joined by concatenating bytes (inference); they are stored as segments with their anchors, or joined on the server.
- **Not explored**: holding the microphone in a context that outlives the page, such as a popup on the Faster Fixes origin. It would survive navigations and ask permission once for all sites, at the price of a second window and no mobile support. Inference only.

## 5. What this technique cannot show that a film can

- **Anything outside the page's DOM**: the address bar and browser chrome, other tabs and windows, other applications, devtools, extensions' UI, the operating system.
- **Native UI drawn by the browser**: `alert`, `confirm` and `prompt` dialogs, file pickers, the print dialog, permission prompts, autofill and password-manager popups, the open list of a native `<select>`, the on-screen keyboard on a phone. **Inference by construction** **[prior]**.
- **Pixels the page does not expose**: canvas and WebGL content, video frames, the content of third-party iframes, closed shadow roots (inference **[prior]**).
- **Exact rendering**: the replay is laid out again by the viewer's browser, at another time, with whatever assets still resolve. A rendering bug specific to the Reviewer's browser, GPU, zoom, fonts or dark-mode setting is not reproduced, and nothing in the Recording says where the replay differs.
- **What the Reviewer typed**: masked by ADR-0022, where a film would show it.
- **Sound from the page**: only the microphone is captured, so the page's own audio is heard only if the speakers leak into it.
- **A continuous demonstration across a full page load**, as section 4 shows. A film of a tab on Chromium does continue across navigations of that tab; a capture started by a page still ends when its document unloads **[prior]**, so a film from the Widget has the same break.

What it shows that a film does not: the Reviewer's interactions as data (clicks, inputs, scrolls with their targets), text an agent can read, the same clock as the Diagnostic Trail, phones, and no share picker.

## Not verified

- **Every size in section 1** is an extrapolation of single-run measurements of five public pages with synthetic pointer and scroll activity. Real demonstrations with clicks, typing and route changes were not measured, nor were the sites Faster Fixes serves.
- **That gzip does not deduplicate successive full snapshots**: reasoned from the 32 KB window, not measured.
- **Safari's default and minimum AAC bitrate** in `MediaRecorder`, and whether `audioBitsPerSecond` is honoured at speech rates.
- **Chromium's actual default Opus bitrate** for a mono microphone: only a 2013 source comment about stereo was read.
- **Whether paused time is removed from the audio timeline** in each browser: the spec is silent.
- **`BlobEvent.timecode` support** per browser.
- **Whether a recording cut at unload plays** from the chunks already delivered, in particular Safari's MP4.
- **Prompt behaviour after a full page load**: Chrome's rule for "Allow this time" on a same-origin load, Safari's current rule for a reload the Reviewer triggers, and Firefox's grace period (a bug comment only).
- **Whether `getUserMedia` needs a user gesture or a focused document** when called on page load, per browser: the relevant part of the spec was not read.
- **`MediaRecorder` on Firefox for Android**: compat data mirrors desktop (25); caniuse, as quoted in `docs/research/browser-screen-capture.md`, says no.
- **In-app browsers on iOS and Android** (web views): compat data mirrors Safari and Chrome; not checked beyond that.
- **iOS background and interruption behaviour**: bug reports only, some of them old.
- **How common `Permissions-Policy: microphone=()` is** on customers' sites.
- **Drift between the audio timeline and the wall clock** over ten minutes: reasoned, not measured.
- **Two consumers on one rrweb recorder**: read from the module-level state of `record`, not tried.

## Sources

Specifications

- [Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/), W3C: sections 4.3 (sources stopped at unload), 14 (Permissions Policy), 15 (privacy indicators), 16 (persistent permissions).
- [MediaStream Recording](https://www.w3.org/TR/mediastream-recording/), W3C: sections 2.1, 2.3 (start, timeslice, pause, bitrate hint), 3.2 (timecode).
- [RFC 7587](https://www.rfc-editor.org/rfc/rfc7587.html), IETF: section 3.1.1, recommended Opus bitrates.

Browser vendors

- [MDN browser-compat-data](https://github.com/mdn/browser-compat-data): `api/MediaDevices.json`, `api/MediaRecorder.json`.
- [WebKit, MediaRecorder API](https://webkit.org/blog/11353/mediarecorder-api/) and [WebKit features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/).
- [Chromium MediaRecorder README](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/mediarecorder/README.md) and [`audio_track_opus_encoder.cc`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/mediarecorder/audio_track_opus_encoder.cc).
- [One-time permissions in Chrome](https://developer.chrome.com/blog/one-time-permissions).
- WebKit bugs [215884](https://bugs.webkit.org/show_bug.cgi?id=215884), [204681](https://bugs.webkit.org/show_bug.cgi?id=204681), [208516](https://bugs.webkit.org/show_bug.cgi?id=208516), [226620](https://bugs.webkit.org/show_bug.cgi?id=226620); Mozilla bug [2069282](https://bugzilla.mozilla.org/show_bug.cgi?id=2069282).

rrweb and vendors

- `rrweb` 2.2.2, `dist/rrweb.js` and `dist/rrweb.d.ts` as installed for `@rrweb/record` and `@rrweb/replay` in this repo: `record()`, `takeFullSnapshot`, `Timer`, `discardPriorSnapshots`, `Replayer`.
- [New Relic, session replay additional information](https://docs.newrelic.com/docs/browser/browser-monitoring/browser-pro-features/session-replay/additional-information/).
- Earlier notes of this repo, on their own branches: `docs/research/dom-session-replay.md` (commit `7436d1bee`), `docs/research/browser-screen-capture.md` (commit `d25ea10ff`), which carry the Sentry and PostHog sources quoted here as **[prior]**.

This repo

- `packages/widget/src/recorder/`: `index.ts`, `recording-buffer.ts`, `recording-file.ts`, `page-session.ts`.
- `apps/web/src/app/recording-player/_features/play-recording.ts`.
- ADR-0021, ADR-0022, ADR-0023 in `docs/adr/`.
