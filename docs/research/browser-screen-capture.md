# Browser screen capture capabilities

> What a script embedded in a page can do with `getDisplayMedia()` plus `MediaRecorder`, with no extension, and where it stops. Research for [issue 364](https://github.com/manucoffin/faster-fixes/issues/364), part of the map [Recording in the Widget](https://github.com/manucoffin/faster-fixes/issues/362).

Researched on 2026-11-10. Browser capabilities here move fast: every version number below comes from the source cited next to it, read on that date. This document reports facts and does not pick a capture technique.

Reading conventions:

- **Verified** means read in a primary source (W3C spec, MDN and its browser-compat-data, vendor docs and release notes, browser source code, caniuse).
- **Inference** means a consequence drawn from verified facts, not tested in a browser.
- Everything that could not be confirmed from a primary source is repeated in [Unverified](#unverified).

## Summary

- Screen capture from a page works on desktop Chrome, Edge, Firefox and Safari. Only Chromium browsers can offer the Reviewer's own tab as a capture source; Firefox and Safari offer windows and screens only.
- Every capture starts with a browser prompt that a script cannot skip, cannot answer, and cannot have remembered. This holds for every browser and is written into the spec.
- A capture ends when the document unloads. A full page navigation or a reload stops it; nothing resumes it without a new prompt.
- No single recorded format is both producible by every browser and playable by every browser without caveats. WebM with VP8 and Opus is the closest: recordable in Chrome, Firefox and Safari 18.4+, playable everywhere except Safari on iOS before 17.4.
- Size is bitrate times duration: about 19 MB per minute at the Chromium and Firefox default (2.5 Mbps), 75 MB per minute at the Safari default (10 Mbps).
- Mobile is effectively absent: no support in Chrome or Firefox on Android, and Safari on iOS is listed from 27.0 only, on thin evidence.

## Support

### `getDisplayMedia()`

| Browser             | Since                 | Notes                                                                                              |
| ------------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| Chrome (desktop)    | 72                    |                                                                                                    |
| Edge                | 79                    | 17 and 18 exposed it on `navigator`, partial                                                       |
| Firefox (desktop)   | 66                    | 33 to 65 used a non-standard `getUserMedia` constraint                                             |
| Safari (macOS)      | 13                    | Capture of a single window added in 16.1 on macOS Ventura                                          |
| Opera               | 60                    | Per caniuse                                                                                        |
| Chrome for Android  | No                    | Exposed from 72 to 88 but always failed with `NotAllowedError`                                     |
| Firefox for Android | No                    | Exposed from 66 to 79 but always failed with `NotAllowedError`                                     |
| Safari on iOS       | 27.0 (see note below) | Not supported up to 26.6. Other iOS browsers and in-app web views mirror Safari in the compat data |
| Samsung Internet    | No                    | Mirrors Chrome for Android                                                                         |

Sources: MDN browser-compat-data 8.1.8, [`api/MediaDevices.json`](https://github.com/mdn/browser-compat-data/blob/main/api/MediaDevices.json); [caniuse](https://caniuse.com/mdn-api_mediadevices_getdisplaymedia), which reports 38.27% global usage coverage; [WebKit features in Safari 16.1](https://webkit.org/blog/13399/webkit-features-in-safari-16-1/).

**Safari on iOS 27.** The compat data was changed on 2026-10-14 ([PR 30732](https://github.com/mdn/browser-compat-data/pull/30732)) on the basis of an automated test that the method exists and one user report that on an iPhone running iOS 27.0 the call "opens the system screen sharing picker and returns a MediaStream" ([issue 30654](https://github.com/mdn/browser-compat-data/issues/30654)). The [Safari 27.0 feature post](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/) and the [Safari 27 beta post](https://webkit.org/blog/17967/news-from-wwdc26-webkit-in-safari-27-beta/) do not announce it. What can be shared on iOS (presumably the whole screen through the system picker) and whether the result can be recorded reliably are not documented by Apple. Treat it as present but unproven.

### `MediaRecorder`

| Browser             | Since                                         |
| ------------------- | --------------------------------------------- |
| Chrome              | 47 (options from 49)                          |
| Firefox (desktop)   | 25                                            |
| Safari (macOS)      | 14.1                                          |
| Safari on iOS       | 14 per compat data (iOS 14.3 beta per WebKit) |
| Chrome for Android  | Yes                                           |
| Firefox for Android | No per caniuse                                |

Sources: [`api/MediaRecorder.json`](https://github.com/mdn/browser-compat-data/blob/main/api/MediaRecorder.json); [caniuse MediaRecorder](https://caniuse.com/mediarecorder); [WebKit MediaRecorder API post](https://webkit.org/blog/11353/mediarecorder-api/).

### Capture surfaces offered, per browser

| Browser        | Tab                                | Window | Screen |
| -------------- | ---------------------------------- | ------ | ------ |
| Chrome, Edge   | Yes                                | Yes    | Yes    |
| Firefox        | No                                 | Yes    | Yes    |
| Safari (macOS) | Not mentioned in any WebKit source | Yes    | Yes    |

- Firefox prompts for "Window" or "Screen" only ([bug 1800915](https://bugzilla.mozilla.org/show_bug.cgi?id=1800915), closed as a duplicate of the tab sharing meta bug). That meta bug, [1651145](https://bugzilla.mozilla.org/show_bug.cgi?id=1651145), is still open and flagged behind a preference.
- Safari: the 16.1 post describes "the sharing of their screen or a specific window of an application". No WebKit source read mentions tab capture.
- Consequence (inference): in Firefox and Safari, a Recording of the page is a recording of the whole browser window or screen, including the browser chrome and whatever else the Reviewer brings in front.

### Chromium-only controls over what is captured

| Feature                                             | Chrome (desktop) | Firefox | Safari | Chrome for Android |
| --------------------------------------------------- | ---------------- | ------- | ------ | ------------------ |
| `preferCurrentTab`                                  | 94               | No      | No     | No                 |
| `selfBrowserSurface` (default `exclude` from 112)   | 107              | No      | No     | No                 |
| `surfaceSwitching`                                  | 107              | No      | No     | No                 |
| `systemAudio`                                       | 105              | No      | No     | No                 |
| `monitorTypeSurfaces`                               | 119              | No      | No     | No                 |
| Region Capture (`CropTarget`, `cropTo`)             | 104              | No      | No     | No                 |
| Element Capture (`RestrictionTarget`, `restrictTo`) | 132              | No      | No     | No                 |

Sources: compat data files `MediaDevices.json`, `CropTarget.json`, `RestrictionTarget.json`, `BrowserCaptureMediaStreamTrack.json`; [Chrome screen sharing controls](https://developer.chrome.com/docs/web-platform/screen-sharing-controls); [Region Capture](https://developer.chrome.com/docs/web-platform/region-capture) ("available from Chrome 104 on desktop only"); [Element Capture](https://developer.chrome.com/docs/web-platform/element-capture) ("available from Chrome 132 on desktop only"). Edge mirrors Chrome.

## The share prompt

### What the spec imposes on every browser

From the [Screen Capture spec](https://www.w3.org/TR/screen-capture/) (W3C Working Draft, 27 August 2026):

- The call needs transient user activation, and consumes it. Without it the promise rejects with `InvalidStateError`. The document must be fully active and focused.
- The browser "MUST let the end-user choose which display surface to share out of all available choices every time".
- The browser "MUST NOT use any MediaTrackConstraints in options.video or options.audio to limit that choice". Constraints with `min`, `exact` or `advanced` reject with `TypeError`.
- The browser "MUST NOT store a `granted` permission entry". The `display-capture` permission state can only be `prompt` or `denied`.

MDN states the same in plain words: "The go-ahead permission to use `getDisplayMedia()` cannot be persisted for reuse. The user must be prompted for permission every time." ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia))

So two Recordings in a row mean two prompts, in every browser.

### Steering the choice toward the current tab (Chromium only)

- **`preferCurrentTab: true`** "instructs the browser to offer the current tab as the most prominent capture source, that is, as a separate 'This Tab' option" (MDN). The [WICG draft](https://wicg.github.io/prefer-current-tab/) says browsers "MAY rely on this preference to limit the set of options presented to the user" and that this "does not obviate user agents' duty to ensure active user consent". The Reviewer still has to confirm. It cannot be combined with `selfBrowserSurface: "exclude"`. Mozilla's position on the feature was "harmful" ([Intent to Ship thread](https://groups.google.com/a/chromium.org/g/blink-dev/c/YoefXLTQsw0)).
- **`selfBrowserSurface: "include"`** puts the current tab back in the list of tabs; Chrome excludes it by default. It is a hint the browser "MAY ignore" (spec).
- **`displaySurface: "browser"`** preselects the tabs pane of the picker. It cannot preselect a specific tab.
- **`monitorTypeSurfaces: "exclude"`** removes whole screens from the picker.
- **Region Capture** crops the video track of a self-captured tab to the rectangle of an element, after the Reviewer has chosen the tab. "Pixels occluding the target will be captured." `cropTo()` rejects if "the current track is not a self-capture video track".
- **Element Capture** restricts the track to one DOM subtree: occluding and occluded content are both removed. The target "must form its own stacking context", must not be `display: none`, and frames stop while the element is ineligible. "Element Capture is only enabled for self-capture for now." Frames carry no alpha channel.

Neither Region Capture nor Element Capture changes the prompt. Both depend on the Reviewer having picked the current tab, which the page can verify afterwards (the track's `displaySurface` setting) but cannot force.

A prompt-light API for capturing only the current tab, `getViewportMedia()`, exists as an incomplete draft ([mediacapture-viewport](https://w3c.github.io/mediacapture-viewport/)). It is "only available to cross-origin isolated documents", still prompts, still forbids a persisted grant, and the draft states no implementation.

### What the Reviewer sees

- **Chrome, Edge**: a picker with tabs, windows and screens; with `preferCurrentTab`, a "This Tab" option shown most prominently. After accepting, Chrome "draws a blue border around captured tabs" (Element Capture doc) and shows a sharing indicator.
- **Firefox**: a prompt to choose a window or a screen.
- **Safari**: a prompt worded "Allow [site] to share your screen?" (caption in the Safari 16.1 post), for a screen or a window.
- **All browsers**: "the machine which is sharing screen contents will display some form of indicator so the user is aware that sharing is taking place" ([MDN, Using the Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture)). A script cannot hide it, and the Reviewer can stop the capture from the browser's own UI at any time, which ends the track.

### What a script cannot skip

- The user gesture immediately before the call.
- The picker, on every call.
- The Reviewer's own choice of surface: the page can express a preference, never impose the tab.
- The browser's sharing indicator during capture.

## Output

### Containers and codecs a browser can record

| Browser             | WebM                    | MP4                                                   | Default video bitrate |
| ------------------- | ----------------------- | ----------------------------------------------------- | --------------------- |
| Chrome, Edge        | VP8, VP9, AV1 with Opus | From 126: H.264 with AAC (also VP9, AV1, Opus in MP4) | 2.5 Mbps              |
| Firefox             | VP8 with Opus only      | No                                                    | 2.5 Mbps              |
| Safari 14.1 to 18.3 | No                      | H.264 with AAC                                        | 10 Mbps               |
| Safari 18.4+        | VP8 or VP9 with Opus    | Fragmented MP4: H.264, HEVC, AV1 on capable hardware  | 10 Mbps               |

Sources:

- Chromium: [`media_recorder_handler.cc`](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/modules/mediarecorder/media_recorder_handler.cc) (codec lists; H.264 and AAC only in builds with proprietary codecs) and [`media_recorder.cc`](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/modules/mediarecorder/media_recorder.cc) (`kDefaultVideoBitRate = 2500e3`, `kDefaultAudioBitRate = 128e3`). MP4 muxing shipped in Chrome 126 on desktop, Android and WebView ([Chrome Platform Status](https://chromestatus.com/feature/5163469011943424), [Chrome 126 release notes](https://developer.chrome.com/release-notes/126)).
- Firefox: [`dom/media/MediaRecorder.cpp`](https://github.com/mozilla-firefox/firefox/blob/main/dom/media/MediaRecorder.cpp) accepts `video/webm` with `vp8` and `opus` only (`DEFAULT_VIDEO_BITRATE_BPS = 2500e3`). MP4 recording is an open request, [bug 1631143](https://bugzilla.mozilla.org/show_bug.cgi?id=1631143): Firefox has no MP4 muxer and Mozilla calls it "not a huge priority".
- Safari: [MediaRecorder API post](https://webkit.org/blog/11353/mediarecorder-api/) ("MP4 file format with H.264 as video codec and AAC as audio codec"); [WebKit features in Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/) (WebM with Opus and VP8 or VP9, fragmented MP4, H.264, HEVC, AV1); default from [`MediaRecorderPrivate.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/mediarecorder/MediaRecorderPrivate.cpp) (`LargeVideoBitRate = 10000000`).
- The [MediaStream Recording spec](https://www.w3.org/TR/mediastream-recording/) (Working Draft, 16 March 2026) mandates no container and no codec. With no `mimeType`, the choice is left "up to the UA". `MediaRecorder.isTypeSupported()` is the only reliable probe.

### Does one file play everywhere without transcoding

| Recorded format    | Recordable in                          | Plays in                                                                                            |
| ------------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| WebM, VP8 and Opus | Chrome, Firefox, Safari 18.4+          | Chrome 25+, Firefox 28+, Safari 16.0+ on macOS (14.1 to 15.6 need macOS 11.3+), Safari on iOS 17.4+ |
| MP4, H.264 and AAC | Chrome 126+, Safari 14.1+, not Firefox | Every browser (Chrome 4+, Firefox 35+, Safari 3.2+, iOS, Android)                                   |

Sources: [caniuse WebM](https://caniuse.com/webm), [caniuse MPEG-4/H.264](https://caniuse.com/mpeg4).

- There is no format that every capturing browser can record and every browser can play. A Recording made in Firefox is WebM and will not play in Safari on iOS before 17.4. MP4 plays everywhere but Firefox cannot produce it.
- With no server-side processing, the file the Reviewer's browser produced is the file the team and the agent get.

### Seekability and duration metadata

The spec says nothing about duration, cues or seeking. Behaviour is per engine:

- **Chromium, WebM**: when `start()` is called with no timeslice and `requestData()` is never called, the current source writes "a seekable WebM instead of a live one", with duration and with Cues at the front (`kMediaRecorderSeekableWebm`, enabled by default, in [`media_recorder_handler.cc`](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/modules/mediarecorder/media_recorder_handler.cc) and [`memory_webm_muxer_delegate.h`](https://github.com/chromium/chromium/blob/main/media/muxers/memory_webm_muxer_delegate.h)). This mode buffers the whole recording in memory. With a timeslice, or after a `requestData()` call, it falls back to live WebM: "duration will no longer be written during finalization and cues will be written at the end of the file instead of at the beginning as required for seeking".
- **Chromium, MP4**: fragmented, "single movie box and multiple fragment boxes" ([`mp4_muxer_delegate.h`](https://github.com/chromium/chromium/blob/main/media/muxers/mp4_muxer_delegate.h)). A random access box is written last except in live mode, and "live should not have duration".
- **Safari**: fragmented MP4 (18.4 post). Duration metadata not checked.
- **Firefox, WebM**: not checked.

Inference: periodic chunks (needed for a rolling buffer, for incremental upload, or to survive a crash) and a seekable file with a known duration pull in opposite directions in Chromium. A file without duration metadata still plays, but a player cannot show its length or seek reliably until it has read the file.

### Size per minute

Size is bitrate times duration. The bitrate is requested through `videoBitsPerSecond`; the spec calls it "a hint for the encoder and the value might be surpassed, not achieved".

| Video bitrate                           | Size per minute | Seconds that fit in 5 MB |
| --------------------------------------- | --------------- | ------------------------ |
| 0.5 Mbps                                | 3.75 MB         | 80                       |
| 1 Mbps                                  | 7.5 MB          | 40                       |
| 2.5 Mbps (Chromium and Firefox default) | 18.75 MB        | 16                       |
| 10 Mbps (Safari default)                | 75 MB           | 4                        |

- Audio adds about 0.96 MB per minute at 128 kbps, the Chromium and Firefox default.
- The 5 MB column is the current cap of the Screenshot upload path, given for scale.
- Which bitrate is "usable" for a page at a given resolution was not established from a primary source. Screen content is mostly static, so real files may come in under the requested bitrate. This needs measuring.
- Resolution and frame rate are set through track constraints on `getDisplayMedia()`, applied after the Reviewer has chosen the surface, not through `MediaRecorder`.

## Audio

### Audio of the captured surface

- Chrome 74+ only. "On Windows and ChromeOS, the entire system audio can be captured when sharing an entire screen. On Linux and macOS, only the audio of a tab can be captured" (compat data note). Firefox and Safari: no audio from `getDisplayMedia()`.
- The spec lets the browser return no audio track even when asked, forbids audio-only requests, and requires that it "MUST NOT share audio without active user consent". Chrome's documentation describes audio as offered inside the same picker ("Chrome offers audio capture for tabs and windows"), so tab audio adds no second prompt; the exact control was not checked.
- Chromium-only refinements: `systemAudio` (105), `suppressLocalAudioPlayback` (109), `windowAudio` and `restrictOwnAudio` (141).

### Microphone

- The microphone comes from a separate `getUserMedia({ audio: true })` call, with its own prompt. So a narrated Recording costs two prompts the first time.
- Unlike screen capture, this permission can be remembered: "Browsers may offer a once-per-domain permission feature, but they must ask at least the first time" ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)). The permission belongs to the origin of the customer's site, not to Faster Fixes.
- It is governed by the `microphone` Permissions Policy directive of the embedding site.
- Browsers show a microphone-in-use indicator.

### Mixing

- Chromium records one video track and one audio track: the handler uses only the first of each, with a comment that "the muxer API supports only one audio track". Recording tab audio and the microphone together therefore means mixing them into one track first, with the Web Audio API (inference from the source; not tested).
- The spec stops the recording with an error if "a track is added to or removed from stream's track set". The microphone track has to be in the stream before `start()`.

## Lifetime

- **Full page navigation and reload end the capture.** The Media Capture and Streams spec requires the browser to stop all sources of a window when "the unloading document cleanup steps are executed for its associated document", which ends every track ([spec, section 4.3](https://www.w3.org/TR/mediacapture-streams/)). The recorder and the chunks it holds in memory live in the same document and go with it.
- **A same-origin SPA route change keeps the capture** (inference): the History API does not unload the document, so the stream, the recorder and the Widget all stay alive. This also holds for the Chromium-only crop and restriction targets as long as their element still exists.
- **No way to continue across page loads without a new prompt.** The permission cannot be stored and the picker is required on every call. After the navigation, the new document has to ask again, after a new user gesture.
- **A capture held by another document** (inference, not tested): a stream belongs to the document that called `getDisplayMedia()`, not to the surface captured. A separate window that stays open could keep capturing a tab while that tab navigates. The Reviewer would have to pick the right tab by hand in that window's picker, in Chromium only, and `preferCurrentTab`, Region Capture and Element Capture would not apply since they are self-capture features.
- **The Reviewer or the browser can end it at any time**: the track fires `ended`. When all tracks have ended, the recorder stops and delivers what it has.
- Chunks already handed to the page can be persisted before unload (for example to IndexedDB), but chunks from one recorder are not independent files: see [Retroactive capture](#retroactive-capture).

## Embedding constraints

- **Secure context.** `navigator.mediaDevices` is `undefined` outside a secure context (HTTPS, or `localhost`) (MDN).
- **Permissions Policy.** The feature is `display-capture`, default allowlist `self` (spec). A script running in the top-level document of the customer's site, as the Widget does, is allowed by default. Two cases block it, with `NotAllowedError`:
  - the customer's site sends `Permissions-Policy: display-capture=()`;
  - the page that hosts the Widget is itself inside a cross-origin iframe without `allow="display-capture"`.
- The `allow="display-capture"` iframe attribute is supported in Chrome 94+, Firefox 74+ and Safari 13+; the `Permissions-Policy` response header directive only in Chrome 94+ (compat data).
- **Shadow root.** The API lives on `navigator.mediaDevices` and takes no DOM element, so the Widget living in an open shadow root does not matter to `getDisplayMedia()` or `MediaRecorder`. Nothing in the specs read ties capture to the light DOM. Whether `CropTarget.fromElement()` and `RestrictionTarget.fromElement()` accept an element inside a shadow tree was not checked.
- **Origin.** The Widget runs with the origin of the customer's site: the prompt names that site, and a remembered microphone permission is that site's.
- **The Widget captures itself.** A capture of the tab is a capture of its pixels, Widget UI included, and cross-origin iframes included. Only Element Capture (Chrome 132+ desktop) removes content that is outside a chosen subtree.
- **macOS.** Capturing a window or a screen requires the browser to hold the system's Screen and System Audio Recording permission ([Apple Support](https://support.apple.com/guide/mac-help/control-access-screen-system-audio-recording-mchld6aa7d23/mac)). Chromium's tracker states that tab capture uses a different mechanism and is not affected, but that page could not be opened directly.

## Retroactive capture

"Attach the last N seconds before the Feedback" is not achievable in general with this technique:

- Nothing is captured before the Reviewer has accepted the picker, and the acceptance cannot be remembered. A buffer can only exist if the Reviewer started sharing earlier, in the same document, with the browser's sharing indicator on the whole time.
- The buffer does not survive a page load, since the capture does not.
- Within one continuous capture on one document, a rolling window is technically possible, with a cost. The spec only guarantees that "the combination of all the Blobs from a completed recording MUST be playable" and that "the individual Blobs need not be playable": dropping the oldest chunks breaks the file. Keeping only the last N seconds means restarting recorders on a cycle or rewriting the container in the browser (inference).

So retroactive capture reduces to "the Reviewer deliberately started a capture earlier and it is still running", which is deliberate capture with a different stop rule.

## Hard limits

No implementation can work around these:

1. A user gesture and a browser prompt are required at the start of every capture. The grant cannot be stored, by spec, in any browser.
2. The page cannot choose the surface. It can express a preference in Chromium; the Reviewer can always pick another tab, a window or a whole screen, and the Recording then contains that.
3. Capturing only the page's own tab is Chromium-only. Firefox and Safari capture a window or a screen.
4. Cropping or restricting the capture to part of the page is Chromium desktop only (Region Capture 104+, Element Capture 132+), and only after the Reviewer has picked the current tab.
5. A capture ends when the document unloads. A full navigation or a reload stops the Recording, and continuing needs a new gesture and a new prompt.
6. Nothing can be captured retroactively from before the prompt was accepted.
7. The browser's sharing indicator cannot be hidden, and the Reviewer or the browser can stop the capture at any moment.
8. Android browsers do not support it. On iOS it is absent before 27.0 and undocumented from 27.0.
9. It requires a secure context, and the customer's site can disable it with a `display-capture` Permissions Policy.
10. The output format is the recording browser's choice among what it supports. Firefox cannot record MP4; Safari before 18.4 cannot record WebM. Without transcoding there is no single format for all Recordings.
11. Audio of the page is Chromium-only. A microphone costs a second prompt and a second permission.
12. The output is pixels. It contains whatever was on the chosen surface, with no DOM, no text and no structure.

## Unverified

Not confirmed from a primary source on the research date:

- **Safari on iOS 27**: rests on a compat-data entry, an existence test and one user report. No Apple or WebKit statement. Surfaces offered, prompt wording, recording behaviour and behaviour in other iOS browsers are unknown.
- **Chrome's exact dialog with `preferCurrentTab`**: whether the current build shows only an allow or deny choice for the tab, or the full picker with the tab on top. MDN and the WICG draft describe the intent, not the current UI.
- **The Chrome version that introduced seekable WebM**: read in the current Chromium source. A third-party write-up places it in Chrome 140; the Chromium issue (40482588) could not be opened without signing in.
- **Duration and seek metadata in Firefox WebM and Safari MP4 output**, and whether Chromium's "live mode" for MP4 corresponds exactly to using a timeslice.
- **Playback of fragmented MP4 from `MediaRecorder` as a plain file in every browser**: expected to work, not checked.
- **Safari's default container** when no `mimeType` is given from 18.4 on, and whether Safari offers tab capture at all.
- **macOS system permission and tab capture in Chrome**: the statement that tab capture is exempt comes from a search result of the Chromium tracker, not from the page itself. The effect of the system picker in recent macOS versions on Safari and Chrome was not established.
- **Region Capture and Element Capture targets inside a shadow tree.**
- **Real file size for screen content** at a given bitrate and resolution, and the lowest bitrate at which page text stays legible. Needs a measurement in each engine.
- **Capture held by a second window, and mixing tab audio with a microphone through Web Audio**: inferences from the specs and the Chromium source, not tested.
- **Chrome for Android**: the compat data says unsupported; no Chrome Platform Status entry was read to confirm that nothing is in progress.
- The Chrome developer pages for Region Capture and screen sharing controls carry old or no update dates; version facts were cross-checked against the compat data, behaviour descriptions were not.
