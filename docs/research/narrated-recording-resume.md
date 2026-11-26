# How a narrated Recording resumes after a full page load on each browser

> Tests for [#503](https://github.com/manucoffin/faster-fixes/issues/503), part of the map [#490 Narrated Recording](https://github.com/manucoffin/faster-fixes/issues/490). Run on 2026-11-26 on macOS, with a real microphone and a real voice, in Chrome 157, Firefox 160 and Safari 26.5, and scripted in Playwright's Chromium 153, Firefox 155 and WebKit 26.6. Edge, iOS and Android were not tested.

## Summary

- **No gesture is needed.** On the three desktop browsers, `getUserMedia` succeeds after a full page load with no click.
- **The prompt returns only in Firefox**, when the Reviewer allowed without "Remember this decision": once per page load, and the voice is cut until they answer (1.8 to 4.3 s here). Chrome ("while visiting" and "this time") and Safari (site on "Ask" or "Allow") do not prompt again.
- **The gap** when no prompt returns: the replay resumes 10 to 170 ms after the unload, the audio recorder 70 to 560 ms after it. Up to one second of voice before the unload is lost with a one-second timeslice.
- **Stitching works.** Chunks persisted to IndexedDB survive the load, the segments replay as one rrweb replay, and each audio segment decodes. Audio is one file per segment and needs remuxing to become one.
- **Safari restores pages from its back/forward cache while recording.** The restored page has an ended microphone track and a failed recorder; a new `getUserMedia` call works there, with no prompt, in about 115 ms. Chrome and Firefox reload the page on back and forward.
- **In Safari, a write in flight when the page enters that cache locked IndexedDB** for every later page, in one run. Aborting writes on `pagehide` and opening a connection per operation avoided it in the three runs that followed.
- **Another subdomain is another origin**: nothing resumes there. The Recording resumes on return, with a gap equal to the time spent away.
- **Safari weighs 269 KB per minute of voice at 32 kbit/s** and is clear by ear. Asked for 24 kbit/s it records at 193 kbit/s (1.4 MB per minute), as Playwright's WebKit did.

## Method

`narrated-recording-resume/page.html` records with rrweb 2.2.2 and `MediaRecorder` (mono, one-second timeslice), writes event batches and audio chunks to IndexedDB, keeps its state and a timestamped log in `localStorage`, and asks for the microphone again by itself on every load. On stop it reads the chunks back, replays the events with the rrweb `Replayer`, decodes each audio segment and posts a report to `server.mjs`. `drive.mjs` runs it in Playwright's three engines with a fake microphone, where permission is granted without a prompt.

By hand, each pass was: reset the site's microphone permission, start, read a one-minute text aloud, reload, follow a link to a second page, back, forward, stop. Reports are in `narrated-recording-resume/reports/`; the audio is not kept.

## Prompts and gaps

Gaps are milliseconds from `pagehide` to the event named, per page load.

| Browser                   | First answer                  | Prompt after a load   | First rrweb event | Recorder started                       |
| ------------------------- | ----------------------------- | --------------------- | ----------------- | -------------------------------------- |
| Chrome 157                | Allow while visiting the site | no                    | 47 to 172         | 284 to 488                             |
| Chrome 157                | Allow this time               | no                    | 51 to 56          | 291 to 564                             |
| Firefox 160               | Allow, not remembered         | **yes, at each load** | 36 to 43          | 1,825 to 4,312 (the Reviewer's answer) |
| Firefox 160               | Allow, remembered             | no                    | 37                | 71 (reload only)                       |
| Safari 26.5               | Allow, site on "Ask"          | no                    | 12 to 18          | 117 to 120                             |
| Safari 26.5               | Site on "Allow"               | no                    | 7 to 25           | 113 to 127                             |
| Playwright, three engines | granted without a prompt      | no                    | 3 to 30           | 17 to 85                               |

- In Firefox the permission state reads `granted` while the temporary grant is live, and the prompt still appears: the Widget cannot tell beforehand that it will.
- In Safari, a prompt appeared at the start of each pass, including with the site set to "Allow". After 3.5 minutes without capture, the permission state was back to `prompt`: one observation, not explored.
- Safari takes about two seconds to open the microphone at the start of a Recording, prompt or not, and delivers its first audio chunk about two seconds after a load.
- `navigator.userActivation.isActive` was `false` on every resume: none relied on a gesture.

## Back and forward

- Chrome and Firefox: `pagehide` with `persisted: false`, then a full load (`back_forward`). Same as any other load.
- Safari: `pagehide` with `persisted: true` on link, back and forward, while recording. On restore, `pageshow` is `persisted`, the track is `ended`, the recorder is `inactive` and fires an `UnknownError`. The old script is alive again, so the page must detect the restore and ask for the microphone again; that succeeded every time (99 to 112 ms, no prompt).
- Playwright's WebKit never used the cache, so only Safari itself shows this.

## Storage across loads

- Chunks and events written before the load were read back after it in every run but one, and replayed as one Recording (72 to 113 s, five segments).
- Safari, first run: a chunk write failed with `NotReadableError` as the page was hidden, later writes failed after a cache restore, and from then on no read returned, even from a freshly loaded page. Nothing was recovered. The likely cause, not proven: a write transaction frozen with its page in the back/forward cache keeps the object store locked.
- After the page aborted open writes on `pagehide`, moved the last events through `localStorage` and opened a connection per operation, three Safari runs completed.
- Playwright's WebKit rejects a `Blob` in IndexedDB in an ephemeral session; storing the bytes (`ArrayBuffer`) works everywhere.
- Reading the last audio chunk during `pagehide` fails in WebKit (`NotReadableError`): that chunk is lost.

## Voice size with a real microphone

Per segment, wall-clock KB per minute; the first figure is the one-minute reading, the others are short segments where the container header weighs more.

| Browser     | Asked | Format       | KB per minute                             | kbit/s           |
| ----------- | ----- | ------------ | ----------------------------------------- | ---------------- |
| Chrome 157  | 32    | Opus in WebM | 224 to 233                                | 30 to 31         |
| Firefox 160 | 32    | Opus in Ogg  | 226 to 248                                | 30 to 33         |
| Safari 26.5 | 32    | AAC in MP4   | 269 (289 to 379 on segments of 3 to 11 s) | 36 (39 to 50)    |
| Safari 26.5 | 24    | AAC in MP4   | 1,447 (1,550 to 1,868)                    | 193 (207 to 249) |

Safari at 32 kbit/s was judged clear by ear by the one person who recorded.

## Not verified

- Edge, Safari on iOS, Chrome on Android. Deferred: no device at hand.
- Another subdomain in a real browser (scripted engines only, on `localhost` and `sub.localhost`).
- The IndexedDB lock in Safari: seen once, cause inferred, fix confirmed on three runs only.
- How long Safari keeps a grant when nothing is capturing.
- Gaps on a slow page: the test page loads in a few milliseconds from `localhost`. On a real site the gap is the page's load time until the Widget's script runs, plus the figures above.
