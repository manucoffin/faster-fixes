# Filmed Recording costs: store, serve, transcribe

Research for [#495](https://github.com/manucoffin/faster-fixes/issues/495), part of the map [Filmed Recording](https://github.com/manucoffin/faster-fixes/issues/490).

**Question**: what does one minute of filmed Recording cost Faster Fixes for each candidate technique, and what does that imply for sustainable Plan limits?

**Checked on**: 2026-11-25. Every price below was read from the linked vendor page on that date, USD, list price, pay as you go. Anything not read on a primary page is marked UNVERIFIED. Sizes are decimal (1 MB = 1,000,000 bytes, 1 GB = 1,000 MB), as in `subscription-plans.ts`.

This document reports costs and constraints. It does not pick the technique, the vendor or the limits.

Related notes on other branches: `research/quota-cost-model` (`docs/research/video-quota-cost-model.md`, R2 cost model for Videos) and `research/transcription-options` (`docs/research/transcription-options.md`, where a transcript can be produced, retention and EU terms per vendor).

## Short answer

| Per recorded minute                  | Screen film (5 to 20 MB/min) | rrweb replay + voice (0.3 to 2 MB/min) |
| ------------------------------------ | ---------------------------- | -------------------------------------- |
| R2 storage, kept 12 months           | USD 0.0009 to 0.0036         | USD 0.000054 to 0.00036                |
| One transcription                    | USD 0.0005 to 0.006          | USD 0.0005 to 0.006                    |
| Upload and playback operations       | under USD 0.00001            | under USD 0.00001                      |
| Egress                               | 0                            | 0                                      |
| Total, first year                    | USD 0.0014 to 0.0096         | USD 0.00057 to 0.0064                  |

- A recorded minute costs between a twentieth of a cent and one cent, whatever the technique.
- For the rrweb replay, transcription is the dominant cost at every vendor price (at least 59% of the total, up to 99%).
- For the screen film, it depends on the vendor: with a Whisper-class model at USD 0.0005 storage dominates (64% to 88%); with a USD 0.0043 to 0.006 vendor transcription dominates or ties (54% to 87%).
- Transcription is paid once. Storage recurs for as long as the file is kept, so without a retention rule the film's storage line grows every month and ends up dominating.
- At the candidate limits used in the ticket brief, a fully used Plan costs at most USD 0.05 (free), USD 2.40 (pro, 12% of USD 20) and USD 19.20 (agency, 19% of USD 99) per month for a film with the most expensive transcription, and USD 0.003, USD 0.14 (0.7%) and USD 1.13 (1.1%) for an rrweb replay with the cheapest.
- Large files can go from a customer's origin straight to R2 with presigned URLs. The bucket CORS policy must allow the customer origins (in practice `*`) and expose `ETag`; the existing `/api/upload` route cannot be reused as is because it authenticates a session.

## Price inputs

### Cloudflare R2

From https://developers.cloudflare.com/r2/pricing/ (Standard storage).

| Item                                                                                                   | Price                    | Free tier per month |
| ------------------------------------------------------------------------------------------------------ | ------------------------ | ------------------- |
| Storage                                                                                                | USD 0.015 per GB-month   | 10 GB-month         |
| Class A (PutObject, CreateMultipartUpload, UploadPart, CompleteMultipartUpload, ListParts)             | USD 4.50 per million     | 1 million           |
| Class B (GetObject, HeadObject)                                                                        | USD 0.36 per million     | 10 million          |
| AbortMultipartUpload, DeleteObject                                                                     | free                     | n/a                 |
| Egress to the Internet                                                                                 | free                     | n/a                 |

- 1 GB kept one year: 12 x 0.015 = **USD 0.18**.
- Billing rounds up to the next unit at the account level ("1.1 GB-month bills as 2 GB-month"), so the arithmetic below is the marginal cost inside a larger bill.
- Infrequent Access (USD 0.01 per GB-month, USD 0.01 per GB retrieved, 30-day minimum, no free tier, Class A USD 9.00 and Class B USD 0.90 per million) saves a third on storage. On the worst film case below that is USD 2.40 per month for a full agency Organization.
- The free tier is shared with everything already in the bucket (Videos, screenshots), so it is ignored below.

### Speech to text

Price per audio minute, batch (pre-recorded) API. "Words" means per-word start and end times in the response.

| Vendor and model                                | Price per minute                      | Languages                                             | Word timestamps                                            | Source                                                                                                                              |
| ----------------------------------------------- | ------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare Workers AI `whisper`                 | 0.000453 (41.14 neurons)              | Not listed on the model page                          | `words` array in the output; its fields were not readable  | https://developers.cloudflare.com/workers-ai/platform/pricing/ and https://developers.cloudflare.com/workers-ai/models/whisper/      |
| Cloudflare Workers AI `whisper-large-v3-turbo`  | 0.000513 (46.63 neurons)              | Not listed; optional `language` parameter             | UNVERIFIED: output documents `segments[]` and `vtt` only   | https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/                                                         |
| Cloudflare Workers AI `@cf/deepgram/nova-3`     | 0.0052                                | As Deepgram (not re-read)                             | As Deepgram (not re-read)                                  | https://developers.cloudflare.com/workers-ai/platform/pricing/                                                                      |
| Groq `whisper-large-v3-turbo`                   | 0.000667 (0.04 per hour)              | Multilingual                                          | Yes (`timestamp_granularities[]`: `word`, `segment`)       | https://console.groq.com/docs/speech-to-text                                                                                        |
| Groq `whisper-large-v3`                         | 0.00185 (0.111 per hour)              | Multilingual                                          | Yes                                                        | Same                                                                                                                                |
| AssemblyAI Universal-2                          | 0.0025 (0.15 per hour)                | 99                                                    | Yes (`words` with `start`, `end`, `confidence`)            | https://www.assemblyai.com/pricing and https://www.assemblyai.com/docs/api-reference/transcripts/get                                |
| AssemblyAI AssemblyAI-STT-3.7                   | 0.0035 (0.21 per hour)                | 32                                                    | Yes (same response shape)                                  | Same, and https://www.assemblyai.com/docs/getting-started/models                                                                    |
| OpenAI `gpt-4o-mini-transcribe`                 | 0.003 (estimate, token priced)        | Not stated on the pages read                          | No (`timestamp_granularities[]` is `whisper-1` only)       | https://developers.openai.com/api/docs/pricing and https://developers.openai.com/api/docs/guides/speech-to-text                     |
| ElevenLabs Scribe v2 / v3 (batch)               | 0.00333 (0.20 per hour)               | 90+                                                   | Yes ("precise word-level timestamps")                      | https://elevenlabs.io/pricing/api and https://elevenlabs.io/docs/overview/capabilities/speech-to-text                               |
| Mistral Voxtral Mini Transcribe 3               | 0.0035                                | Not read                                              | Segment timestamps documented; word level UNVERIFIED       | https://docs.mistral.ai/inference/pricing and https://docs.mistral.ai/en/studio-api/audio/overview                                  |
| Deepgram Nova-3 monolingual                     | 0.0043 (Growth plan 0.0036)           | 55 listed in the multilingual group                   | Yes (`words` with `start`, `end`, `confidence`)            | https://deepgram.com/pricing, https://developers.deepgram.com/docs/pre-recorded-audio                                               |
| Deepgram Nova-3 multilingual                    | 0.0052 (Growth plan 0.0043)           | Same                                                  | Yes                                                        | Same                                                                                                                                |
| OpenAI `gpt-transcribe`                         | 0.0045                                | Not stated; returns detected `languages`              | No                                                         | OpenAI pages above                                                                                                                  |
| OpenAI `gpt-4o-transcribe`                      | 0.006 (estimate, token priced)        | Not stated                                            | No                                                         | Same                                                                                                                                |
| OpenAI `whisper-1` (deprecated)                 | 0.006                                 | 98, "accuracy varies by language"                     | Yes, until shutdown on 2027-02-26                          | Same                                                                                                                                |

Notes read on the same pages:

- Workers AI bills USD 0.011 per 1,000 neurons with 10,000 free neurons per day: 46.63 x 0.011 / 1,000 = USD 0.000513 per minute, and 10,000 / 46.63 = 214 free minutes of `whisper-large-v3-turbo` per day. The pricing table rounds both Whisper models to USD 0.0005.
- Input limits: OpenAI 25 MB per file; Groq 25 MB (free tier) or 100 MB (dev tier), 10 seconds minimum billed per request; Deepgram 2 GB; ElevenLabs 5 GB and 15 hours. Workers AI states no limit on the model pages (UNVERIFIED).
- Free credit: Deepgram USD 200, AssemblyAI USD 50.
- Groq's marketing pricing page could not be read; its prices come from the docs page.
- Google, AWS and Azure were not re-read; the earlier note puts hyperscaler pricing at the top of the range.

The three reference prices used below span the market:

| Reference | Price per minute | Stands for                                                        |
| --------- | ---------------- | ----------------------------------------------------------------- |
| Low       | USD 0.000513     | Whisper large v3 turbo on Workers AI (Groq is 0.000667)           |
| Mid       | USD 0.0043       | Deepgram Nova-3 monolingual (AssemblyAI, ElevenLabs, Mistral are 0.0025 to 0.0035) |
| High      | USD 0.006        | OpenAI `gpt-4o-transcribe` or `whisper-1`                         |

### Vercel request body

From https://vercel.com/docs/functions/limitations (last updated 2026-08-24): "Vercel Functions accept request bodies up to **4.5 MB** by default". Bodies up to 20 MiB are in Public Beta for the Node.js, Python and Bun runtimes, and need Fluid compute, the Performance (4 GB) function memory of the Pro and Enterprise plans, and `VERCEL_SUPPORT_LARGE_REQUEST_BODY=1`. Over the limit: `413 FUNCTION_PAYLOAD_TOO_LARGE`. Vercel's own guide (https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions) recommends sending "large files directly to a media host from your browser without needing a Vercel Function as a proxy".

## Cost per recorded minute

Storage for 12 months = size in GB x 0.18. Transcription = one pass at the reference price.

| Technique and size      | GB per minute | Storage, 12 months        | Transcription low | Transcription mid | Transcription high | Total low | Total mid | Total high |
| ----------------------- | ------------- | ------------------------- | ----------------- | ----------------- | ------------------ | --------- | --------- | ---------- |
| Film, 5 MB/min          | 0.005         | 0.005 x 0.18 = 0.0009     | 0.000513          | 0.0043            | 0.006              | 0.001413  | 0.0052    | 0.0069     |
| Film, 20 MB/min         | 0.02          | 0.02 x 0.18 = 0.0036      | 0.000513          | 0.0043            | 0.006              | 0.004113  | 0.0079    | 0.0096     |
| rrweb + voice, 0.3 MB   | 0.0003        | 0.0003 x 0.18 = 0.000054  | 0.000513          | 0.0043            | 0.006              | 0.000567  | 0.004354  | 0.006054   |
| rrweb + voice, 2 MB     | 0.002         | 0.002 x 0.18 = 0.00036    | 0.000513          | 0.0043            | 0.006              | 0.000873  | 0.00466   | 0.00636    |

Which cost dominates:

- rrweb + voice: transcription, always. Its smallest share is 0.000513 / 0.000873 = 59% (largest file, cheapest vendor); its largest is 0.006 / 0.006054 = 99%.
- Film: storage with a cheap Whisper (0.0009 / 0.001413 = 64% at 5 MB, 0.0036 / 0.004113 = 88% at 20 MB); transcription with the mid and high vendors (0.0043 / 0.0079 = 54% at 20 MB, 0.006 / 0.0069 = 87% at 5 MB).
- With the low vendor the film costs 1.6x (0.001413 / 0.000873) to 7.3x (0.004113 / 0.000567) what the replay costs; with the high vendor only 1.1x (0.0069 / 0.00636) to 1.6x (0.0096 / 0.006054), because the transcription is the same in both.

Each further year of retention adds the storage column again. Transcription does not recur.

### Operations and egress

- Upload: a multipart upload is 1 CreateMultipartUpload + 1 UploadPart per part + 1 CompleteMultipartUpload, all Class A. A 10 minute film at 20 MB/min is 200 MB; at the 16 MiB part size of `VIDEO_PART_SIZE` that is ceil(200,000,000 / 16,777,216) = 12 parts, 14 Class A, 14 x 4.50 / 1,000,000 = USD 0.000063 for the whole file, USD 0.0000063 per minute. A single PUT is 1 Class A, USD 0.0000045.
- Playback: each range request or GET is one Class B at USD 0.00000036. A hundred requests per viewing is USD 0.000036. The number of range requests per viewing is UNVERIFIED (browser behaviour).
- Egress is free on R2, so serving the file to the inbox and to agents costs only Class B operations.
- Operations are under 1% of the per-minute total in every row above.

## Worked examples against Plan prices

Candidate limits from the ticket brief, used in full every month:

| Plan   | Recordings x length | Minutes per month | Film bytes per month (5 to 20 MB/min) | rrweb bytes per month (0.3 to 2 MB/min) |
| ------ | ------------------- | ----------------- | ------------------------------------- | --------------------------------------- |
| Free   | 5 x 1 min           | 5                 | 0.025 to 0.1 GB                       | 0.0015 to 0.01 GB                       |
| Pro    | 50 x 5 min          | 250               | 1.25 to 5 GB                          | 0.075 to 0.5 GB                         |
| Agency | 200 x 10 min        | 2,000             | 10 to 40 GB                           | 0.6 to 4 GB                             |

Transcription per month = minutes x price:

| Plan   | Low (0.000513)             | Mid (0.0043)             | High (0.006)            |
| ------ | -------------------------- | ------------------------ | ----------------------- |
| Free   | 5 x 0.000513 = 0.0026      | 5 x 0.0043 = 0.0215      | 5 x 0.006 = 0.03        |
| Pro    | 250 x 0.000513 = 0.128     | 250 x 0.0043 = 1.075     | 250 x 0.006 = 1.50      |
| Agency | 2,000 x 0.000513 = 1.026   | 2,000 x 0.0043 = 8.60    | 2,000 x 0.006 = 12.00   |

Storage per month, steady state with a 12-month retention: the stock is 12 months of uploads, so the monthly bill is monthly GB x 12 x 0.015 = monthly GB x 0.18. This is also what one month of recordings costs to keep for a year.

| Plan   | Film 5 MB/min          | Film 20 MB/min       | rrweb 0.3 MB/min           | rrweb 2 MB/min        |
| ------ | ---------------------- | -------------------- | -------------------------- | --------------------- |
| Free   | 0.025 x 0.18 = 0.0045  | 0.1 x 0.18 = 0.018   | 0.0015 x 0.18 = 0.00027    | 0.01 x 0.18 = 0.0018  |
| Pro    | 1.25 x 0.18 = 0.225    | 5 x 0.18 = 0.90      | 0.075 x 0.18 = 0.0135      | 0.5 x 0.18 = 0.09     |
| Agency | 10 x 0.18 = 1.80       | 40 x 0.18 = 7.20     | 0.6 x 0.18 = 0.108         | 4 x 0.18 = 0.72       |

Monthly total per Organization (storage + transcription) and share of the Plan price:

| Plan (price)   | Film best (5 MB, low)        | Film mid (20 MB, mid)          | Film worst (20 MB, high)        | rrweb best (0.3 MB, low)       | rrweb worst (2 MB, high)        |
| -------------- | ---------------------------- | ------------------------------ | ------------------------------- | ------------------------------ | ------------------------------- |
| Free (USD 0)   | 0.0045 + 0.0026 = 0.0071     | 0.018 + 0.0215 = 0.0395        | 0.018 + 0.03 = 0.048            | 0.00027 + 0.0026 = 0.0029      | 0.0018 + 0.03 = 0.0318          |
| Pro (USD 20)   | 0.225 + 0.128 = 0.353 (1.8%) | 0.90 + 1.075 = 1.975 (9.9%)    | 0.90 + 1.50 = 2.40 (12.0%)      | 0.0135 + 0.128 = 0.142 (0.7%)  | 0.09 + 1.50 = 1.59 (8.0%)       |
| Agency (USD 99)| 1.80 + 1.026 = 2.83 (2.9%)   | 7.20 + 8.60 = 15.80 (16.0%)    | 7.20 + 12.00 = 19.20 (19.4%)    | 0.108 + 1.026 = 1.13 (1.1%)    | 0.72 + 12.00 = 12.72 (12.8%)    |

Reading the table:

- These are ceilings: every Organization uses its full allowance every month. Real usage is some fraction of it, and that fraction is unknown.
- Free has no revenue, so its cost is a pure subsidy: 1,000 free Organizations at full use cost USD 2.90 to USD 48 per month.
- The vendor choice moves the bill more than the technique does. On agency, going from the high to the low transcription price saves 12.00 - 1.026 = USD 10.97; going from a 20 MB film to a 2 MB replay saves 7.20 - 0.72 = USD 6.48.
- Without retention the storage line keeps growing by monthly GB x 0.015 each month. Agency film at 20 MB/min adds 40 x 0.015 = USD 0.60 per month, every month: USD 7.20 at month 12, USD 14.40 at month 24, USD 21.60 at month 36 (22% of USD 99 for storage alone).
- The film stock is large next to today's Video budgets (`videoStorage`: 0.5 GB free, 20 GB pro, 100 GB agency). A year of full use at 20 MB/min is 12 x 5 = 60 GB on pro and 12 x 40 = 480 GB on agency. The replay at 2 MB/min is 6 GB and 48 GB.

### Sizing a transcription allowance

An allowance of N minutes per month costs at most N x price:

| Allowance per month | Low (0.000513) | Mid (0.0043) | High (0.006) |
| ------------------- | -------------- | ------------ | ------------ |
| 10 min              | 0.005          | 0.043        | 0.06         |
| 60 min              | 0.031          | 0.258        | 0.36         |
| 250 min             | 0.128          | 1.075        | 1.50         |
| 1,000 min           | 0.513          | 4.30         | 6.00         |
| 2,000 min           | 1.026          | 8.60         | 12.00        |

Read the other way, USD 1 buys 1 / 0.000513 = 1,949 minutes at the low price, 233 at the mid price and 167 at the high price. Keeping transcription under 5% of the Plan price allows USD 1.00 on pro (1,949, 233 or 167 minutes) and USD 4.95 on agency (9,649, 1,151 or 825 minutes).

What to send to the vendor: the voice track alone. Opus at 32 kbps is 32,000 / 8 x 60 = 240,000 bytes, 0.24 MB per minute, so OpenAI's and Groq's 25 MB limit holds about 100 minutes of audio, against 1 to 5 minutes of a 5 to 20 MB/min film. The rrweb technique has the voice as a separate file by construction; a film needs its audio extracted, recorded as a second track, or sent to a vendor that takes large files (Deepgram 2 GB, ElevenLabs 5 GB). Vendor prices are per audio minute, so the file size does not change the price.

## Uploading from the Widget straight to R2

### What exists

`apps/web/src/app/api/upload/route.ts` serves the `video` route through better-upload: the browser POSTs a small JSON body to the app, the app answers with presigned URLs, the browser PUTs each 16 MiB part to R2 and POSTs the completion. No file byte crosses Vercel, so the 4.5 MB limit only applies to the JSON. Three things tie it to the app's own origin:

- `onBeforeUpload` calls `auth.api.getSession`. A Reviewer on a customer's site has no session; the Widget API authenticates with `X-API-Key` and `X-Reviewer-Token` and validates the origin against the Project URL (`apps/web/src/server/cors/index.ts`).
- The documented bucket CORS rule (`apps/web/src/content/docs/self-hosting.mdx`) allows one origin, the app URL.
- The local storage provider "signs single PUTs only" (comment in the route), so multipart is off for self-hosted instances on local disk.

### What R2 allows

- Presigned URLs support `GET`, `HEAD`, `PUT` and `DELETE`, expire after 1 second to 7 days, and work only on the S3 API domain, not on a custom domain. Presigned `POST` (HTML form upload with a policy) is not supported. https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- "While presigned URLs handle authentication, you still need to configure CORS when making requests from a browser." `AllowedOrigins` accepts `*` or a pattern with at most one `*` (for example `https://*.example.com`). `ExposeHeaders` is what lets JavaScript read `ETag`. Rule changes can take up to 30 seconds to propagate. An expired presigned URL answers 403 without CORS headers, so the browser reports a CORS failure rather than an expiry. https://developers.cloudflare.com/r2/buckets/cors/
- Multipart: every part except the last is at least 5 MiB and all parts except the last have the same size; at most 10,000 parts; 5 GiB per part or single PUT. Incomplete uploads are aborted after 7 days by a default lifecycle rule, and lifecycle rules can also expire objects by prefix after N days. https://developers.cloudflare.com/r2/objects/multipart-objects/, https://developers.cloudflare.com/r2/platform/limits/, https://developers.cloudflare.com/r2/buckets/object-lifecycles/
- The maximum number of CORS rules or origins per bucket is not on the pages read (UNVERIFIED), so one rule per customer origin is not something to rely on.

### What follows for the Widget

1. **A presign endpoint on the Widget API.** Same shape as today, different guard: authenticate with the Project key and Reviewer token, check the origin and the Plan limit, then return the presigned URL or URLs. Its bodies are small JSON, well under 4.5 MB.
2. **Bucket CORS open to customer origins.** Customer origins are not known to the bucket, so the rule is `AllowedOrigins: ["*"]`, `AllowedMethods: ["PUT", "POST"]` for the upload (plus `GET`, `HEAD` if the inbox reads from the same bucket), `ExposeHeaders: ["ETag"]`. With a wildcard origin the presigned URL is the only protection: it is bound to one key and one expiry, and the content type can be bound into the signature. A separate bucket or prefix for filmed Recordings would keep the wildcard away from Videos.
3. **Size is not enforced by a presigned PUT.** The presigned URL page documents no size condition and presigned POST policies are unsupported, so the declared size is checked before signing and the real size after upload (`head` in `apps/web/src/server/storage/s3.ts`), with a delete on mismatch. Whether signing `Content-Length` is honoured by R2 is UNVERIFIED.
4. **Single PUT or multipart, by size.**
   - rrweb + voice: 10 minutes is 3 to 20 MB. One presigned PUT per file (events, audio) is enough, up to 5 GiB; a failed upload restarts from zero.
   - Film: 10 minutes is 50 to 200 MB. Multipart gives a retry per part and a resume after a network cut; at 16 MiB parts a 200 MB file is 12 parts.
   - Parts can be uploaded while recording: a 5 MiB part (5.24 MB) fills every 63 seconds at 5 MB/min and every 16 seconds at 20 MB/min. The recorder's chunks must be regrouped to equal part sizes first.
5. **The client code is small.** better-upload's client PUTs each part with XHR, reads `ETag` from the response (it throws if CORS does not expose it), then POSTs a `<CompleteMultipartUpload>` XML manifest to a presigned completion URL (https://github.com/Nic13Gamer/better-upload/blob/main/packages/client/src/utils/internal/s3-upload.ts). Whether `@better-upload/client` can run inside the framework-free Widget bundle was not checked (UNVERIFIED); the flow is reproducible in plain XHR.
6. **Alternatives, for the record.** Vercel's 20 MiB body beta covers the rrweb case only, needs the 4 GB function memory tier and bills function time for every byte. Sending 4 MB chunks through the app (today's automatic Recording path, capped at 4 MiB) works for a few MB and not for a 200 MB film. A Cloudflare Worker in front of the bucket would allow per-origin checks at the edge; its limits and price were not read (UNVERIFIED).

