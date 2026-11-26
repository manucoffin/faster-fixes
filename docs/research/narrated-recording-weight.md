# What a real narrated Recording weighs per minute

> Measurements for [#502](https://github.com/manucoffin/faster-fixes/issues/502), part of the map [#490 Narrated Recording](https://github.com/manucoffin/faster-fixes/issues/490). Run on 2026-11-26. They replace the extrapolations of `docs/research/filmed-recording-rrweb-voice.md`.

## Summary

- **Events**: 0.6 to 1.2 MB gzipped for ten minutes with a checkpoint every five minutes, 0.5 to 0.9 MB for five minutes, 0.1 to 0.4 MB for one. Activity is 60 to 95 KB per minute on four of the five pages, with bursts to 276 KB. A full snapshot costs 50 to 290 KB.
- **Voice**: 222 to 265 KB per minute at 32 kbit/s. At 24 kbit/s, 168 to 177 KB on Chromium and Firefox, but **WebKit does not honour 24 kbit/s** and falls back to its default, 197 kbit/s (1.5 MB per minute).
- **Left unset, the bitrate is 129 to 197 kbit/s**: 1 to 1.5 MB per minute. It must be set.
- **Total at 32 kbit/s, checkpoint every five minutes**: 0.3 to 0.7 MB for one minute, 1.6 to 2.2 MB for five, 2.9 to 3.9 MB for ten.
- **The 4 MiB body limit** is passed between 10.5 and 14 minutes on a single page, and near 7 minutes when the Reviewer loads a new page every 30 seconds or when checkpoints come every minute. Sent as two bodies, events and voice each stay under the limit for ten minutes.
- **Speech**: a local Whisper model transcribes the 24 and 32 kbit/s files word for word like the uncompressed original. Nobody listened: clarity by ear, on a real voice and a real microphone, is not verified.

## Method

Scripts are in `docs/research/narrated-recording-weight/`, raw summaries in `events-summary.json` and `voice-summary.json`.

**Events** (`record-events.mjs`, `analyze-events.mjs`). Headless Chromium (Playwright 1.63) at 1440 x 900 loads five public pages with `@rrweb/record` 2.2.2 injected under the Widget's configuration (`packages/widget/src/recorder/index.ts`: same sampling, masking and blocking, no canvas, no inlined images), without the 30-second slicing. A scripted visitor acts every 0.5 to 2 seconds for ten minutes: pointer moves, wheel scrolling, clicks on buttons, tabs and in-page links, a typed phrase every 45 seconds where a field is in view, and on two pages a link followed every 40 seconds. The capture takes a checkpoint every minute; coarser intervals are simulated by dropping the checkpoints they would not have taken, then gzipping the rest as one JSON array, the layout of a Recording file. The snapshot that opens a page load is never dropped.

**Voice** (`record-voice.mjs`). A 72-second narration synthesized with macOS `say` (`speech-script.txt`, 48 kHz mono) loops through Web Audio into a `MediaStreamDestination`, and `MediaRecorder` encodes it with a one-second timeslice in Playwright's Chromium, Firefox and WebKit builds on macOS, at 24 kbit/s, 32 kbit/s and unset for one minute, and at 32 kbit/s for five. No microphone is involved, so the three engines encode the same input. Each one-minute file was then transcribed with `whisper-cli` (large-v3-turbo) and compared with the transcript of the original.

## Events

Gzipped KB. "5 min" and "none" are the checkpoint intervals.

| Page | Interaction in 10 min | Snapshot (min, median, max) | Activity per minute (min, median, max) | 1 min | 5 min | 10 min, every 5 min | 10 min, none | 10 min, every 1 min |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MDN article (`developer.mozilla.org`, one page) | 83 clicks, 13 typed phrases, 128 scrolls | 48, 133, 133 | 14, 60, 190 | 231 | 593 | 945 | 812 | 2,002 |
| Linear home (`linear.app`, animated) | 86 clicks, 106 scrolls | 185, 236, 288 | 10, 71, 155 | 390 | 514 | 1,230 | 1,005 | 3,293 |
| Stripe home (`stripe.com`, animated) | 79 clicks, 130 scrolls | 123, 132, 200 | 2, 3, 116 | 239 | 498 | 639 | 507 | 1,920 |
| React docs (`react.dev`, 14 route changes without a load) | 82 clicks, 5 typed phrases, 110 scrolls | 60, 118, 153 | 22, 94, 276 | 120 | 458 | 1,237 | 1,153 | 2,188 |
| Wikipedia (5 full page loads) | 21 clicks, 1 typed phrase, 24 scrolls | 54, 110, 192 | 53, 69, 175 | 373 | 877 | 986 | 877 | 1,643 |

- **Activity is higher than extrapolated** (4 to 66 KB per minute on 2026-11-10, pointer and scroll only): clicks that open menus, search panels and route changes rewrite DOM, and DOM mutations are over 85 % of the uncompressed incremental bytes on every page.
- **Snapshots are smaller than the worst case extrapolated** (629 KB): 48 to 288 KB here. They grow with the page: the MDN snapshot went from 48 to 133 KB once the search panel had loaded.
- **Checkpoints still decide the size.** A checkpoint every minute doubles or triples the ten-minute file; every five minutes adds one snapshot, 8 to 22 %.
- **A full page load costs one snapshot**, 54 to 192 KB on Wikipedia. An earlier run of the same page, cut short at 5.3 minutes by a stalled script, made 11 loads in five minutes and weighed 1,329 KB at five minutes. At one load every 30 seconds, ten minutes would be about 2.9 MB of events (20 x 110 + 10 x 69, computed, not measured).
- Starting the recorder, first snapshot included, took 13 to 51 ms.

## Voice

| Engine | Container, codec | 24 kbit/s asked | 32 kbit/s asked | Unset | 32 kbit/s, 5 min |
| --- | --- | --- | --- | --- | --- |
| Chromium | WebM, Opus | 22.4 kbit/s, 168 KB/min | 29.6 kbit/s, 222 KB/min | 128.8 kbit/s, 966 KB/min | 1,110 KB |
| Firefox | Ogg, Opus | 23.6 kbit/s, 177 KB/min | 31.1 kbit/s, 234 KB/min | 130.1 kbit/s, 976 KB/min | 1,172 KB |
| WebKit | MP4, AAC-LC | **196.7 kbit/s, 1,475 KB/min** | 35.3 kbit/s, 265 KB/min | 196.7 kbit/s, 1,475 KB/min | 1,321 KB |

- **WebKit ignores a bitrate its AAC encoder cannot produce** and silently uses the default. A 20-second probe on a mono track: 24 kbit/s gives 197, while 32, 48, 64 and 96 give 36, 52, 66 and 97. On a stereo track 24 and 32 are both ignored (150 kbit/s). The Widget must ask for at least 32 kbit/s on a mono track and should check the size it gets.
- **Firefox writes Ogg**, not WebM, by default: three containers, not two.
- Size is linear: five minutes is five times one minute within 1 %.
- **Speech**: the Whisper transcripts of the Chromium and Firefox files at 24 and 32 kbit/s and of the WebKit file at 32 kbit/s match the original's transcript word for word over the same audio.

## Total and the 4 MiB limit

At 32 kbit/s with a checkpoint every five minutes, lightest page with Chromium to heaviest page with WebKit:

| | 1 min | 5 min | 10 min |
| --- | --- | --- | --- |
| Events | 120 to 390 KB | 458 to 877 KB | 639 to 1,237 KB |
| Voice | 222 to 265 KB | 1,110 to 1,321 KB | 2,220 to 2,650 KB |
| Total | 0.34 to 0.66 MB | 1.6 to 2.2 MB | 2.9 to 3.9 MB |

The limit is 4 MiB, 4,194 KB, for the whole body (`RECORDING_MAX_BYTES`).

- **Single page, one body**: 290 to 390 KB per minute, so the limit falls between 10.5 and 14 minutes. Ten minutes fits with 7 % to spare in the worst case measured, before multipart overhead.
- **A new page every 30 seconds, or a checkpoint every minute**: about 555 to 600 KB per minute, so the limit falls near 7 minutes.
- **Five minutes** fits in one body in every case measured (2.2 MB at most; about 2.8 MB with a load every 30 seconds).
- **Two bodies**: the voice alone reaches 4 MiB after 15.8 minutes (WebKit), and the events stayed under 3.3 MB at ten minutes even with a checkpoint every minute.
- At 24 kbit/s on Chromium and Firefox the voice saves 55 KB per minute, 0.55 MB over ten minutes. WebKit cannot follow.

## Not verified

- **Safari itself and iOS.** WebKit here is Playwright's macOS build. The 24 kbit/s fallback and the 32 kbit/s figure need confirming in Safari on macOS and on an iPhone.
- **A real microphone and a real voice.** The input was synthesized speech through Web Audio. Echo cancellation, noise suppression and room noise change what the encoder receives. Nobody listened to the files.
- **Phones.** Every capture ran at a desktop viewport.
- **Chromium's Web Audio clock in headless mode** ran about 8 % fast (the one-minute file holds 65 seconds of the narration). The file is a continuous 60 seconds of audio, so the size per minute stands.
- **Sites Faster Fixes serves.** Five public pages, one ten-minute run each, random interaction. A data grid or a long virtualized list would weigh more.
- **Dropping a checkpoint after the fact** leaves node ids that a real capture would have numbered differently. The bytes are those of a real stream to within a few percent; the result is not a playable file.
