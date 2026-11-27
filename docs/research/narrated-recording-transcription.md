# Which transcription vendors fit a narrated Recording, at what cost and delay

> Research for [#507](https://github.com/manucoffin/faster-fixes/issues/507), part of the map [#490 Narrated Recording](https://github.com/manucoffin/faster-fixes/issues/490). Pages read on 2026-11-27. Prices are USD, list, pay as you go, batch (pre-recorded) transcription.

This note reports facts and ends with a recommendation. It does not decide for the team.

It builds on three earlier notes and does not repeat them:

- `docs/research/transcription-options.md` (branch `research/transcription-options`, 2026-11-10): where a transcript can be produced, browser options, Whisper error rates by model size. Its vendor table is superseded by this note: several models it names are now deprecated.
- `docs/research/filmed-recording-costs.md` (branch `research/filmed-recording-costs`, [#495](https://github.com/manucoffin/faster-fixes/issues/495)): price per minute against Plan prices. Prices re-read here; changes are flagged.
- `docs/research/narrated-recording-weight.md` (branch `research/narrated-recording-weight`, [#502](https://github.com/manucoffin/faster-fixes/issues/502)): the voice is 222 to 265 KB per minute at 32 kbit/s mono, as Opus in WebM (Chromium), Opus in Ogg (Firefox) or AAC in MP4 (WebKit). A five-minute voice track is about 1.2 MB.

**How the sources were read.** Every claim links the vendor page that owns it. Pages marked _raw_ were read as the page's own Markdown or JSON. All other pages were read through a fetch tool that returns extracts, so their quotes are short fragments: re-read any clause on the live page before it goes into a contract, the privacy policy or an ADR. Anything not found on a primary page is marked **UNVERIFIED** and listed again at the end. Nothing was measured: no vendor was called with a real file.

## The requirements each vendor is checked against

From the resolution of [#499](https://github.com/manucoffin/faster-fixes/issues/499): "no training on the data, deletion at the vendor once processing ends or at the shortest delay offered, and the vendor listed as a sub-processor". The ticket adds the processing region. So, per vendor:

1. **Sub-processor terms**: a DPA Faster Fixes can enter, and a public list of the vendor's own sub-processors.
2. **Retention**: what is kept of the audio and the transcript, and whether none is available.
3. **Training**: whether customer audio trains models, by default and after opt-out.
4. **Region**: where the audio is processed, and whether an EU option exists.

From the Plan limits of [#498](https://github.com/manucoffin/faster-fixes/issues/498): a narrated Recording lasts at most 1, 3 or 5 minutes (free, pro, agency), and a fully used Plan is 5 minutes in total (free), 50 x 3 = 150 minutes a month (pro) and 200 x 5 = 1,000 minutes a month (agency).

## Summary

- **What changed since the earlier notes.** OpenAI now shuts down `whisper-1`, `gpt-4o-transcribe` and `gpt-4o-mini-transcribe` on 2027-02-26; the only model that stays, `gpt-transcribe`, documents no timestamps. Mistral's model with word timestamps is deprecated; its successor is a Public Preview with segment timestamps only, outside Mistral's training opt-out and zero retention. AWS has a synchronous API since 2026-11-20, so S3 is no longer required. AssemblyAI has a synchronous API too.
- **Requirements of #499.** Met by default, with no setting: Cloudflare Workers AI (no retention, no training) and Azure fast transcription (nothing stored). Met with one self-serve setting: Groq (zero data retention toggle), Deepgram (`mip_opt_out=true` on each request), AssemblyAI (EU endpoint or the opt-out toggle on a paid plan), Google (default, as long as the logging program is not joined). Not met on self-serve: ElevenLabs (zero retention is Enterprise only), Mistral's current model (Public Preview), AWS until an AWS Organizations opt-out policy is set, OpenAI for the EU region (sales approval).
- **EU processing, self-serve**: Deepgram, AssemblyAI, Azure, Google, AWS, Speechmatics. Not offered or not documented: Groq (United States), Cloudflare Workers AI (cannot be pinned). Gated: OpenAI (sales), ElevenLabs (Enterprise). Unclear: Mistral.
- **Price** runs from 0.0005 per minute (Whisper on Cloudflare) to 0.016 (Google standard). A fully used agency Plan costs 0.51 to 5.20 a month at the vendors that fit; a pro Plan 0.08 to 0.78.
- **Latency.** Only Groq publishes a speed factor: about 0.3, 0.8 and 1.4 seconds of inference for 1, 3 and 5 minutes. Deepgram says "often after only a few seconds". Nobody else publishes a figure for synchronous transcription. All of it is to be measured.
- **Output.** Word and segment timestamps and the detected language are available everywhere except OpenAI's surviving model (none) and Mistral's current model (segments only).
- **Input.** Deepgram, AssemblyAI, ElevenLabs and Google name all three recorded formats. OpenAI, Groq and AWS name the three containers, not the codecs. Cloudflare names nothing. Azure does not name MP4; Speechmatics excludes WebM. Since the audio is remuxed before playback anyway (ADR-0027), the remuxed file can be the one transcribed.
- **Self-hosted.** A Whisper sidecar on CPU runs `base` or `small`; `small` needs about 1 to 1.5 GB of RAM and, by estimate, 15 to 30 seconds per recorded minute on 4 vCPU. One setting of three values (base URL, key, model) in the OpenAI request shape covers a local sidecar and several vendors.

## 1. Vendors against the four requirements

### Comparison

| Vendor and model                               | DPA                                          | Own sub-processors public | Retention of audio and transcript                                                                    | Trains on customer audio                                          | Region                                                                                |
| ---------------------------------------------- | -------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Cloudflare Workers AI `whisper-large-v3-turbo` | Automatic with the terms                     | Yes                       | None by default                                                                                      | No                                                                | Cannot be pinned to the EU                                                            |
| Groq `whisper-large-v3-turbo`                  | Automatic with the terms                     | Yes                       | None by default, except logs up to 30 days on error or abuse; self-serve zero retention removes them | No                                                                | United States                                                                         |
| Deepgram Nova-3                                | On request, text not read                    | Yes                       | Kept for model improvement by default; none with `mip_opt_out=true`                                  | Yes by default, opt-out per request                               | EU endpoint, self-serve, same price                                                   |
| AssemblyAI (async)                             | Public, with the terms                       | List not readable         | Audio deleted in 24 to 48 hours; transcript 30 days, 1 hour minimum by TTL, or deleted by API        | Not on the EU endpoint; opt-out toggle elsewhere, paid plans only | EU endpoint, self-serve, same price                                                   |
| AssemblyAI Sync STT                            | Same                                         | Same                      | None when opted out of training                                                                      | Same                                                              | EU host                                                                               |
| Azure fast transcription                       | Addendum to the Product Terms, body not read | UNVERIFIED                | None: "no-data-trace"                                                                                | None documented, clause UNVERIFIED                                | EU regions, EU Data Boundary                                                          |
| Google Speech-to-Text V2                       | Automatic with the terms                     | Yes                       | None by default; the copy in Cloud Storage is ours to delete                                         | Only if the logging program is joined                             | `eu` endpoint; residency statement UNVERIFIED                                         |
| Amazon Transcribe                              | Automatic with the terms                     | Yes                       | May store content to improve the service, until opt-out                                              | Yes by default, opt-out through AWS Organizations                 | EU regions, but content may leave the region until opt-out                            |
| OpenAI `gpt-transcribe`                        | Automatic with the terms                     | Yes                       | None listed for this endpoint; formal zero retention on approval                                     | No (opt-in)                                                       | EU endpoint on sales approval, 10% uplift may apply                                   |
| ElevenLabs Scribe v3                           | Through the terms                            | Yes                       | Kept by default, period UNVERIFIED; zero retention Enterprise only                                   | Opt-out toggle; default for API traffic UNVERIFIED                | US, EU or Singapore; EU residency Enterprise only                                     |
| Mistral Voxtral Mini Transcribe 3              | Automatic with the terms                     | Yes                       | Period UNVERIFIED; zero retention on request, not for Public Preview models                          | Opt-out does not apply to Public Preview models                   | EEA by default per the help centre, no commitment on the global endpoint per the docs |
| Gladia Solaria-3                               | Public                                       | In the DPA annex          | 3 weeks on paid accounts; zero retention Enterprise only                                             | Yes by default on self-serve, free opt-out                        | EU and US kept apart; how to pin UNVERIFIED                                           |
| Speechmatics                                   | UNVERIFIED (gated trust centre)              | UNVERIFIED                | 7 days, or deleted sooner by API                                                                     | No (opt-in, for a discount)                                       | EU endpoint, self-serve                                                               |

### Cloudflare Workers AI

- **DPA**: version 6.4, effective 2026-04-03, "forms part of the Main Agreement"; the Self-Serve Subscription Agreement incorporates it by reference. [DPA](https://www.cloudflare.com/cloudflare-customer-dpa/), [terms](https://www.cloudflare.com/terms/). Faster Fixes already stores files on Cloudflare R2, so Cloudflare would not be a new sub-processor, only a new use.
- **Sub-processors**: [public list](https://www.cloudflare.com/gdpr/subprocessors/cloudflare-services/). For Workers AI: CoreWeave (United States) and Nebius (England). 30 days' notice of additions.
- **Retention** (_raw_): "Zero data retention: Workers AI processes Customer Content only for as long as needed to provide the service. For standard inference requests that do not invoke a stateful feature, Cloudflare does not retain inputs or outputs after they are no longer needed to process the request and deliver the response". Exceptions: storage we configure ourselves (AI Gateway logging) and the asynchronous batch feature. [Data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/).
- **Training** (_raw_): "Cloudflare does not use Customer Content processed by Workers AI to train AI models." Same page.
- **Region** (_raw_): Workers AI is marked not compatible with Regional Services in the [Data Localization compatibility table](https://developers.cloudflare.com/data-localization/compatibility/). Inference location is not stated; both Workers AI sub-processors are outside the EEA. Transfers rest on the EU-U.S. Data Privacy Framework and SCCs.
- The catalogue also hosts Deepgram `nova-3` at 0.0052 per minute, as a partner model. Whether Deepgram receives the audio under its own terms there is UNVERIFIED.

### Groq

- **DPA**: effective 2025-10-15, "incorporated into and made part of the Groq Services Agreement"; accepting the agreement signs it. EEA customers contract with Groq UK Limited. [DPA](https://console.groq.com/docs/legal/customer-data-processing-addendum), [Services Agreement](https://console.groq.com/docs/legal/services-agreement).
- **Sub-processors**: [public list](https://trust.groq.com/subprocessors), 18 entries, most without a location; Google Cloud Platform for computing.
- **Retention** (_raw_): "By default, Groq does not retain customer data for inference requests." Inputs and outputs may be logged "only when" troubleshooting errors or investigating abuse, "retained for up to 30 days". "All customers may enable Zero Data Retention (ZDR) in Data Controls settings." The transcription endpoint is listed as eligible. [Your data](https://console.groq.com/docs/your-data).
- **Training**: "Groq is not permitted to use Inputs or Outputs for training or fine-tuning any AI Model Services or other models" (Services Agreement, 4.2).
- **Region** (_raw_): "All customer data is retained in Google Cloud Platform (GCP) buckets located in the United States." Groq runs data centres in Finland and the UK and its docs mention "regional / sovereign endpoints" in passing, but no EU endpoint or residency commitment is documented: UNVERIFIED, treat as not available. Transfers by SCCs.

### Deepgram

- **DPA**: not public. `deepgram.com/dpa` answers 404; the [privacy policy](https://deepgram.com/privacy) says "We enter into data processing agreements with our customers", and the [compliance page](https://developers.deepgram.com/trust-security/data-privacy-compliance) says to ask an Account Executive. The text was not read: UNVERIFIED.
- **Sub-processors**: [public list](https://deepgram.com/privacy/subprocessors), undated, no locations. Audio goes to AWS, Oracle Cloud, Baseten, Coval and Cloudflare. The page adds that Deepgram "may occasionally engage third-party speech recognition providers" to evaluate its models, unless opted out of the Model Improvement Program.
- **Retention**: by default "Retained to improve our models." With `mip_opt_out=true` on the request: "Retained only for the duration needed to process the request." and "Opting out gives you zero data retention." [Your data](https://developers.deepgram.com/trust-security/your-data). Whether opting out changes the price is not stated: UNVERIFIED.
- **Training**: "Participation is the default." The [terms](https://deepgram.com/terms) grant a perpetual licence to train on content. The opt-out is a query parameter on every request, so forgetting it once is a breach of #499.
- **Region**: `api.eu.deepgram.com`: "Requests to the EU endpoint are never routed outside the EU.", with "the same API keys, SDKs, and pricing". [Regional endpoints](https://developers.deepgram.com/reference/regional-endpoints). Caveats: "Account and billing metadata is processed in the United States for every endpoint" and "Model improvement on retained data can happen outside that region", so the EU endpoint needs the opt-out as well. The global endpoint "carries no data residency guarantee".

### AssemblyAI

- **Models**: AssemblyAI-STT-3.7 (`assemblyai-stt-3-7`, 32 languages, the default for accounts created from 2026-11-17), Universal-2 (99 languages). Universal-3.5 Pro is the deprecated name of the first. [Models](https://www.assemblyai.com/docs/getting-started/models.md).
- **DPA**: [public](https://www.assemblyai.com/legal/data-processing-addendum), last modified 2026-01-22; entering it signs the EU SCCs. The clause of the terms that incorporates it was not read.
- **Sub-processors**: the DPA points to the [trust centre](https://www.assemblyai.com/trust), which did not render: UNVERIFIED. 10 days' notice of additions.
- **Retention**, async API: uploaded audio, "Deletion process begins at 24 hours and is at most 48 hours."; transcripts, 30 days by default, a TTL "can be as low as one (1) hour" with a lag of hours to days, or a `DELETE` on the transcript. There is no zero retention on the async API. On the synchronous API: "we offer zero data retention of audio and transcripts for our Sync STT product" when opted out of training. [Retention](https://www.assemblyai.com/docs/data-retention-and-model-training.md), [FAQ](https://www.assemblyai.com/docs/faq/how-long-are-outputs-retained).
- **Training**: files are excluded when "utilizing our European servers". Elsewhere the opt-out is a dashboard toggle, "available self-serve at no additional cost", but "Free users cannot opt out of the model improvement program, set a TTL, or sign a BAA."
- **Region**: `api.eu.assemblyai.com`: "Audio and transcript data will be stored in the endpoint region you select."; "EU region is the same price as US." Account and usage data stay in the United States, file names included, and staff outside the region may access data. Sync host: `sync.eu.assemblyai.com`. [Region](https://www.assemblyai.com/docs/pre-recorded-audio/select-the-region.md).

### Azure Speech, fast transcription

- **DPA**: the Microsoft Products and Services DPA is "an addendum to the Product Terms". [DPA page](https://www.microsoft.com/licensing/docs/view/Microsoft-Products-and-Services-Data-Protection-Addendum-DPA). The body and the sub-processor list are downloads that were not read: UNVERIFIED.
- **Retention**: "Fast transcription (`speechtotext/transcriptions:transcribe`) follows the Speech to text no-data-trace policy: it doesn't store audio input or transcription output after it returns the response." [Data privacy](https://learn.microsoft.com/en-us/azure/ai-foundry/responsible-ai/speech-service/speech-to-text/data-privacy-security).
- **Training**: the page describes no use for training; an explicit contractual sentence was not read: UNVERIFIED.
- **Region**: "Azure Speech stores and processes speech data in the region where you create your resource." Fast transcription is offered in `francecentral`, `germanywestcentral`, `italynorth`, `northeurope`, `swedencentral` and `westeurope`. [Regions](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/regions), [EU Data Boundary](https://learn.microsoft.com/en-us/privacy/eudb/eu-data-boundary-learn).
- It needs an Azure subscription, which Faster Fixes does not have.

### Google Cloud Speech-to-Text V2

- **DPA**: the [Cloud Data Processing Addendum](https://cloud.google.com/terms/data-processing-addendum) "is incorporated into the Agreement(s)". [Sub-processors](https://cloud.google.com/terms/subprocessors), last modified 2026-11-25.
- **Retention and training**: "By default, Cloud Speech-to-Text does not log customer audio data or transcripts." The logging program is opt-in, for a discount. [Data logging](https://docs.cloud.google.com/speech-to-text/v2/docs/data-logging).
- **Region**: Chirp 3 "requires a regional or multi-regional API endpoint", `eu` included. A statement that data stays in the EU there was not read: UNVERIFIED.
- **The obstacle is the input, not the terms**: "Audio sent to a synchronous request is limited to 10 MB or 1 minute of audio duration", and "Batch speech recognition is only able to transcribe audio stored in Cloud Storage." [Quotas](https://docs.cloud.google.com/speech-to-text/v2/quotas), [batch](https://docs.cloud.google.com/speech-to-text/v2/docs/batch-recognize). Every narrated Recording over one minute means a second copy of the voice in a Google bucket, which contradicts "audio never leaves Faster Fixes" beyond the transcription call itself.

### Amazon Transcribe

- **DPA**: "These Service Terms incorporate the AWS Data Processing Addendum". [Service Terms](https://aws.amazon.com/service-terms/), [sub-processors](https://aws.amazon.com/compliance/sub-processors/).
- **Training and retention**: on by default. Service Terms 50.3 names Amazon Transcribe: "we may use and store AI Content that is processed by each of the foregoing AI Services to develop and improve the applicable AI Service", and "we may store such AI Content in an AWS region outside of the AWS region where you are using such AI Service." The opt-out is "an AI services opt-out policy using AWS Organizations". [Opt-out policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_ai-opt-out.html).
- **Region**: EU regions for both APIs, effective only once opted out.
- **New**: `TranscribeAudio`, launched 2026-11-20, "returns the transcript in the same response" from inline audio up to 25 MB and one hour. [API reference](https://docs.aws.amazon.com/transcribe/latest/APIReference/API_TranscribeAudio.html), [announcement](https://aws.amazon.com/about-aws/whats-new/2026/11/amazon-transcribe-sync-api/). What it retains is not documented: UNVERIFIED.

### OpenAI

- **Models**: "Start with gpt-transcribe." `whisper-1`, `gpt-4o-transcribe`, `gpt-4o-mini-transcribe` and `gpt-4o-transcribe-diarize` "are deprecated and will shut down on February 26, 2027". [Guide](https://developers.openai.com/api/docs/guides/speech-to-text) (_raw_), [deprecations](https://developers.openai.com/api/docs/deprecations).
- **DPA**: effective 2026-01-01, "incorporated into" the Services Agreement; EEA customers contract with OpenAI Ireland Ltd. [DPA](https://openai.com/policies/data-processing-addendum), [sub-processors](https://openai.com/policies/sub-processor-list/) (last updated 2026-10-14).
- **Retention** (_raw_): the row for `/v1/audio/transcriptions` in the [data controls table](https://developers.openai.com/api/docs/guides/your-data) shows no training, no abuse-monitoring retention and no application state. Formal zero data retention is "subject to prior approval by OpenAI".
- **Training** (_raw_): "data sent to the OpenAI API is not used to train or improve OpenAI models (unless you explicitly opt in to share data with us)."
- **Region** (_raw_): `eu.api.openai.com` covers the transcription models, but "Contact sales to discuss your data residency needs and become eligible", with "a 10% uplift for models released on or after March 5, 2026". [Data residency](https://developers.openai.com/api/docs/guides/data-residency). The default region is not stated.
- **The obstacle is the output**: see section 3.

### ElevenLabs Scribe

- **Models**: `scribe_v3` is current, `scribe_v2` the previous one, `scribe_v1` deprecated. [Models](https://elevenlabs.io/docs/overview/models).
- **DPA**: [public](https://elevenlabs.io/dpa), last updated 2026-04-08, incorporated through the terms. [Sub-processors](https://compliance.elevenlabs.io): Google Cloud and AWS, "US, EU, or Singapore" for non-Enterprise customers.
- **Retention**: "By default, ElevenLabs retains data"; "Zero Retention Mode is available to select enterprise customers." [Zero retention](https://elevenlabs.io/docs/resources/zero-retention-mode). The default period for transcription inputs is UNVERIFIED.
- **Training**: "Anyone can opt out of data use at any time" through an account toggle. Whether the default covers API traffic is UNVERIFIED. [Help centre](https://elevenlabs.io/docs/help-center/legal/is-my-data-used-to-improve-eleven-labs-ai-models).
- **Region**: "Data residency is an exclusive feature available to ElevenLabs' Enterprise customers." [Data residency](https://elevenlabs.io/docs/overview/administration/data-residency).
- Fails "deletion once processing ends" without an Enterprise contract.

### Mistral Voxtral

- **Models**: Voxtral Mini Transcribe 2 (`voxtral-mini-2602`) was deprecated on 2026-10-31 and retires on 2027-04-30. Its successor, [Voxtral Mini Transcribe 3](https://docs.mistral.ai/models/voxtral-mini-transcribe-3-0), is labelled "Public Preview". [Models overview](https://docs.mistral.ai/getting-started/models/models_overview/).
- **DPA**: [public](https://legal.mistral.ai/terms/data-processing-addendum), effective 2026-07-27, incorporated by reference. [Sub-processors](https://trust.mistral.ai/subprocessors): Microsoft (Sweden, Norway), Google (Netherlands, Belgium), Mistral Compute (France), CoreWeave (EEA), Cloudflare.
- **Retention**: zero data retention exists on pay as you go, on request ("We review each request and may approve or deny it."), for stateless calls "except Labs and Public Preview models". [Zero data retention](https://docs.mistral.ai/admin/monitor-comply/zero-data-retention.md). The default period is UNVERIFIED (30 rolling days seen in a search snippet only).
- **Training**: "the training opt-out does not apply to Labs and Public Preview models, whichever subscription plan you adhere to." [Help centre](https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models).
- **Region**: the help centre says "By default, your data is hosted in the European Economic Area (EEA)."; the regional inference page says of the global endpoint "Mistral does not commit to a specific inference location", and bills `api.eu.mistral.ai` at 1.1 times list. [Hosting](https://help.mistral.ai/en/articles/347629-where-do-you-store-my-data-or-my-organization-s-data), [regional inference](https://docs.mistral.ai/inference/regional-inference.md). Whether transcription is served on the EU endpoint is UNVERIFIED.
- Fails "no training" for as long as the model is a Public Preview.

### Gladia and Speechmatics

- **Gladia** (France): "Model training by default (opt-out available)" on self-serve, at no cost; audio and transcripts kept 3 weeks on paid accounts; zero retention is Enterprise. Its compliance hub says the opposite about training ("never trains on customer data by default"). [Pricing](https://www.gladia.io/pricing), [retention](https://docs.gladia.io/chapters/limits-and-specifications/data-retention.md), [DPA](https://www.gladia.io/data-process-agreement).
- **Speechmatics** (UK): "Audio files, transcripts, and job configuration are stored for 7 days, then deleted automatically. You can delete them sooner with the API."; training only on opt-in; EU endpoint `eu1.asr.api.speechmatics.com`. DPA and sub-processor list are behind a gated trust centre. [Security](https://docs.speechmatics.com/administration/security-and-compliance.md).

## 2. Price and latency

### Price per minute

| Vendor and model                        | Per minute  | How it is priced              | Minimum and free allowance                                                       |
| --------------------------------------- | ----------- | ----------------------------- | -------------------------------------------------------------------------------- |
| Cloudflare `whisper`                    | 0.000453    | 41.14 neurons x 0.011 / 1,000 | 10,000 neurons a day free (243 min); minimum not stated                          |
| Cloudflare `whisper-large-v3-turbo`     | 0.000513    | 46.63 neurons x 0.011 / 1,000 | Same allowance (214 min a day)                                                   |
| Groq `whisper-large-v3-turbo`           | 0.000667    | 0.04 per hour                 | 10 seconds billed per request; free tier of 120 audio minutes an hour, 480 a day |
| Groq `whisper-large-v3`                 | 0.00185     | 0.111 per hour                | Same                                                                             |
| AssemblyAI Universal-2                  | 0.0025      | 0.15 per hour                 | 50 in free credits; increment not stated                                         |
| OpenAI `gpt-4o-mini-transcribe`         | 0.003       | Token priced, vendor estimate | Shuts down 2027-02-26                                                            |
| Google V2, dynamic batch                | 0.003       | Per second                    | Fulfilled "within 24 hours"                                                      |
| Azure batch                             | 0.003       | 0.18 per hour, per second     | Queue of minutes to hours                                                        |
| ElevenLabs Scribe v3                    | 0.00333     | 0.20 per hour                 | "Billing is per second with no minimum."                                         |
| AssemblyAI-STT-3.7                      | 0.0035      | 0.21 per hour                 | Same as Universal-2                                                              |
| Mistral Voxtral Mini Transcribe 3       | 0.0035      | Per minute                    | 0.00385 if the EU uplift applies (UNVERIFIED)                                    |
| Speechmatics Melia 1                    | 0.0040      | 0.24 per hour, in credits     | 100 in free credits                                                              |
| Deepgram Nova-3 monolingual             | 0.0043      | Per minute, "Promo pricing"   | "no minimum duration and no rounding up"; 200 credit                             |
| OpenAI `gpt-transcribe`                 | 0.0045      | Per minute                    | 0.00495 if the EU uplift applies (UNVERIFIED)                                    |
| AssemblyAI Sync STT                     | 0.005       | 0.30 per hour                 |                                                                                  |
| Deepgram Nova-3 multilingual            | 0.0052      | Per minute                    | Same as monolingual                                                              |
| OpenAI `whisper-1`, `gpt-4o-transcribe` | 0.006       | Per minute                    | Shut down 2027-02-26                                                             |
| Amazon Transcribe batch                 | 0.006       | 0.0001 per second, eu-west-1  | No minimum; 60 min a month for 12 months                                         |
| Azure fast transcription                | 0.006       | 0.36 per hour, per second     | No free tier for this mode                                                       |
| Amazon Transcribe synchronous           | 0.007       | 0.000116667 per second        |                                                                                  |
| Google V2 standard                      | 0.016       | Per second                    | Chirp 2 and 3 at this rate is an inference                                       |
| Gladia Solaria-3                        | EUR 0.00267 | EUR 0.16 per hour             | EUR 50 in credits                                                                |

Sources: Cloudflare [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) and model pages ([turbo](https://developers.cloudflare.com/workers-ai/models/whisper-large-v3-turbo/), [whisper](https://developers.cloudflare.com/workers-ai/models/whisper/)); Groq [speech to text](https://console.groq.com/docs/speech-to-text) (_raw_; `groq.com/pricing` now redirects to the home page) and [rate limits](https://console.groq.com/docs/rate-limits); [AssemblyAI](https://www.assemblyai.com/pricing); [OpenAI](https://developers.openai.com/api/docs/pricing); [Google](https://cloud.google.com/speech-to-text/pricing); Azure [retail prices API](https://prices.azure.com/api/retail/prices), region `westeurope`; [ElevenLabs](https://elevenlabs.io/pricing/api); [Mistral](https://docs.mistral.ai/inference/pricing); [Speechmatics](https://www.speechmatics.com/pricing); [Deepgram](https://deepgram.com/pricing); AWS [price list for eu-west-1](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/transcribe/current/eu-west-1/index.json), published 2026-11-21; [Gladia](https://www.gladia.io/pricing).

Against #495 (read on 2026-11-25): no price moved. New rows: AssemblyAI Sync STT, Amazon synchronous, Speechmatics. The ElevenLabs price now covers Scribe v3.

### What a fully used Plan costs

Minutes x price, at the limits of #498. Plan prices: 20 (pro), 99 (agency).

| Vendor                            | Free, 5 min once | Pro, 150 min a month        | Agency, 1,000 min a month   |
| --------------------------------- | ---------------- | --------------------------- | --------------------------- |
| Cloudflare turbo, 0.000513        | 0.0026           | 0.08 (0.4%)                 | 0.51 (0.5%)                 |
| Groq turbo, 0.000667              | 0.0033           | 0.10 (0.5%)                 | 0.67 (0.7%)                 |
| AssemblyAI Universal-2, 0.0025    | 0.0125           | 0.38 (1.9%)                 | 2.50 (2.5%)                 |
| AssemblyAI-STT-3.7, 0.0035        | 0.0175           | 0.53 (2.6%)                 | 3.50 (3.5%)                 |
| Deepgram Nova-3, 0.0043 to 0.0052 | 0.022 to 0.026   | 0.65 to 0.78 (3.2% to 3.9%) | 4.30 to 5.20 (4.3% to 5.3%) |
| Azure fast, 0.006                 | 0.03             | 0.90 (4.5%)                 | 6.00 (6.1%)                 |

- These are ceilings: every narrated Recording at full length, every month.
- Groq bills at least 10 seconds per request. A narrated Recording that crossed page loads holds several audio segments (#504); sent one request per segment, each short segment is rounded up to 10 seconds. One concatenated file avoids it.

### Latency for 1, 3 and 5 minutes

| Vendor                                                                                 | Call                         | 1 min        | 3 min        | 5 min        | Basis                                                                                                                                                |
| -------------------------------------------------------------------------------------- | ---------------------------- | ------------ | ------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Groq `whisper-large-v3-turbo`                                                          | Synchronous                  | 0.28 s       | 0.83 s       | 1.39 s       | Computed from the vendor's "Real-time Speed Factor" of 216: 60 / 216, 180 / 216, 300 / 216. Inference only; how the factor is measured is not stated |
| Groq `whisper-large-v3`                                                                | Synchronous                  | 0.32 s       | 0.95 s       | 1.59 s       | Same, factor 189                                                                                                                                     |
| Deepgram Nova-3                                                                        | Synchronous, or callback     | no figure    | no figure    | no figure    | "often after only a few seconds"; hard stop at 10 minutes of processing                                                                              |
| AssemblyAI Sync STT                                                                    | Synchronous                  | under 30 s   | under 30 s   | under 30 s   | Upper bound only: a `504` "if the request passes its 30-second server deadline"; the vendor says "in milliseconds" without a benchmark               |
| AssemblyAI async                                                                       | Submit, then poll or webhook | no figure    | no figure    | no figure    | None published                                                                                                                                       |
| Azure fast transcription                                                               | Synchronous                  | under 60 s   | under 180 s  | under 300 s  | Upper bound only: "faster than real-time"                                                                                                            |
| Azure batch                                                                            | Job                          | 12 s + queue | 36 s + queue | 60 s + queue | "roughly 5x real-time speed"; a job may wait "up to 30 minutes" to start                                                                             |
| Google V2 dynamic batch                                                                | Job                          | up to 24 h   | up to 24 h   | up to 24 h   | "The request is fulfilled within 24 hours."                                                                                                          |
| Cloudflare, OpenAI, ElevenLabs, Mistral, Amazon, Google standard, Gladia, Speechmatics | Synchronous or job           | no figure    | no figure    | no figure    | None published                                                                                                                                       |

Sources: [Groq](https://console.groq.com/docs/speech-to-text), [Deepgram](https://developers.deepgram.com/docs/pre-recorded-audio), [AssemblyAI Sync](https://www.assemblyai.com/docs/sync-stt/getting-started/transcribe-a-short-audio-file.md), [Azure fast](https://learn.microsoft.com/azure/ai-services/speech-service/fast-transcription-create), [Azure batch](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription), [Google](https://docs.cloud.google.com/speech-to-text/v2/docs/reference/rpc/google.cloud.speech.v2).

- Every figure excludes the upload of the file (1.2 MB for five minutes) and queueing.
- The delay is not on the Reviewer's path: "Sent means stored, before remuxing and transcription" (#504). It only sets how long the inbox shows a narrated Recording without captions.
- The Inngest route in cloud runs with `maxDuration = 60` (`apps/web/src/app/api/inngest/route.ts`). A synchronous call measured in seconds fits one step. A job-based vendor needs a wait and a second step.

## 3. Output

| Vendor and model                    | Word timestamps                                          | Segment timestamps             | Language detected and returned                                    | Languages                           | French           |
| ----------------------------------- | -------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------- | ----------------------------------- | ---------------- |
| Cloudflare `whisper-large-v3-turbo` | Yes, in the default response                             | Yes                            | Yes: `transcription_info.language` and its probability            | Not stated                          | Not stated       |
| Cloudflare `whisper`                | Yes                                                      | No                             | No field                                                          | Not stated                          | Not stated       |
| Groq, both models                   | Yes: `verbose_json` and `timestamp_granularities[]=word` | Yes                            | Not documented by Groq                                            | "99+ languages supported"           | Not named        |
| Deepgram Nova-3                     | Yes, always                                              | Utterances not read            | With `detect_language=true`: `detected_language`; off by default  | No count; 35 detectable             | Yes              |
| AssemblyAI async                    | Yes, always                                              | Utterances with speaker labels | With `language_detection`: `language_code` and confidence         | 32 (STT-3.7), 99 (Universal-2)      | Yes              |
| AssemblyAI Sync STT                 | With `timestamps: true`                                  | Not read                       | Not described                                                     | 32                                  | Yes              |
| Azure fast transcription            | Yes                                                      | Yes, phrases                   | Yes, per phrase, when no locale is given; 15 locales in that mode | About 148 locales                   | Yes              |
| Google V2, Chirp 3                  | With `enable_word_time_offsets`                          | Results                        | With `language_codes=["auto"]`                                    | Not stated                          | Yes              |
| Amazon Transcribe                   | Yes, always                                              | Yes, `audio_segments`          | With `IdentifyLanguage`; 30 seconds of speech advised             | About 110 (batch); 11 (synchronous) | Yes              |
| OpenAI `gpt-transcribe`             | **No**                                                   | **No**                         | Yes: `languages`                                                  | Not stated                          | In examples only |
| OpenAI `whisper-1`                  | Yes                                                      | Yes                            | Yes                                                               | 98                                  | Yes              |
| ElevenLabs Scribe v3                | Yes, also per character                                  | Not read                       | Yes, by default: `language_code` and probability                  | "90+"                               | Yes              |
| Mistral Voxtral Mini Transcribe 3   | **No**: "Word-level timestamps aren't available."        | Yes                            | With `return_language`                                            | 53                                  | Yes              |
| Gladia                              | Yes, by default                                          | Utterances                     | Not read                                                          | Not read                            | Not read         |
| Speechmatics                        | Yes                                                      | Not read                       | Yes, in metadata                                                  | Not read                            | Not read         |

Sources: Cloudflare model schemas (_raw_, on the model pages above); [Groq](https://console.groq.com/docs/speech-to-text); Deepgram [pre-recorded](https://developers.deepgram.com/docs/pre-recorded-audio), [language detection](https://developers.deepgram.com/docs/language-detection); AssemblyAI [languages](https://www.assemblyai.com/docs/pre-recorded-audio/supported-languages.md), [language detection](https://www.assemblyai.com/docs/pre-recorded-audio/language-detection.md); [Azure](https://learn.microsoft.com/azure/ai-services/speech-service/fast-transcription-create); Google [Chirp 3](https://docs.cloud.google.com/speech-to-text/v2/docs/chirp_3-model); Amazon [output](https://docs.aws.amazon.com/transcribe/latest/dg/how-input.html), [language identification](https://docs.aws.amazon.com/transcribe/latest/dg/lang-id-batch.html); [OpenAI guide](https://developers.openai.com/api/docs/guides/speech-to-text); [ElevenLabs](https://elevenlabs.io/docs/api-reference/speech-to-text/convert); Mistral [transcribe files](https://docs.mistral.ai/studio/audio/speech-to-text/transcribe-files), [languages](https://docs.mistral.ai/studio/audio/specs-and-limits/languages); [Gladia](https://docs.gladia.io/chapters/pre-recorded-stt/features/word-level-timestamps.md); [Speechmatics](https://docs.speechmatics.com/speech-to-text/batch/output.md).

- **OpenAI rules itself out for the inbox** (_raw_): "The `timestamp_granularities[]` parameter is only supported for `whisper-1`." and "Existing integrations can use the deprecated `whisper-1` model for word or segment timestamps until February 26, 2027." After that date, no documented OpenAI model returns timestamps for a file. Captions and a voice log on the Recording's clock (#500) need at least segments.
- **Segments are enough for captions and the voice log; words are what an agent needs** to tie "this button" to a click in the Diagnostic Trail. Mistral's current model gives segments only.
- **Whisper-family language lists**: the model card states 99 languages and "strong ASR results in ~10 languages". Neither Groq nor Cloudflare publishes its own list. French error rates by model size are in `transcription-options.md`, section 5; no vendor publishes French or non-native English error rates for its current model.
- **Language detection on short audio**: Amazon advises 30 seconds of speech, AssemblyAI 15 to 90. A one-minute narrated Recording with pauses is near that floor. The Widget knows the page and browser locale and can send it as a hint.

## 4. Input

### The three recorded formats

| Vendor                   | Opus in WebM         | Opus in Ogg        | AAC in MP4         | What the page lists                                                                                   |
| ------------------------ | -------------------- | ------------------ | ------------------ | ----------------------------------------------------------------------------------------------------- |
| Deepgram                 | Listed               | Listed             | Listed             | "MP3", "MP4", "AAC", "M4A", "Ogg", "Opus", "WebM"; "over 100+" formats                                |
| AssemblyAI               | Listed               | Listed             | Listed             | `.webm`, `.ogg`, `.opus`, `.mp4`, `.m4a`, `.aac`; Sync: "AAC, MP3, M4A, Ogg/Opus, FLAC, or WebM"      |
| ElevenLabs               | Listed               | Listed             | Listed             | "AAC, AIFF, OGG, MP3, OPUS, WAV, FLAC, M4A, WebM, MP4"                                                |
| Google V2                | Listed               | Listed             | Listed             | `WEBM_OPUS`, `OGG_OPUS`, `MP4_AAC`, `M4A_AAC` in the API reference; the older encoding page omits MP4 |
| OpenAI                   | Container only       | Container only     | Container only     | "`flac`, `mp3`, `mp4`, `mpeg`, `mpga`, `m4a`, `ogg`, `wav`, and `webm`"                               |
| Groq                     | Container only       | Container only     | Container only     | Same nine extensions                                                                                  |
| Amazon Transcribe        | Container only       | Container only     | Container only     | "AMR, FLAC, M4A, MP3, MP4, Ogg, WebM, WAV"                                                            |
| Azure fast transcription | Listed               | Listed             | **MP4 not named**  | "WAV, MP3, OPUS/OGG, FLAC, WMA, AAC, ... AMR, WebM, SPEEX"; GStreamer "might accept more"             |
| Gladia                   | **"webm" not named** | Listed             | Listed             | `ogg`, `opus`, `mp4`, `m4a`, `aac`, `matroska`                                                        |
| Speechmatics             | **Not supported**    | Opus not named     | Listed             | "The list above is exhaustive"; no `webm`, no `opus`                                                  |
| Cloudflare Workers AI    | **Nothing listed**   | **Nothing listed** | **Nothing listed** | No format list for either Whisper model                                                               |
| Mistral                  | UNVERIFIED           | UNVERIFIED         | UNVERIFIED         | Formats not readable; the earlier model's playground listed ".mp3, .wav, .m4a, .flac, .ogg"           |
| Azure OpenAI Whisper     | Container only       | **Not listed**     | Container only     | "mp3, mp4, mpeg, mpga, m4a, wav, and webm formats. Other formats return an error."                    |

Sources: [Deepgram](https://developers.deepgram.com/docs/supported-audio-formats); AssemblyAI [file types](https://www.assemblyai.com/docs/faq/what-audio-and-video-file-types-are-supported-by-your-api), [Sync audio requirements](https://www.assemblyai.com/docs/sync-stt/audio-requirements.md); [ElevenLabs](https://elevenlabs.io/docs/capabilities/speech-to-text); [Google](https://docs.cloud.google.com/speech-to-text/v2/docs/reference/rpc/google.cloud.speech.v2); [OpenAI](https://developers.openai.com/api/docs/guides/speech-to-text); [Groq](https://console.groq.com/docs/speech-to-text); [Amazon](https://docs.aws.amazon.com/transcribe/latest/dg/how-input.html); [Azure](https://learn.microsoft.com/azure/ai-services/speech-service/batch-transcription-audio-data); [Gladia](https://docs.gladia.io/chapters/limits-and-specifications/supported-formats.md); [Speechmatics](https://docs.speechmatics.com/speech-to-text/batch/input.md); [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/whisper-quickstart).

- "Listed" means the vendor names the container and the codec. "Container only" means the extension is accepted and the codec inside is not named: Opus in WebM and AAC in MP4 are what those extensions usually hold, but the page does not say so.
- **No vendor page mentions a file without duration metadata.** Chromium's WebM carries none (ADR-0027). Whether a vendor accepts such a file as recorded is UNVERIFIED everywhere: it has to be tried with real `MediaRecorder` output from the three engines.
- **Remuxing is already planned.** ADR-0027: "the audio needs remuxing before playback". If the remux produces one container for the three engines, the transcription can read that file and the question of three formats disappears. It also solves the several segments of a Recording that crossed page loads, and Groq's 10-second minimum. The cost is an ordering constraint: transcription waits for the remux.
- AssemblyAI advises the opposite of converting: "We recommend that you submit your audio in its native format without additional transcoding or file conversion." Groq: "Our speech-to-text models will downsample audio to 16KHz mono before transcribing".
- At 32 kbit/s the bitrate is not a concern for Whisper: #502 found a local Whisper model transcribing the 24 and 32 kbit/s files word for word.

### Limits

| Vendor                   | File size                                  | Duration                            | How the audio is sent                                                            |
| ------------------------ | ------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------- |
| OpenAI                   | 25 MB                                      | Not stated                          | Multipart upload                                                                 |
| Groq                     | 25 MB (free tier), 100 MB (developer tier) | Not stated; 0.01 s minimum          | Multipart upload or URL                                                          |
| Cloudflare Workers AI    | Not stated; batch feature "under 10 MB"    | Not stated                          | Base64 in JSON (turbo) or binary body (`whisper`), over REST or a Worker binding |
| Deepgram                 | 2 GB                                       | Bounded by 10 minutes of processing | Binary body or URL                                                               |
| AssemblyAI async         | 2.2 GB                                     | 160 ms to 10 hours                  | Upload, then a transcript request by URL                                         |
| AssemblyAI Sync STT      | 256 MB                                     | 80 ms to 20 minutes                 | Body; "no URL ingestion"                                                         |
| ElevenLabs               | 5 GB                                       | 15 hours                            | Multipart upload                                                                 |
| Azure fast transcription | Under 500 MB                               | Under 5 hours                       | Multipart upload or public URL                                                   |
| Amazon synchronous       | 25 MB inline, 500 MB from S3               | 0.5 s to 1 hour                     | Inline bytes or S3                                                               |
| Amazon batch             | 2 GB                                       | 8 hours                             | S3 only                                                                          |
| Google synchronous       | 10 MB                                      | **1 minute**                        | Inline or Cloud Storage                                                          |
| Google batch             | Not stated                                 | 8 hours                             | Cloud Storage only                                                               |
| Mistral                  | Not stated                                 | Not stated                          | Upload, URL or file id                                                           |
| Gladia                   | 1,000 MB                                   | 135 minutes                         | Upload                                                                           |
| Speechmatics             | 1 GB                                       | Not stated                          | Upload                                                                           |

A five-minute narrated Recording is about 1.2 MB of voice, 1.6 MB as base64. Every limit above holds it except Google's synchronous one-minute cap.

## 5. A self-hosted instance

Two routes with no dependency on a service Faster Fixes pays for: a model on the instance, or a key the owner supplies.

### A local Whisper model

| Project                                                                       | State on 2026-11-27                                         | Decodes the three formats                                                                                                          | HTTP interface                                                                                      |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp)                        | v1.9.6, 2026-11-23, MIT                                     | Not natively (WAV, FLAC, MP3, Ogg Vorbis by reading the source). `--convert` shells out to ffmpeg, which the published image ships | `whisper-server`: `POST /inference`, path configurable; "OAI-like", not the OpenAI contract         |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper)                   | v1.2.1, 2025-10-31; repository active                       | Yes, through PyAV: "FFmpeg does **not** need to be installed on the system."                                                       | None: a Python library                                                                              |
| [speaches](https://github.com/speaches-ai/speaches)                           | v0.9.0-rc.3, 2025-12-27; last commit on `master` 2026-04-18 | Yes (faster-whisper)                                                                                                               | `POST /v1/audio/transcriptions`, `verbose_json`, `timestamp_granularities[]`                        |
| [whisper-asr-webservice](https://github.com/ahmetoner/whisper-asr-webservice) | v2.0.0, 2026-11-25                                          | Yes: "decoded in-process with PyAV"                                                                                                | "OpenAI-compatible API"; timestamps on that route UNVERIFIED                                        |
| [LocalAI](https://localai.io/docs/models/capabilities/audio/audio-to-text/)   | v5.0.1, 2026-11-20                                          | Yes: "all the audio formats supported by `ffmpeg`"                                                                                 | `POST /v1/audio/transcriptions`, `verbose_json`; granularity "Honored when the backend produces" it |
| [Ollama](https://docs.ollama.com/api/openai-compatibility)                    | Current                                                     | **No**: WAV only                                                                                                                   | `/v1/audio/transcriptions`, no `timestamp_granularities`                                            |
| [vLLM](https://docs.vllm.ai/en/latest/serving/online_serving/speech_to_text/) | Current                                                     | Yes                                                                                                                                | OpenAI-compatible; built for GPUs                                                                   |

- **whisper.cpp server, in detail**: `verbose_json` returns segments with a `words` array nested inside each, built per token rather than per word, and the server reads neither `timestamp_granularities[]` nor `model`. Word timestamps are labelled "experimental" in the README. The README warns to run it sandboxed, "especially since it involves risky operations like accepting user file uploads and using ffmpeg for format conversions". Image: `ghcr.io/ggml-org/whisper.cpp:main`, amd64 and arm64, with `curl` and `ffmpeg`. [Server README](https://github.com/ggml-org/whisper.cpp/blob/master/examples/server/README.md).
- **speaches** matches the OpenAI contract most closely, but has had no release in eleven months and 190 open issues. It downloads no model by itself: one request to `POST /v1/models/{id}` or a `preload_models` setting is needed first. It unloads the model after 300 seconds idle by default. Images `ghcr.io/speaches-ai/speaches:latest-cpu` and `latest-cuda`.
- **whisper-asr-webservice** is the most recently released: CPU image for amd64 and arm64, engine `faster_whisper` and model `base` by default, unloads the model when idle. Its v2 README does not say whether `verbose_json` carries timestamps.
- Both whisper.cpp and faster-whisper have voice activity detection (Silero), which matters for a Recording with long silences: the Whisper paper names hallucination on silent audio as a failure mode.

**Models and what they need.**

| Model            | Parameters | Disk, whisper.cpp (full / quantized) | Memory, whisper.cpp | VRAM, openai/whisper | Fleurs French WER (paper) |
| ---------------- | ---------- | ------------------------------------ | ------------------- | -------------------- | ------------------------- |
| `tiny`           | 39 M       | 74 / 31 MiB                          | about 273 MB        | about 1 GB           | 41.4%                     |
| `base`           | 74 M       | 141 / 57 MiB                         | about 388 MB        | about 1 GB           | 28.5%                     |
| `small`          | 244 M      | 465 / 181 MiB                        | about 852 MB        | about 2 GB           | 15.0%                     |
| `medium`         | 769 M      | 1,463 / 514 MiB                      | about 2.1 GB        | about 5 GB           | 8.7%                      |
| `large-v3`       | 1,550 M    | 2,952 / 1,031 MiB                    | about 3.9 GB        | about 10 GB          | 8.3% (large-v2)           |
| `large-v3-turbo` | 809 M      | 1,549 / 547 MiB                      | UNVERIFIED          | about 6 GB           | No number published       |

Sources: [Whisper README](https://github.com/openai/whisper#available-models-and-languages), whisper.cpp [memory table](https://github.com/ggml-org/whisper.cpp#memory-usage) and [model files](https://huggingface.co/ggerganov/whisper.cpp/tree/main), [Whisper paper, table 13](https://arxiv.org/abs/2212.04356). Whisper is MIT licensed. On turbo: "the exact same model, except that the number of decoding layers have reduced from 32 to 4", "way faster, at the expense of a minor quality degradation" ([model card](https://huggingface.co/openai/whisper-large-v3-turbo)); "Across languages, the `turbo` model performs similarly to `large-v2`" ([discussion](https://github.com/openai/whisper/discussions/2363)).

**Speed on CPU.** The one full-pipeline primary benchmark is the [faster-whisper README](https://github.com/SYSTRAN/faster-whisper#benchmark): `small`, 13 minutes of audio, beam size 5, 8 threads on an Intel Core i7-12700K.

| Implementation                | Time  | Speed          | RAM      |
| ----------------------------- | ----- | -------------- | -------- |
| whisper.cpp, fp32             | 2m05s | 6.2x real time | 1,049 MB |
| faster-whisper, int8          | 1m42s | 7.6x real time | 1,477 MB |
| faster-whisper, int8, batch 8 | 51s   | 15x real time  | 3,608 MB |

The whisper.cpp [bench issue](https://github.com/ggml-org/whisper.cpp/issues/89) times the encoder alone on a 30-second window (2022 code): `base` 0.88 s, `small` 2.9 s, `large` 16.9 s on a Ryzen 9 3900X with 8 threads; `base` 30.6 s on a Raspberry Pi 4, slower than real time.

**Estimate for a small server** (an extrapolation, not a primary figure: no benchmark exists for 2 to 4 vCPU cloud instances). Taking a quarter to a half of the desktop throughput above for 4 vCPU:

| Model on 4 vCPU, int8 or q5 | 1 min            | 3 min            | 5 min             | RAM on top of the stack     |
| --------------------------- | ---------------- | ---------------- | ----------------- | --------------------------- |
| `base`                      | about 5 to 10 s  | about 15 to 30 s | about 25 to 50 s  | about 0.4 to 1 GB           |
| `small`                     | about 15 to 30 s | about 45 to 90 s | about 75 to 150 s | about 1 to 1.5 GB           |
| `large-v3-turbo`            | about 1 to 3 min | about 3 to 9 min | about 5 to 15 min | about 1 to 2 GB, unmeasured |

Halve the speed on 2 vCPU. A beam size of 1 and voice activity detection shorten these. To be measured on a real instance before the docs state anything.

- **On CPU, `small` is the realistic ceiling**, and it is markedly weaker than the large models on French (15.0% against 8.3% on Fleurs). `base` is adequate for English only.
- **With a GPU**, `large-v3-turbo` or `large-v3` runs many times faster than real time: faster-whisper measures `large-v2` at 13 minutes in 59 to 63 seconds on an RTX 3070 Ti with 2.9 GB (int8) to 4.5 GB (fp16) of VRAM. No figure is published for turbo.
- **It fits as an optional extra service** in the Compose stack, not inside `app`, which has no ffmpeg. The sidecars above decode the recorded formats themselves.
- **One alternative model is worth a test**: [NVIDIA Parakeet TDT 0.6b v3](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3), 25 European languages with French, "word-level and segment-level timestamps", CC BY 4.0, runnable on CPU through [sherpa-onnx](https://k2-fsa.github.io/sherpa/onnx/pretrained_models/offline-transducer/nemo-transducer-models.html) (622 MB int8 encoder; a real-time factor of 0.028 on a 334-second file with 2 threads, CPU not named). Not suitable: Moonshine (no French), distil-whisper (English only), Voxtral open weights (GPU, 9.5 GB or more).

### A key the instance owner supplies

A setting of three values, base URL, API key and model, in the request shape of OpenAI's `POST /v1/audio/transcriptions` with `response_format=verbose_json` and `timestamp_granularities[]`.

| Target                                                         | Speaks that shape       | Notes                                                                                                                                                                    |
| -------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Groq                                                           | Yes                     | Base URL `https://api.groq.com/openai/v1`; `verbose_json`, word and segment. [Docs](https://console.groq.com/docs/openai)                                                |
| speaches, LocalAI, vLLM                                        | Yes                     | See the table above                                                                                                                                                      |
| whisper-asr-webservice v2                                      | Yes                     | Timestamps UNVERIFIED                                                                                                                                                    |
| DeepInfra                                                      | Yes                     | `verbose_json`, word and segment; base path differs between two of its pages. [Reference](https://docs.deepinfra.com/api-reference/audio/openai-audio-transcriptions.md) |
| Together                                                       | Yes                     | `openai/whisper-large-v3`; timestamp details UNVERIFIED. [Docs](https://docs.together.ai/docs/openai-api-compatibility)                                                  |
| OpenAI                                                         | Yes, without timestamps | Only `whisper-1` returns them, until 2027-02-26                                                                                                                          |
| whisper.cpp server                                             | Partly                  | Path configurable, words nested and per token, ignores `timestamp_granularities[]`                                                                                       |
| Ollama                                                         | Partly                  | WAV only, no granularity                                                                                                                                                 |
| Mistral                                                        | Same path               | Drop-in use with an OpenAI client UNVERIFIED                                                                                                                             |
| Azure OpenAI                                                   | No                      | Deployment path, `api-version` and `api-key`                                                                                                                             |
| Cloudflare Workers AI                                          | No                      | Its [OpenAI-compatible endpoints](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/) cover chat, embeddings and responses only           |
| Deepgram, AssemblyAI, Azure Speech, Google, Amazon, ElevenLabs | No                      | Each has its own API: one adapter each                                                                                                                                   |

- A client written against this shape must read `segments` and tolerate a missing or nested `words` array, since the servers differ on words.
- An instance with no setting has no transcript: the inbox plays the voice without captions, and the agent surface has the steps and the Diagnostic Trail but no words. #499 left self-hosted unspecified; this is the floor.

## Comparison

Vendors that can serve the cloud version, against what the spec needs. "Fits #499" means no training, no retention after processing and a DPA, on self-serve terms.

| Vendor and model                    | Per minute       | Fits #499                                               | EU processing      | Timestamps       | Three formats named | Latency published       | Same shape as self-hosted |
| ----------------------------------- | ---------------- | ------------------------------------------------------- | ------------------ | ---------------- | ------------------- | ----------------------- | ------------------------- |
| Cloudflare `whisper-large-v3-turbo` | 0.000513         | Yes, by default                                         | No                 | Word and segment | No, nothing listed  | No                      | No                        |
| Groq `whisper-large-v3-turbo`       | 0.000667         | Yes, with the zero retention toggle                     | No (United States) | Word and segment | Containers          | Yes, 216x               | Yes                       |
| AssemblyAI Universal-2, EU          | 0.0025           | Partly: audio kept 24 to 48 hours                       | Yes                | Word             | Yes                 | No                      | No                        |
| AssemblyAI Sync STT, EU             | 0.005            | Yes, when opted out (paid plan)                         | Yes                | Word, on request | Yes                 | Bound of 30 s           | No                        |
| Deepgram Nova-3, EU                 | 0.0043 to 0.0052 | Yes, with `mip_opt_out` on every request; DPA to obtain | Yes                | Word             | Yes                 | "a few seconds"         | No                        |
| Azure fast transcription            | 0.006            | Yes, by default; clauses to read                        | Yes                | Word and segment | MP4 not named       | "faster than real-time" | No                        |
| OpenAI `gpt-transcribe`             | 0.0045           | Yes                                                     | On sales approval  | **None**         | Containers          | No                      | Yes, without timestamps   |
| Mistral Voxtral Mini Transcribe 3   | 0.0035           | **No**, while in Public Preview                         | Unclear            | Segment only     | UNVERIFIED          | No                      | Unverified                |
| ElevenLabs Scribe v3                | 0.00333          | **No**, without Enterprise                              | Enterprise only    | Word             | Yes                 | No                      | No                        |
| Amazon Transcribe synchronous       | 0.007            | Only after an AWS Organizations opt-out                 | Yes, after opt-out | Word and segment | Containers          | No                      | No                        |
| Google V2                           | 0.016            | Yes                                                     | Yes                | Word             | Yes                 | No                      | No                        |

## Recommendation

Not a decision. Two candidates, depending on one question the team has to answer first: **must the voice be processed in the EU?** #499 requires three things and none of them is the region; the ticket asks for the region to be checked.

1. **If processing in the United States is acceptable: Groq, `whisper-large-v3-turbo`.**
   - It meets the three requirements on self-serve terms: no training by contract, no retention by default and a zero retention toggle for the remaining error logs, a DPA accepted with the terms.
   - It is the only vendor with a published speed (about 1.4 seconds for five minutes), at 0.67 a month for a fully used agency Plan.
   - Its API is the OpenAI shape, so one client serves the cloud and the self-hosted setting.
   - It names the three containers and returns word and segment timestamps.
   - Against it: data in the United States under SCCs, no documented EU endpoint, a sub-processor list without locations, and Whisper's weak spots (silence, accents).
   - **Cloudflare Workers AI is the close alternative**: cheaper still, no retention and no training with no setting at all, and no new sub-processor since R2 is already Cloudflare. It loses on three unknowns that a one-hour test would settle: which formats it decodes, how long it takes, and its own API shape. It cannot be pinned to the EU either.
2. **If EU processing is required: Deepgram Nova-3 on `api.eu.deepgram.com` with `mip_opt_out=true`.**
   - Requests "are never routed outside the EU", opting out gives "zero data retention", the three recorded formats are named, the call is synchronous, and words are always timed.
   - It costs 4.30 to 5.20 a month for a fully used agency Plan, about 5% of the Plan price.
   - Against it: the DPA is not public and must be obtained and read before anything else; training is on by default and the opt-out rides on every request; account metadata stays in the United States; language detection is off by default and whether it moves the request to the multilingual price is unverified.
   - **AssemblyAI's EU endpoint is the close alternative**: a public DPA, no training on EU traffic, and a lower price. Its async API keeps the audio 24 to 48 hours, which is "the shortest delay offered" rather than deletion at the end of processing; its Sync STT offers no retention but costs 0.005 and is opt-in. **Azure fast transcription** meets every requirement by default in an EU region at 0.006, at the cost of opening an Azure subscription and testing Safari's MP4.

Whichever is chosen, three things follow from the findings:

- **Do not build on OpenAI.** Its only surviving model returns no timestamps.
- **Transcribe the remuxed file**, one per narrated Recording, so that one container reaches the vendor and the segments of a Recording that crossed page loads share one clock.
- **Run one test before the spec locks the vendor**: the same real narration from Chrome, Firefox and Safari, raw and remuxed, in English and French, sent to the two or three finalists, timing the call and reading the transcript. This note found no published accuracy for French or non-native English on any current model and no latency figure except Groq's.

## Not verified

**Across vendors**

- Nothing was measured: latency, accuracy and format acceptance all rest on vendor pages.
- Whether any vendor accepts Chromium's WebM without duration metadata, or the codec inside a container where only the container is named (OpenAI, Groq, Amazon).
- French and non-native English accuracy of any current commercial model.
- Most quotes outside the pages marked _raw_ are fragments returned by a fetch tool, not copies of the raw page.

**Cloudflare Workers AI**

- Accepted containers and codecs, maximum file size and duration for a synchronous call, request timeout, minimum billed duration.
- Any latency figure; the language list and French; where inference runs.
- Whether Deepgram receives the audio for the partner model `nova-3`.

**Groq**

- Any EU endpoint or residency for Whisper; locations of most sub-processors.
- Whether `verbose_json` returns the detected language; a named language list.
- How the speed factor is measured; request timeout; maximum duration.

**Deepgram**

- The DPA text and how it is entered; the Data Privacy Framework status.
- Whether `mip_opt_out` changes the price; what "Promo pricing" means; whether language detection bills at the multilingual rate.
- The total language count for Nova-3; utterance output.

**AssemblyAI**

- The sub-processor list; the clause of the terms that incorporates the DPA.
- Billing increment and minimum; the unit of word timestamps; any async turnaround figure.
- Language detection on Sync STT.

**Azure**

- The DPA body, the transfer mechanism, the sub-processor list, and an explicit no-training clause.
- MP4 or M4A acceptance in fast transcription; the meaning of the "Fast Transcription Promo" and "Enhanced Feature Audio" meters.
- Prices come from the retail prices API, since the pricing page renders placeholders.

**Google**

- That Chirp 2 and Chirp 3 bill at the standard rate; a statement that data stays in the EU on the `eu` endpoint; the language count.

**Amazon**

- What `TranscribeAudio` retains for inline audio and whether the opt-out policy covers it the same way; prices for `eu-central-1`.

**OpenAI**

- Minimum billed duration, latency, request timeout; the language list of `gpt-transcribe`; its release date, hence whether the EU uplift applies; the default processing region.

**ElevenLabs**

- The default retention period and a delete endpoint; whether the training default covers API traffic; pay as you go without a subscription.

**Mistral**

- Accepted formats, file size and duration for the current model; the default retention period; the training default on paid plans.
- Whether transcription is served on `api.eu.mistral.ai` and at what price; when the model leaves Public Preview; the exact model id.

**Gladia and Speechmatics**

- Gladia: how a self-serve account pins the EU, WebM acceptance, the contradiction between its pricing page and compliance hub on training.
- Speechmatics: the DPA, the sub-processor list, the maximum duration, which model covers French.

**Self-hosted**

- Any CPU benchmark on 2 to 4 vCPU, and any CPU benchmark of `large-v3-turbo`: the times in section 5 are extrapolations.
- Memory of `large-v3-turbo` and of quantized models in whisper.cpp; VRAM of `large-v3` and turbo in faster-whisper.
- The formats `whisper-server` decodes natively (read from the source, not stated in its README).
- Timestamps on the OpenAI route of whisper-asr-webservice v2; which Ollama models transcribe; whether the published image tags exist as their READMEs say.
- Drop-in OpenAI client use against Mistral; Together's timestamp options; DeepInfra's base path.