## What was not verified

- Typical bytes per minute of each technique: the 5 to 20 MB and 0.3 to 2 MB ranges are the ticket's assumptions, not measurements.
- Real usage as a share of the allowance.
- Word-level timestamps on Workers AI `whisper-large-v3-turbo` and Mistral Voxtral Mini Transcribe 3; language lists for Workers AI, Mistral and OpenAI's current models.
- Whether in-progress multipart parts are billed as storage before completion or abort.
- R2 limits on CORS rule count, and whether R2 enforces a signed `Content-Length`.
- Accuracy per vendor, retention and EU terms: see `docs/research/transcription-options.md` on `research/transcription-options`.

## Sources

- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare R2 CORS: https://developers.cloudflare.com/r2/buckets/cors/
- Cloudflare R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Cloudflare R2 multipart objects: https://developers.cloudflare.com/r2/objects/multipart-objects/
- Cloudflare R2 limits: https://developers.cloudflare.com/r2/platform/limits/
- Cloudflare R2 object lifecycles: https://developers.cloudflare.com/r2/buckets/object-lifecycles/
- Cloudflare Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Cloudflare Workers AI Whisper models: https://developers.cloudflare.com/workers-ai/models/whisper/, https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/
- OpenAI pricing and speech-to-text guide: https://developers.openai.com/api/docs/pricing, https://developers.openai.com/api/docs/guides/speech-to-text
- Deepgram pricing, models and pre-recorded audio: https://deepgram.com/pricing, https://developers.deepgram.com/docs/models-languages-overview, https://developers.deepgram.com/docs/pre-recorded-audio
- AssemblyAI pricing, models and transcript reference: https://www.assemblyai.com/pricing, https://www.assemblyai.com/docs/getting-started/models, https://www.assemblyai.com/docs/api-reference/transcripts/get
- Groq speech to text: https://console.groq.com/docs/speech-to-text
- ElevenLabs API pricing and speech to text: https://elevenlabs.io/pricing/api, https://elevenlabs.io/docs/overview/capabilities/speech-to-text
- Mistral pricing and audio overview: https://docs.mistral.ai/inference/pricing, https://docs.mistral.ai/en/studio-api/audio/overview
- Vercel Functions limits and body size guide: https://vercel.com/docs/functions/limitations, https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions
- better-upload client multipart flow: https://github.com/Nic13Gamer/better-upload/blob/main/packages/client/src/utils/internal/s3-upload.ts
- Local: `apps/web/src/app/api/upload/route.ts`, `apps/web/src/server/storage/s3.ts`, `apps/web/src/server/cors/index.ts`, `apps/web/src/app/_domains/subscription/_helpers/subscription-plans.ts`, `apps/web/src/content/docs/self-hosting.mdx`
