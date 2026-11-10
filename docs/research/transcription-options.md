# Transcription options

Research for [#367](https://github.com/manucoffin/faster-fixes/issues/367), part of the map [Recording in the Widget](https://github.com/manucoffin/faster-fixes/issues/362).

**Question**: if a Reviewer speaks while making a Recording, what are the options to turn that voice into a transcript, and what does each cost?

**Checked on**: 2026-11-10. Prices and model line-ups move fast; every figure below was read from the linked page on that date. Prices are USD unless stated, list price, pay as you go.

This document reports facts and what the decision needs. It does not decide whether a transcript ships, where it is produced, or how it is gated by Plan.

## Short answer

There are three places a transcript can be produced, and they differ more on reliability and reach than on price.

| Where                                         | Cost per recorded minute                                                 | Timestamps                                                | Main limit                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Browser, Web Speech API                       | 0                                                                        | None implemented (only event arrival time)                | Live only, engine and privacy differ per browser, no on-device mode in Safari or on Android           |
| Browser, Whisper-class model (WASM or WebGPU) | 0, paid by the Reviewer's device: 41 to 250 MB download, then compute    | Segment and word                                          | Download size, device capability, no multi-threading inside a third-party page                        |
| Third-party API                               | 0.0005 to 0.006 for most vendors, up to 0.0167 for hyperscaler real-time | Word-level at most vendors, not on OpenAI's current model | Audio leaves the instance, retention and EU terms vary                                                |
| Self-hosted model (sidecar container)         | 0 marginal, costs about 1 to 1.5 GB of RAM and CPU time on the instance  | Segment and word                                          | CPU only: `small` is the realistic ceiling, and `small` is markedly worse than large models on French |

A self-hosted Docker Compose instance can realistically run Whisper `small` (or `base`) on CPU in one extra container, at several times real time on a desktop-class CPU. See [What a self-hosted instance can run](#what-a-self-hosted-instance-can-run).

## 1. In the browser

### Web Speech API (`SpeechRecognition`)

- **Support** (MDN browser-compat-data): Chrome 33+ with the `webkit` prefix and unprefixed since 139; Safari 14.1+ with the `webkit` prefix; Firefox since 160, which was released on 2026-11-10, desktop only. Firefox for Android has no support. [BCD `SpeechRecognition.json`](https://github.com/mdn/browser-compat-data/blob/main/api/SpeechRecognition.json), [Firefox 160 release notes](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/160).
- **Where audio goes**: "By default, using speech recognition on a web page involves a server-based recognition engine. Your audio is sent to a web service for recognition processing, so it won't work offline." [MDN, Using the Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API). The spec says the same: with `processLocally` false (the default) "user speech data might be sent to a remote server for processing". [Web Speech API spec](https://webaudio.github.io/web-speech-api/).
- **On-device mode**: `processLocally = true` forces local recognition and needs a one-time language pack download per language (`SpeechRecognition.available()` and `install()`). Supported in Chrome 139+ desktop and Firefox 160+ desktop; not in Chrome for Android, not in Safari. Firefox 160 is on-device only: "Recognition is not supported on Android, and neither is remote (cloud) recognition", "in 40 languages". `available()` and `install()` are gated by the `on-device-speech-recognition` Permissions-Policy, default allowlist `self`, which matters only for cross-origin iframes.
- **Feeding the recorded track**: `start(audioTrack)` accepts a `MediaStreamTrack`, so the same microphone track can feed both a recorder and the recognizer without a second permission prompt. Chrome 135+ desktop and Firefox 160+ only; not Safari, not Chrome for Android.
- **Timestamps**: `SpeechRecognitionAlternative` exposes only `transcript` and `confidence`. The current editor's draft adds `speechStartTime` and `speechEndTime` to `SpeechRecognitionResult`, but browser-compat-data has no entry for them, so no implementation is confirmed. In practice alignment means stamping each `result` event with the Recording clock on arrival, which gives phrase-level, late-biased timing.
- **Reliability**: it is a live API. It cannot transcribe a file after the fact, so a failure during capture (the spec lists `network`, `no-speech`, `not-allowed`, `language-not-supported`) loses the transcript unless the audio is also recorded. The language is set up front (`lang`); the pages read describe no language detection. With `continuous = false` (the default) it returns at most one final result.
- **Cost**: none to Faster Fixes.

### Whisper-class models running client-side

Two primary routes: [whisper.cpp compiled to WASM](https://github.com/ggml-org/whisper.cpp/tree/master/examples/whisper.wasm) and [Transformers.js](https://huggingface.co/docs/transformers.js/guides/webgpu) (ONNX Runtime Web, WASM or WebGPU; `@huggingface/transformers` 4.3.2, Apache-2.0).

**Download size.** ONNX weights published by `onnx-community`, encoder plus merged decoder, read from the Hugging Face file listings on 2026-11-10:

| Model                    | 8-bit (WASM)     | fp16 (WebGPU) | Parameters |
| ------------------------ | ---------------- | ------------- | ---------- |
| `whisper-tiny`           | 41 MB            | 76 MB         | 39 M       |
| `whisper-base`           | 77 MB            | 146 MB        | 74 M       |
| `whisper-small`          | 249 MB           | 485 MB        | 244 M      |
| `whisper-large-v3-turbo` | 564 MB (`q4f16`) | 1,618 MB      | 809 M      |

Sources: [whisper-tiny](https://huggingface.co/onnx-community/whisper-tiny/tree/main/onnx), [whisper-base](https://huggingface.co/onnx-community/whisper-base/tree/main/onnx), [whisper-small](https://huggingface.co/onnx-community/whisper-small/tree/main/onnx), [whisper-large-v3-turbo](https://huggingface.co/onnx-community/whisper-large-v3-turbo/tree/main/onnx); parameter counts from the [Whisper README](https://github.com/openai/whisper/blob/main/README.md). The whisper.cpp WASM example quotes 74 MB for `tiny` in its own format. The runtime itself (JS plus the ONNX Runtime WASM binary) comes on top; its transferred size was not measured.

**Speed.** The whisper.cpp WASM example states: "capable of running all models up to size `small` inclusive. Beyond that, the memory requirements and performance are unsatisfactory", "x2 or x3 real-time for the `tiny` and `base` models", audio limited to 120 seconds in that demo, WASM SIMD required. No primary benchmark was found for WebGPU real-time factors.

**Device requirements.**

- WebGPU (browser-compat-data `GPU.json`): Chrome 113+ on ChromeOS, macOS and Windows, Linux from 144 on Intel Gen12+ only; Chrome for Android 121+; Firefox 141+ on Windows, macOS on Apple silicon from 145 (147 for older macOS versions), no Linux, no Android; Safari 26+. The Transformers.js guide puts global support at "around 85%" as of March 2026 and calls WebGPU experimental "especially in non-Chromium browsers".
- WASM multi-threading in ONNX Runtime Web is enabled "only when the browser supports WebAssembly multi-threading and `crossOriginIsolated` mode is enabled" ([ONNX Runtime Web flags](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html)). The Widget runs inside the customer's page and cannot set that page's isolation headers, so the WASM path is single-threaded there. The same page notes the proxy worker "cannot work in a Content Security Policy (CSP) restricted environment".
- The inbox is a different case: it is Faster Fixes' own page, so a model could run there, on the device of whoever opens the Feedback, with headers under our control.

**Accuracy.** Same models as server-side Whisper, so the per-size error rates in [section 5](#5-output) apply. The sizes that are practical to download (`tiny`, `base`) are the weak ones on French.

## 2. Third-party APIs

Batch (pre-recorded) transcription only; streaming prices are higher everywhere and are not needed for a Recording that is transcribed after submission.

| Service and model                              | Price per minute                                        | Timestamps                                                                   | Input limits                                                                      | Retention and region                                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI `gpt-transcribe`                        | 0.0045                                                  | None documented: "returns the transcript and the detected languages as JSON" | 25 MB; flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm                            | Not used for training by default; abuse logs up to 30 days; ZDR on approval; EU endpoint `eu.api.openai.com` requires approved ZDR or modified abuse monitoring           |
| OpenAI `whisper-1` (deprecated)                | 0.006                                                   | Word and segment (`verbose_json`)                                            | Same                                                                              | Same. Shuts down 2027-02-26, with `gpt-4o-transcribe` (0.006) and `gpt-4o-mini-transcribe` (0.003)                                                                        |
| Deepgram Nova-3                                | 0.0043 monolingual, 0.0052 multilingual                 | Word (`start`, `end`, `confidence`)                                          | 2 GB; MP3, MP4, WAV, FLAC, M4A, Ogg, Opus, WebM and more                          | Retained for model improvement by default; `mip_opt_out=true` stops retention after the response; EU endpoint `api.eu.deepgram.com` (no Whisper models there)             |
| AssemblyAI Universal-2                         | 0.0025 (0.15 per hour)                                  | Not verified in this pass                                                    | Not verified in this pass                                                         | Uploads deleted in 24 to 48 hours, transcripts after 30 days, TTL down to 1 hour; EU endpoint `api.eu.assemblyai.com` at the same price, EU traffic not used for training |
| AssemblyAI Universal-3.5 Pro                   | 0.0035 (0.21 per hour)                                  | Not verified in this pass                                                    | Not verified in this pass                                                         | Same. 18 languages, falls back to Universal-2 outside that set                                                                                                            |
| Mistral Voxtral Mini Transcribe V2             | 0.003                                                   | Word                                                                         | Up to 3 hours per request; formats not stated                                     | Hosted in the EU by default, US endpoint opt-in; retention period not verified                                                                                            |
| Groq `whisper-large-v3-turbo`                  | 0.00067 (0.04 per hour)                                 | Word and segment (`verbose_json`)                                            | 25 MB free tier, 100 MB dev tier; flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm | No retention of inputs or outputs by default, logs up to 30 days, ZDR self-serve; data stored in the United States. Minimum billed length 10 seconds                      |
| Groq `whisper-large-v3`                        | 0.00185 (0.111 per hour)                                | Same                                                                         | Same                                                                              | Same                                                                                                                                                                      |
| Cloudflare Workers AI `whisper-large-v3-turbo` | 0.0005                                                  | Not verified in this pass                                                    | Not verified in this pass                                                         | Not verified in this pass. 10,000 free Neurons per day, about 214 minutes                                                                                                 |
| ElevenLabs Scribe v2                           | 0.0037 (0.22 per hour)                                  | Not verified in this pass                                                    | Not verified in this pass                                                         | Not verified in this pass                                                                                                                                                 |
| Gladia Solaria-3 / Solaria-1                   | EUR 0.0027 / EUR 0.0045 (0.16 / 0.27 per hour)          | Not verified in this pass                                                    | 1,000 MB, 135 minutes; mp4, mov, ogg, opus, m4a, wav and more, WebM not listed    | Self-serve is opted in to model training by default, free opt-out; zero retention is an Enterprise feature                                                                |
| Google Speech-to-Text V2                       | 0.016 standard, 0.003 dynamic batch                     | Not verified in this pass                                                    | Not verified in this pass                                                         | 60 free minutes per month                                                                                                                                                 |
| Amazon Transcribe, batch                       | 0.006 (0.0001 per second, EU Ireland)                   | Not verified in this pass                                                    | Not verified in this pass                                                         | Per-second billing, no minimum                                                                                                                                            |
| Azure Speech                                   | 0.0167 real-time, 0.006 fast transcription, 0.003 batch | Not verified in this pass                                                    | Not verified in this pass                                                         | West Europe retail prices; 5 free hours per month, real-time only                                                                                                         |

Sources: OpenAI [pricing](https://developers.openai.com/api/docs/pricing), [speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text), [API reference](https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create), [deprecations](https://developers.openai.com/api/docs/deprecations), [data controls](https://developers.openai.com/api/docs/guides/your-data); Deepgram [pricing](https://deepgram.com/pricing), [pre-recorded audio](https://developers.deepgram.com/docs/pre-recorded-audio), [formats](https://developers.deepgram.com/docs/supported-audio-formats), [your data](https://developers.deepgram.com/trust-security/your-data), [regional endpoints](https://developers.deepgram.com/reference/regional-endpoints); AssemblyAI [pricing](https://www.assemblyai.com/pricing), [models](https://www.assemblyai.com/docs/getting-started/models), [retention](https://www.assemblyai.com/docs/faq/how-long-are-outputs-retained); Mistral [Voxtral Transcribe 2](https://mistral.ai/news/voxtral-transcribe-2), [audio docs](https://docs.mistral.ai/capabilities/audio/speech_to_text/), [data hosting](https://help.mistral.ai/en/articles/347629-where-do-you-store-my-data-or-my-organization-s-data); Groq [speech-to-text](https://console.groq.com/docs/speech-to-text), [your data](https://console.groq.com/docs/your-data); Cloudflare [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/); ElevenLabs [API pricing](https://elevenlabs.io/pricing/api); Gladia [pricing](https://www.gladia.io/pricing), [supported formats](https://docs.gladia.io/chapters/limits-and-specifications/supported-formats); Google [pricing](https://cloud.google.com/speech-to-text/pricing); AWS [price list, eu-west-1, published 2026-09-11](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/transcribe/current/eu-west-1/index.json); Azure [retail prices API](https://prices.azure.com/api/retail/prices), region `westeurope`.

Points that weigh on a choice:

- **OpenAI is mid-transition.** `gpt-transcribe` is the recommended model and the cheapest current one, but the guide states "The `timestamp_granularities[]` parameter is only supported for `whisper-1`" and "Existing integrations can use the deprecated `whisper-1` model for word or segment timestamps until February 26, 2027". No replacement for timestamps is documented. Building timeline alignment on OpenAI today means building on a model with a published shutdown date.
- **Whisper-shaped APIs are interchangeable.** Groq documents the same request shape as OpenAI's `whisper-1` (`response_format=verbose_json`, `timestamp_granularities[]` with `word` and `segment`), and the self-hostable servers in section 3 expose the same shape. One client with a configurable base URL could cover a vendor and a self-hosted sidecar.
- **Languages.** Whisper: "98 languages, but accuracy varies by language" (OpenAI guide). Deepgram Nova-3 lists French (`fr`, `fr-CA`) and defaults to English unless `language` is set. Voxtral Mini Transcribe V2 covers 13 languages including English and French. AssemblyAI Universal-2 states 99 languages; French was not confirmed on the page read.
- **EU processing** is a base-URL change at Deepgram and AssemblyAI, the default at Mistral, an approval process at OpenAI, and not offered by Groq on the page read. Gladia is a French company but its pricing page states only "GDPR, HIPAA, SOC 2 Type II"; hosting region not verified.

## 3. Self-hostable

| Project                                                     | What it is                                                  | Latest release          | Audio decoding                                                                           | HTTP server                                                                                                                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp)      | C/C++ port, CPU first, MIT                                  | v1.9.5, 2026-10-06      | 16-bit WAV natively; other formats through ffmpeg                                        | `whisper-server`, `POST /inference`, `response_format` of `json`, `text`, `srt`, `vtt`, `verbose_json` (with per-word entries). `--convert` shells out to ffmpeg |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | CTranslate2 reimplementation, Python 3.9+                   | v1.2.1, 2025-10-31      | PyAV, bundled FFmpeg libraries: "FFmpeg does **not** need to be installed on the system" | None of its own                                                                                                                                                  |
| [speaches](https://speaches.ai/)                            | "OpenAI API-compatible server" built on faster-whisper, MIT | v0.9.0-rc.3, 2025-12-27 | Through faster-whisper                                                                   | `ghcr.io/speaches-ai/speaches:latest-cpu`, port 8000, models loaded on first request and unloaded when idle                                                      |

whisper.cpp publishes `ghcr.io/ggml-org/whisper.cpp:main` (linux/amd64 and linux/arm64): "This image includes the main executable file as well as `curl` and `ffmpeg`." Its server README warns to run it sandboxed, "especially ... accepting user file uploads and using ffmpeg for format conversions". speaches has had no release since a release candidate in December 2025.

**Memory** (whisper.cpp README):

| Model  | Disk    | Memory  |
| ------ | ------- | ------- |
| tiny   | 75 MiB  | ~273 MB |
| base   | 142 MiB | ~388 MB |
| small  | 466 MiB | ~852 MB |
| medium | 1.5 GiB | ~2.1 GB |
| large  | 2.9 GiB | ~3.9 GB |

**Speed on CPU** (faster-whisper README, `small` model, 13 minutes of audio, Intel Core i7-12700K, 8 threads, beam size 5):

| Implementation                | Time  | Derived speed  | RAM     |
| ----------------------------- | ----- | -------------- | ------- |
| openai/whisper, fp32          | 6m58s | 1.9x real time | 2335 MB |
| whisper.cpp, fp32             | 2m05s | 6.2x real time | 1049 MB |
| faster-whisper, fp32          | 2m37s | 5.0x real time | 2257 MB |
| faster-whisper, int8          | 1m42s | 7.6x real time | 1477 MB |
| faster-whisper, int8, batch 8 | 51s   | 15x real time  | 3608 MB |

That CPU is a 12-core desktop part. No primary benchmark was found for a 2 to 4 vCPU cloud instance, which is what a Compose deployment typically runs on.

### What a self-hosted instance can run

The Compose stack today is three containers: `app` (Next.js, `node:22-bookworm-slim`, no ffmpeg), `postgres`, `inngest`, with local disk storage. From the figures above:

- **`small` on CPU is the realistic ceiling.** It needs roughly 1 to 1.5 GB of RAM on top of the stack and ran at 5 to 7.6 times real time on an 8-thread desktop CPU. A two-minute Recording is on the order of tens of seconds there; a small VPS will be slower by an unmeasured factor. `medium` needs about 2.1 GB and `large` about 3.9 GB before any speed consideration.
- **`base` is the low-footprint choice** (~388 MB) and is adequate for English (8.9% WER on Fleurs) but weak on French (28.5%). See section 5.
- **It fits as an optional fourth service**, not inside `app`. Both whisper.cpp's image and faster-whisper carry their own decoder, so the app keeps its "no server-side media processing" property while the sidecar accepts what `MediaRecorder` produces. The instance stays fully functional when the service is absent, which matches the map's rule that a transcript may degrade on self-hosted.
- **A self-hosted operator can also point at a vendor** with their own key if the client takes a base URL and key, at the per-minute prices in section 2.

### Fit with Inngest

- All background work is Inngest functions served from `apps/web/src/app/api/inngest/route.ts`, which sets `maxDuration = 60`, with checkpointing capped at 50 seconds in `apps/web/src/server/inngest/index.ts` (a Vercel constraint, per the comment there).
- Inngest limits: step duration "up to 2 hours, subject to the function host's shorter timeout", "4 MiB of data returned by one step", "32 MiB across event data, step data, function return data, and metadata". [Inngest usage limits](https://www.inngest.com/docs/usage-limits/inngest). The page scopes plan limits to Inngest Cloud and does not address self-hosted Inngest.
- Consequences: audio bytes cannot travel in events or step results, only a reference to the stored Asset; a transcript of a few minutes is a few kilobytes and fits a step result; a single step that waits on CPU inference can exceed 60 seconds on a slow host for a long Recording, whereas a vendor call on a short clip returns in seconds (Groq states a real-time speed factor of 189 to 216; Deepgram returns `504` only past 10 minutes of processing).

## 4. Input constraints

**What `MediaRecorder` produces.**

- Chrome records WebM by default (Firefox's containers were not re-checked in this pass); Safari recorded MP4 until 18.4, which added "creating WebM files using the Opus audio codec and either VP8 or VP9 for video". [WebKit, Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/). Chrome added MP4 (H.264 and AAC) muxing later; the shipping version was not confirmed from a primary source ([Intent to ship](https://groups.google.com/a/chromium.org/g/blink-dev/c/p1OMVj1FrMI)). The supported type has to be probed at runtime with `MediaRecorder.isTypeSupported()`.
- Defaults: "the default adopted for video is 2.5Mbps or 10 Mbps, depending on the browser. The audio default is adaptive". `audioBitsPerSecond` sets the audio bitrate. [MDN, MediaRecorder constructor](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder).

**What the services accept.** WebM and MP4 containers are accepted directly by OpenAI, Groq and Deepgram. Gladia lists MP4 and Opus but not WebM. whisper.cpp wants 16 kHz 16-bit WAV unless ffmpeg converts; faster-whisper decodes through PyAV.

**Size arithmetic** (derived):

- A screen video at the 2.5 Mbps default is about 19 MB per minute, so it passes OpenAI's and Groq's 25 MB limit for roughly 80 seconds only. Deepgram's own guidance: "For large video files, extract the audio stream first."
- An audio-only Opus recording at 32 kbps is about 0.24 MB per minute: 25 MB holds about 100 minutes.
- Uncompressed 16 kHz mono 16-bit WAV is 1.92 MB per minute: 25 MB holds about 13 minutes.

**Getting an audio-only file without server-side ffmpeg.**

- **Record the microphone as its own track.** `getDisplayMedia()` does not provide the microphone; its `audio` option concerns tab or system audio and is supported only in Chrome desktop (tab audio on macOS and Linux, system audio on Windows and ChromeOS), not Firefox, not Safari ([BCD `MediaDevices.json`](https://github.com/mdn/browser-compat-data/blob/main/api/MediaDevices.json)). The voice comes from `getUserMedia({ audio: true })`, a separate permission. A second `MediaRecorder` on that audio-only stream yields a small `audio/webm` (or `audio/mp4`) file that every service above accepts, with no extraction step anywhere. This also works when the capture technique is DOM replay and no video exists at all.
- **Demux in the browser.** [Mediabunny](https://www.npmjs.com/package/mediabunny) (MPL-2.0, "pure TypeScript media toolkit for reading, writing, and converting media files, directly in the browser") can pull an audio track out of a recorded file. `@ffmpeg/core` does the same at 64.7 MB unpacked. Both add weight to a Widget whose bundle size is meant to be tracked.
- **Decode to PCM in the browser** with Web Audio (`decodeAudioData`, then resample to 16 kHz) is what a client-side model needs anyway, and produces the WAV that whisper.cpp takes natively. Not verified against a spec page in this pass.
- **Let the sidecar decode.** Self-hosted engines carry their own FFmpeg (whisper.cpp image, PyAV), so a video file can be posted as is; only the 25 MB class of vendor limits forces extraction.

Two separate recorders start at slightly different instants, so the audio offset relative to the Recording timeline has to be captured at start for timestamps to line up.

## 5. Output

**Timestamps.**

- Whisper-family output is segment-level by default and word-level on request: `timestamp_granularities[]` with `word` and `segment` on OpenAI `whisper-1` and Groq, `word_timestamps=True` in faster-whisper, `verbose_json` in `whisper-server`. whisper.cpp labels word-level timestamps "experimental" in its README.
- Deepgram returns a `words` array with `start` and `end` in seconds "from the beginning of the audio stream". Voxtral Mini Transcribe V2 returns "precise start and end timestamps for each word".
- OpenAI `gpt-transcribe` documents no timestamps.
- Web Speech API: none implemented, see section 1.
- Segment-level timing is enough to place a sentence on a timeline; word-level is what lets an agent tie "this button" to the instant of a click in the Diagnostic Trail.

**Language detection.** Whisper detects the language from the audio (faster-whisper exposes `info.language` and `info.language_probability`; `whisper-server` includes language probabilities in `verbose_json`; OpenAI `gpt-transcribe` returns `languages`). Deepgram defaults to English unless told otherwise. Web Speech requires the language up front. The Widget already knows the page and browser locale, which can be passed as a hint.

**Quality, English and French** (Whisper paper, appendix tables, WER in percent; the only primary source found that breaks results out by model size and by accented English):

| Model    | Fleurs English | Fleurs French | VoxPopuli English | VoxPopuli accented English |
| -------- | -------------- | ------------- | ----------------- | -------------------------- |
| tiny     | 12.4           | 41.4          | 11.6              | 18.8                       |
| base     | 8.9            | 28.5          | 9.5               | 17.5                       |
| small    | 6.1            | 15.0          | 8.2               | 19.2                       |
| medium   | 4.4            | 8.7           | 7.6               | 19.1                       |
| large-v2 | 4.2            | 8.3           | 7.0               | 18.6                       |

Source: [Radford et al., 2022, tables 12 and 13](https://arxiv.org/abs/2212.04356), read through the [ar5iv rendering](https://ar5iv.labs.arxiv.org/html/2212.04356).

- **French degrades fast with model size**: 8.3% at large-v2, 15.0% at `small`, 28.5% at `base`. The sizes that fit a browser download or a small server are the ones that are weak on French.
- **Accented English is 2.5 times worse than native English at every size** on VoxPopuli (about 18 to 19% against 7 to 12%), and a bigger model does not close the gap. A Reviewer speaking English as a second language is the hard case for all Whisper sizes.
- These numbers are for read or parliamentary speech from 2022 models. No vendor page read in this pass publishes non-native English or French error rates for current models. Groq quotes 10.3% and 12% WER for `whisper-large-v3` and `whisper-large-v3-turbo` without naming the dataset; Mistral claims "approximately 4% word error rate on FLEURS" for Voxtral Mini Transcribe V2.
- **Failure modes** named by the Whisper paper: "complete hallucination where the model will output a transcript entirely unrelated to the actual audio", "getting stuck in repeat loops", and dropped first or last words. A Recording where the Reviewer mostly stays silent is exposed to this. faster-whisper integrates Silero VAD "to filter out parts of the audio without speech", and whisper.cpp has a `--vad` flag.

## 6. Cost per recorded minute

| Option                                            | Cost per recorded minute           | Who pays                        |
| ------------------------------------------------- | ---------------------------------- | ------------------------------- |
| Web Speech API                                    | 0                                  | Nobody (browser vendor)         |
| Client-side Whisper                               | 0                                  | Reviewer's device and bandwidth |
| Cloudflare Workers AI `whisper-large-v3-turbo`    | 0.0005                             | Faster Fixes                    |
| Groq `whisper-large-v3-turbo`                     | 0.00067 (10 s minimum per request) | Faster Fixes                    |
| Groq `whisper-large-v3`                           | 0.00185                            | Faster Fixes                    |
| AssemblyAI Universal-2                            | 0.0025                             | Faster Fixes                    |
| Gladia Solaria-3                                  | EUR 0.0027                         | Faster Fixes                    |
| Mistral Voxtral Mini Transcribe V2                | 0.003                              | Faster Fixes                    |
| Google dynamic batch, Azure batch                 | 0.003                              | Faster Fixes                    |
| AssemblyAI Universal-3.5 Pro                      | 0.0035                             | Faster Fixes                    |
| ElevenLabs Scribe v2                              | 0.0037                             | Faster Fixes                    |
| Deepgram Nova-3                                   | 0.0043 to 0.0052                   | Faster Fixes                    |
| OpenAI `gpt-transcribe`                           | 0.0045                             | Faster Fixes                    |
| OpenAI `whisper-1`, Amazon Transcribe, Azure fast | 0.006                              | Faster Fixes                    |
| Google standard, Azure real-time                  | 0.016 to 0.0167                    | Faster Fixes                    |
| Self-hosted sidecar                               | 0 marginal                         | The instance: RAM and CPU       |

Scale check (derived): 1,000 recorded minutes in a month, which is 500 two-minute Recordings, cost between 0.50 and 6.00 at the vendors most likely to be used. `PLAN_PRICES` in `subscription-plans.ts` lists 20 for pro and 99 for agency.

## 7. What the decision needs

Facts that bear on whether and where a transcript is produced, and on Plan gating:

1. **Vendor cost is small against Plan prices.** At 0.0005 to 0.006 per minute, cost alone does not force a transcript onto the top Plan. A per-Recording duration cap bounds the worst case in any option.
2. **The only zero-cost server-free option, Web Speech, is the least dependable.** No timestamps, live only, cloud audio by default in Chrome and Safari, on-device mode limited to Chrome 139+ and Firefox 160+ on desktop. It conflicts least with cost and most with usability by the agent.
3. **Client-side Whisper shifts cost to the Reviewer**: a 41 to 250 MB download and single-threaded inference inside a customer page. The standing preference puts Reviewer effort first. The same model run in the inbox instead puts that cost on the team's device, on a page whose headers Faster Fixes controls.
4. **A separate audio-only microphone track removes the ffmpeg question** for every server-side option and keeps uploads well under the 25 MB limits. It also means voice is its own Asset, with its own consent and its own failure mode.
5. **Word timestamps are available everywhere except Web Speech and OpenAI's current model.** If timeline alignment matters for the agent, OpenAI is the awkward choice until it documents a successor to `whisper-1` timestamps.
6. **Self-hosted can have a transcript without a third party**, through an optional sidecar running `small` or `base`, at a quality cost on French. A shared Whisper-shaped client (base URL plus key) would let cloud use a vendor and self-hosted use the sidecar or the operator's own vendor key.
7. **Retention and region differ sharply by vendor.** Voice is personal data from a Reviewer who has no account. Deepgram and Gladia retain or train by default unless opted out; Groq stores in the United States; Mistral is EU by default; OpenAI's EU endpoint needs approval.
8. **Quality on the real audience is the weakest evidence.** French and non-native English are where small models and published benchmarks are thinnest. A short test on real Reviewer-like audio would settle more than any page read here.

## Not verified from a primary source

- Which service Chrome's and Safari's default (cloud) Web Speech recognition sends audio to, and any quota on it. MDN and the spec say only "a web service" and "a remote server".
- Whether French is among Firefox 160's 40 on-device languages, the size of Chrome's and Firefox's language packs, and the accuracy of on-device recognition.
- Any implementation of `speechStartTime` and `speechEndTime`.
- Real-time factors for Whisper on WebGPU, and for any model on a 2 to 4 vCPU server. The only CPU benchmark found is a 12-core desktop CPU.
- The Chrome version that shipped MP4 in `MediaRecorder` (secondary sources say 126), and Firefox's supported `MediaRecorder` containers.
- Whether OpenAI `gpt-transcribe` can return timestamps through an undocumented format. The guide and reference document none.
- Timestamps, input limits and retention for AssemblyAI, ElevenLabs, Cloudflare Workers AI, Google, AWS and Azure, and word timestamps for Gladia: only their prices were read.
- Mistral's accepted formats, file size limit and API retention period; Gladia's hosting region.
- Deepgram's EU endpoint details come from a search summary of its reference pages, not from a page read in full. A Deepgram blog post shows the host as `eu.api.deepgram.com`; the reference uses `api.eu.deepgram.com`.
- The Azure page itself renders prices client-side; figures come from Microsoft's retail prices API for `westeurope`. The Google figures were extracted from the pricing page's embedded data.
- Memory and speed of `large-v3-turbo` in whisper.cpp or faster-whisper on CPU.
- Non-native English and French accuracy of any current commercial model.
- Transferred size of the Transformers.js runtime, and how a strict Content Security Policy on a customer's site treats WASM and model downloads.
- The currency of `PLAN_PRICES`.
