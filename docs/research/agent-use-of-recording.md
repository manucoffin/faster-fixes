# What an agent can draw from a Recording

Research for [issue 366](https://github.com/manucoffin/faster-fixes/issues/366), part of the map [Recording in the Widget](https://github.com/manucoffin/faster-fixes/issues/362).

**Researched on 2026-11-10.** Model and client capabilities move fast: every figure below is what the cited page said on that date. This note reports facts and ends with a ranking. It does not choose between screen video and DOM replay.

## Question

Given a screen video on one side and a DOM event replay on the other, what can a coding agent connected through MCP actually use to understand and fix a bug?

## Short answer

- No coding agent examined documents passing a video to its model, and neither Claude nor the OpenAI models accept video input at all. Gemini does, and Gemini CLI is the one client whose source has a path for it. MCP has no video content type.
- Every one of those agents accepts text, and the five whose docs or source were read (Claude Code, Codex CLI, Cursor, VS Code Copilot, Gemini CLI) pass `image` content blocks to the model. A Recording reaches an agent as text, as still images, or as both.
- Every vendor that exposes recordings to agents through MCP (Sentry, Jam, Fullstory, Replay.io, PostHog) hands the agent an event timeline in text. Where visuals exist, they are still frames at chosen timestamps. None hands over video.
- An event timeline is cheap from a DOM replay and absent from a screen video unless interactions are captured alongside it. Still frames are cheap from a screen video and expensive from a DOM replay (a headless browser is the only documented route). The two techniques are mirror images on this point.

## How to read this note

- **Verified** means the first-party page or source file was read during this research. Unless marked otherwise, every claim with a URL is verified in that sense.
- Most pages were read through a fetch tool that relays content through a small extraction model. Quotes from Anthropic and AWS pages were read as raw text. Four load-bearing pages were re-read a second time to confirm the quotes: the MCP tools specification, the Claude Code MCP documentation, the Jam MCP documentation and the PostHog engineering post.
- Section 8 lists what could not be verified.
- No experiment was run. Nothing here was tested end to end against this repo's MCP server.

## 1. The agent surface today (repo facts)

- The MCP server is a stdio process on the developer's machine (`packages/mcp/src/index.ts`, `StdioServerTransport`), built on `@modelcontextprotocol/sdk` 1.27.1, whose latest known protocol revision is `2025-11-25`. It exposes four tools: `list_feedbacks`, `list_videos`, `create_feedbacks`, `update_feedback_status`. There is no tool that returns a single Feedback.
- `list_feedbacks` returns **one `text` content block** for the whole list: markdown by default, or the JSON response stringified (`packages/mcp/src/tools/list-feedbacks.ts`). It never returns an `image` block, a `resource_link` or `structuredContent`.
- The Screenshot reaches the agent as a markdown image inside that text, `![Feedback screenshot](<signed URL>)`, preceded by the line "Examine this screenshot for visual context of the reported feedback:" (`apps/web/src/app/_domains/feedback/_helpers/format-feedback-markdown.ts`). The URL is signed for 3600 seconds (`apps/web/src/server/storage/get-signed-asset-url.ts`).
- The Diagnostic Trail holds at most 50 Console Entries and 50 network entries, with messages cut at 2048 bytes (`packages/widget-core/src/constants.ts`). Each entry carries a `timestamp`. The JSON format returns those timestamps; the markdown format drops them (`formatDiagnosticTrailLines` prints level and message, or method, URL, status and duration).
- The Diagnostic Trail recorder patches `console`, `fetch` and `XMLHttpRequest` only (`packages/widget-core/src/diagnostics/recorder.ts`). It records no clicks, inputs or navigations.
- `list_videos` states "The video file itself is never returned." A Feedback on a Video carries a time range and a point or area, never pixels.

Two consequences follow from sections 3 and 4 below and are stated here because they concern the current surface:

1. No client documents fetching a URL that appears in tool result text. An agent sees the Screenshot today only if it decides to download the URL with its shell and open the file with its image reader. Whether agents do this in practice was not tested.
2. The whole Feedback list shares one tool result, so one size budget (25,000 tokens by default in Claude Code, 10,000 tokens of text in Codex) covers every Feedback returned.

## 2. Video as model input

### Which models accept video

| Provider         | Video input                                                                                                                                                                                                                     | Source                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anthropic Claude | No. "All current models support text and image input, text output, multilingual capabilities, vision, and tool use." The vision guide never mentions video, and "Animations are unsupported, and only the first frame is used." | [models overview](https://platform.claude.com/docs/en/about-claude/models/overview.md), [vision](https://platform.claude.com/docs/en/build-with-claude/vision.md) |
| OpenAI           | No documented video input. The flagship model pages state "Input modalities: text, image". The file input guide lists documents, spreadsheets and PDF, no video type.                                                           | [gpt-6-astra](https://developers.openai.com/api/docs/models/gpt-6-astra.md), [file inputs](https://developers.openai.com/api/docs/guides/file-inputs.md)          |
| Google Gemini    | Yes. Gemini 4 Argon lists "Modalities: Text, Image, Audio, Video, PDF".                                                                                                                                                         | [models](https://aistudio.google.com/docs/models.md.txt), [video understanding](https://aistudio.google.com/docs/video-understanding.md.txt)                      |
| Amazon Nova      | Yes. 25 MB embedded or 1 GB through S3, one video per request, frames resized to 672 x 672, 1 FPS, no audio.                                                                                                                    | [Nova 2 user guide](https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-multimodal-models.html)                                                         |
| Qwen (Alibaba)   | Yes, as a video file or a frame list; sampling rate range 0.1 to 10 FPS, default 2.                                                                                                                                             | [Model Studio vision](https://www.alibabacloud.com/help/en/model-studio/vision)                                                                                   |

The OpenAI Realtime API and the Chat Completions reference were not examined. Mistral and xAI document image input only on the pages read.

### Gemini limits

All from the [video understanding page](https://aistudio.google.com/docs/video-understanding.md.txt) unless noted.

- **Formats**: mp4, mpeg, mov, avi, x-flv, mpg, webm, wmv, 3gpp.
- **Duration**: "Models with a 1M context window can process videos up to 3 hours long by default (at low media resolution), or up to 1 hour long at high media resolution."
- **Sampling**: "the model samples the video at a rate of 1 frame per second (FPS)." A custom `fps` can be set. The page warns the default "may miss details in videos with rapid motion or quick scene changes."
- **Tokens**: "Approximately 100 tokens per second of video at default (low) media resolution" and "approximately 300 tokens per second of video at high media resolution." A 2 minute Recording is therefore about 12,000 to 36,000 tokens. High resolution is "Required only when the use case involves reading dense text (OCR) or small details within video frames" ([media resolution](https://aistudio.google.com/docs/media-resolution.md.txt)), which is the case for a UI.
- **Size**: Google's pages disagree. Inline is "< 100MB" in one table and 20 MB in the prose of the same page; the Files API is 2 GB per file. External HTTPS or signed URLs are fetched by Google, "Each file can be up to 15 MB" ([file input methods](https://aistudio.google.com/docs/file-input-methods.md.txt)).
- Google's pages also disagree on per-frame tokens (66 and 258, or 70 and 280, or 263 per second depending on the page).

### What coding agents can do with a video

- **Claude Code**: no documented video input. The Read tool handles images, PDFs and notebooks ([tools reference](https://code.claude.com/docs/en/tools-reference.md)).
- **Codex CLI**: none. The `InputModality` enum is `Text, Image, Audio` ([openai/codex](https://github.com/openai/codex), `codex-rs/protocol/src/models.rs`).
- **Cursor, VS Code Copilot**: none documented.
- **Gemini CLI**: the only client examined with a code path that sends a video file to the model. `read_file` is documented as "Supports text, images, audio, and PDF"; the source (`fileUtils.ts`) also has a `video` case returning inline data, with a 20 MB file limit. An embedded resource blob in an MCP result is passed as inline data with its own mime type, with no mime filter in that function ([google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli), `packages/core/src/tools/mcp-tool.ts`). This is source behaviour, not a documented feature.

## 3. MCP mechanics

### What the specification allows

Latest revision: `2026-07-28` ([tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md), [schema](https://modelcontextprotocol.io/specification/2026-07-28/schema.md)).

- A tool result holds `content`, an array of exactly five block types: `text`, `image` (base64 `data` plus `mimeType`), `audio`, `resource_link` (a `uri` with optional `mimeType` and `size`) and `resource` (an embedded text or base64 blob). It may also hold `structuredContent`.
- **There is no video content type.** The word "video" does not appear in the schema. A video could legally travel as an embedded resource blob, because the blob's `mimeType` is unconstrained, but the spec leaves handling to the client: "It is up to the client how best to render embedded resources for the benefit of the LLM and/or the user."
- **The spec defines no size limit** on tool results or content blocks. Limits are set by each client.
- A resource link is something "that can be subscribed to or fetched by the client". Nothing obliges a client to fetch it. For an `https://` URI, "clients may fetch the resource directly from the web" ([resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources.md)).
- The spec has no provision for anyone fetching a URL that appears inside a `text` block.
- Every block accepts `annotations`: `audience` (`user`, `assistant`) and `priority` (0 to 1).
- "For backwards compatibility, a tool that returns structured content SHOULD also return the serialized JSON in a TextContent block."
- MCP Apps (extension `io.modelcontextprotocol/ui`) lets a tool point at an HTML resource rendered in a sandboxed iframe, described as "Interactive UI elements (charts, forms, video players) rendered inline within conversations" ([overview](https://modelcontextprotocol.io/extensions/apps/overview.md)). It is a surface for the human, not model input. The community-maintained [client matrix](https://modelcontextprotocol.io/extensions/client-matrix.md) lists it for Claude web, Claude Desktop, VS Code Copilot, ChatGPT and Cursor, not for Claude Code.

### What each client does with a tool result

| Client          | `image` block                                                                                  | `resource_link` and embedded resource                                                                                                 | Text size limit and overflow                                                                                                  | `structuredContent`                                                             |
| --------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Claude Code     | Shown to the model inline; original bytes also saved to a file whose path the model receives   | `resource_link` "now supported" since 1.0.44 (changelog only, behaviour undocumented); PDFs, Office files and audio are saved to disk | Warning at 10,000 tokens, default cap 25,000 tokens (`MAX_MCP_OUTPUT_TOKENS`); text over 50,000 characters is saved to a file | Supported since 2.0.21                                                          |
| Codex CLI       | Sent to the model as an image                                                                  | Serialized as JSON text, links not fetched                                                                                            | 10,000 tokens times 1.2, truncated in place; images are kept and not charged to that budget                                   | **Replaces `content`**: when present, text and images in `content` are not sent |
| Cursor          | "Cursor attaches returned images to the chat. If the model supports images, it analyzes them." | Not documented                                                                                                                        | Written to a file the agent can read; no threshold published                                                                  | Forum report: the model effectively gets the text `content` channel only        |
| VS Code Copilot | Inlined after a resize                                                                         | An image `resource_link` is read by VS Code itself and inlined; other links become references                                         | Not documented                                                                                                                | Text blocks are dropped in favour of the JSON; images still sent                |
| Gemini CLI      | Sent as inline data                                                                            | Embedded blob sent as inline data; `resource_link` becomes a line of text, not fetched                                                | 40,000 characters by default, unclear whether it applies to MCP                                                               | Not examined                                                                    |

Sources: Claude Code [MCP docs](https://code.claude.com/docs/en/mcp.md) and [changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md); Codex [config reference](https://developers.openai.com/codex/config-reference.md) and source (`codex-rs/protocol/src/models.rs`, `codex-rs/core/src/mcp_tool_call.rs`); Cursor [MCP docs](https://cursor.com/docs/mcp.md), [dynamic context discovery](https://cursor.com/blog/dynamic-context-discovery) and [forum thread](https://forum.cursor.com/t/mcp-tool-results-containing-only-structuredcontent-are-silently-dropped/167346); VS Code source ([`mcpLanguageModelToolContribution.ts`](https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/mcp/common/mcpLanguageModelToolContribution.ts)); Gemini CLI [MCP docs](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md) and source.

Details that weigh on the design:

- **Claude Code and images.** "When an MCP tool returns a PNG, JPEG, GIF, or WebP image, Claude sees the image inline in the conversation. The inline copy may be scaled down or compressed to fit the model's image size limits." And "Tools that return image data are still subject to `MAX_MCP_OUTPUT_TOKENS`". A server can raise the text threshold per tool with `_meta["anthropic/maxResultSizeChars"]`, "up to a hard ceiling of 500,000 characters"; that does not lift the token cap for images.
- **Codex and `structuredContent`.** Returning `structuredContent` next to image blocks loses the images in Codex. The test in the Codex source uses a content text of `"ignored"`.
- **VS Code honours `audience`.** A block annotated for `user` only goes to the UI and not to the model.
- **A URL in text is inert.** In Claude Code the documented way to see an image behind a URL is explicit: download it (Bash `curl`, or WebFetch, which saves binary responses to disk), then open the file with Read, which returns PNG, JPEG, GIF and WebP "as visual content that Claude can see". Codex has `view_image`, which takes a local path only. Cursor's file reader accepts image files. None fetches a link on its own.
- **Model API bounds.** An Anthropic `tool_result` may contain `text`, `image`, `document` or `search_result` blocks ([handle tool calls](https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls)). An OpenAI `function_call_output` may be "an array of image or file objects instead of a string" ([function calling](https://developers.openai.com/api/docs/guides/function-calling)). Neither has an audio or video block for tool results.

### What changes for a time-based artifact

- A signed URL in markdown works for a Screenshot only because an image is one file an agent can download and open. A video behind the same kind of URL gives Claude Code, Codex and Cursor nothing their model can read.
- Still frames returned as `image` blocks need no fetch and do not expire, unlike the 1 hour signed URL.
- Frames in a list-shaped result multiply by the number of Feedback returned. At about 1,200 tokens per frame (section 4), eight frames for each of three Feedback already exceed Claude Code's default 25,000 token cap.

## 4. Still frames

### Token cost of one frame

| Model family         | Rule                                                                                                                                                                                        | 1280 x 720 frame                                  | Source                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Claude               | 28 x 28 pixel patches: "`⌈width / 28⌉ × ⌈height / 28⌉` visual tokens". Cap of 4,784 tokens and 2,576 px long edge on "Claude 4.7 and later models", 1,568 tokens and 1,568 px on the others | 46 x 26 = 1,196 tokens                            | [vision](https://platform.claude.com/docs/en/build-with-claude/vision.md)           |
| OpenAI (gpt-6-astra) | 32 x 32 pixel patches times a 1.2 multiplier; `low` detail fits within 512 x 512                                                                                                            | 40 x 23 x 1.2 = 1,104 tokens; 173 at `low`        | [images and vision](https://developers.openai.com/api/docs/guides/images-vision.md) |
| Gemini 4 and 3       | Fixed by media resolution, independent of pixel size                                                                                                                                        | About 1,120 at default, 560 at medium, 280 at low | [media resolution](https://aistudio.google.com/docs/media-resolution.md.txt)        |

For scale: one frame per second over a 2 minute Recording is 120 frames, about 143,000 tokens on Claude. Eight frames are about 9,600 tokens. The image token rules for `gpt-6.1-sol`, `gpt-6.1-terra` and `gpt-6-luna` are not on the OpenAI page.

Request limits on Claude: 600 images per request (100 on 200k-context models), 10 MB per image in base64, and above 20 images a stricter per-image dimension limit applies, counting "images nested inside `tool_result` content" ([vision](https://platform.claude.com/docs/en/build-with-claude/vision.md)).

### How many frames are useful

No first-party source measures or prescribes a frame count for UI recordings, and none compares frames taken at interaction moments against fixed-rate sampling. What exists is practice:

- **Jam** gives its agent an overview grid, "frames evenly spaced across the whole video, stitched into a labeled grid where each cell shows its timestamp", where "The frame count scales with the video's length (six for short clips up to 16 for long ones)." The agent then asks for frames at exact millisecond timestamps or evenly across a window, with a `size` knob "to trade detail against your agent's context budget" ([Jam MCP](https://jam.dev/docs/debug-a-jam/mcp)).
- **PostHog** renders replays sped up: "We render videos at 8-10x - 1 frame per second is usually enough for LLM to understand the context well." It skips idle time, "at least 40–60% is usually inactivity we can skip", and cuts clips around moments found in the events: "But we still need events or snapshots to identify those moments." ([PostHog engineering, 2025-12-03](https://posthog.com/blog/multi-modal-llm-user-behavior-analysis)).
- **Fullstory and Replay.io** expose a screenshot at a timestamp the agent chooses, next to an event transcript, not a stream of frames ([Fullstory](https://developer.fullstory.com/mcp/tools-reference/), [Replay.io](https://docs.replay.io/basics/replay-mcp/tools)).
- **Model vendors.** Anthropic: "You can also use these models to analyze videos by breaking them up into frames", with no count given ([prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md)). OpenAI's only frame guidance is in archived cookbook recipes (one frame every 1 to 2 seconds, or every 25th frame).

Legibility is the limit on packing many frames into one image. Anthropic: "If the image contains important text, make sure it's legible and not too small", resizing "might, for example, make text less legible", and "heavy JPEG compression can make text difficult to read." A contact sheet buys an overview at the price of readable UI text.

### Where extraction can run

The repo has no server-side media processing. The places a frame can be produced without one:

**From a screen video**

- **In a browser**, by drawing a video element to a canvas. `drawImage()` accepts an `HTMLVideoElement` once the seek has completed ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)). This is how the Poster of a Video is taken today (`apps/web/src/app/(authenticated)/(project)/videos/_features/capture-video-poster.ts`).
- **Seeking is unreliable on a MediaRecorder file.** Chromium documents "The produced recording doesn't have duration or is not seekable" as "by design of the webm live format", with the alternative "to use a Javascript library to reconstruct the Cues" ([Chromium MediaRecorder README](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/mediarecorder/README.md)). Frames grabbed while the stream is live avoid the seek; frames taken afterwards from the file do not.
- **Formats differ per browser.** Safari recorded MP4 with H.264 only until 18.4, which added WebM with VP8 or VP9 ([WebKit 2020](https://webkit.org/blog/11353/mediarecorder-api/), [Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/)).
- **WebCodecs** `VideoDecoder` is "Limited availability": Chrome 94, Firefox 130 on desktop, not Firefox for Android, Safari 16.4 with partial support until 26.0 ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/VideoDecoder), [caniuse](https://caniuse.com/webcodecs)).

**From a DOM replay**

- The only documented route is a headless browser. rrweb's own `rrvideo` launches Playwright's Chromium, plays the events in `rrweb-player` and records the page ([rrvideo source](https://raw.githubusercontent.com/rrweb-io/rrweb/master/packages/rrvideo/src/index.ts)). It needs Node and a Chromium binary.
- PostHog renders replay exports server side. Its docs say "Videos render in the background and usually take a few minutes" ([sharing](https://posthog.com/docs/session-replay/sharing)); a PostHog issue states "Browser-side can only capture the frame currently on screen" and that replay exports were settled server side ([issue 90850](https://github.com/PostHog/posthog/issues/90850)); an unmerged PR describes a "heavy Chromium and ffmpeg rasterizer image" ([PR 92592](https://github.com/PostHog/posthog/pull/92592)).
- Sentry does not export replays as video. The request, open since 2023, was closed as not planned on 2026-03-29, and a Sentry member pointed to `rrvideo` ([issue 44919](https://github.com/getsentry/sentry/issues/44919)).
- Jam returns nothing visual for its DOM replays: "The video tools (`getVideoTranscript`, `getVideoChapters`, and `getFrames`) and `getScreenshots` return nothing for Instant Replay Jams." ([Jam MCP](https://jam.dev/docs/debug-a-jam/mcp)).
- No first-party source describes rasterising a replay inside a viewer's browser with a DOM-to-image library.

**Candidate places in this repo**, as reasoning from the above and not as sourced facts:

- The Reviewer's browser at capture time, for either technique: the Widget already rasterises the page for the Screenshot with `modern-screenshot`, and a live video stream can be drawn to a canvas.
- The User's browser at inbox playback: requires a human to open the Feedback before an agent can have frames.
- The developer's machine, in the MCP server: Node has no built-in video decoder, so this means depending on an `ffmpeg` binary or a headless Chromium there.

## 5. Event-derived text

### What a DOM event stream contains (rrweb)

- Interaction events exist as first-class records: `MouseInteraction` (`Click`, `DblClick`, `Focus`, `Blur`, touch events), `Input`, `Scroll`, `ViewportResize`, `MediaInteraction`, plus `Meta` events that carry the URL ([rrweb types](https://raw.githubusercontent.com/rrweb-io/rrweb/master/packages/types/src/index.ts)).
- **They reference numeric node ids, not selectors**: "only the `id` needs to be recorded to find the corresponding DOM node during replay" ([serialization](https://raw.githubusercontent.com/rrweb-io/rrweb/master/docs/serialization.md)). A selector or a text label has to be derived by resolving the id against the snapshot, or captured separately at event time.
- Console and network are plugins. The network plugin records `fetch` and `XMLHttpRequest` "by patching their object & methods", with headers and bodies off by default ([console recipe](https://raw.githubusercontent.com/rrweb-io/rrweb/master/docs/recipes/console.md), [network recipe](https://raw.githubusercontent.com/rrweb-io/rrweb/master/docs/recipes/network.md)).
- Masking is configurable (`maskAllInputs`, `maskTextSelector`, `blockClass` and others, [guide](https://raw.githubusercontent.com/rrweb-io/rrweb/master/guide.md)). Masked values are absent from any derived timeline.
- rrweb documents no payload sizes, only that "rrweb may record an unexpected amount of data" ([optimize storage](https://raw.githubusercontent.com/rrweb-io/rrweb/master/docs/recipes/optimize-storage.md)). PostHog: "a single session with all metadata could easily exceed 1 million tokens." The raw stream is not agent input.

### Prior art

**Sentry**

- The SDK resolves the selector and text at capture time. A click breadcrumb's message is `htmlTreeAsString(target, …)`, a selector-like string, and its data keeps the rrweb `nodeId` plus `tagName`, `textContent` and `attributes` ([handleDom.ts](https://raw.githubusercontent.com/getsentry/sentry-javascript/develop/packages/replay-internal/src/coreHandlers/handleDom.ts)).
- The AI summary reads plain text lines: `"User clicked on {target} {when}"`, `"User navigated to: {to} {when}"`, `"Logged: '{message}' {when}"`. Network lines are kept for failures only. DOM mutations, canvas and memory records produce no line. No snapshot content and no video are used ([summarize.py](https://raw.githubusercontent.com/getsentry/sentry/master/src/sentry/replays/usecases/summarize.py)). The product describes chapters that summarize "related sets of breadcrumbs, network requests, and console logs, ordered by time range" ([replay details](https://docs.sentry.io/product/explore/session-replay/replay-details/)).
- The Sentry MCP tool `get_replay_details` returns a timeline whose events each have "`offsetSeconds` (to 0.1s), `label`, `target`, and `details`"; "raw recording payloads (request and response bodies, headers, console arguments) are left out." By default it shows "navigations, clicks with their text, dead and rage clicks, inputs and key presses", limited to 50 events, 200 at most ([PR 2019](https://github.com/getsentry/toolkit/pull/2019), [PR 1806](https://github.com/getsentry/toolkit/pull/1806), both merged in November 2026). No video, no screenshot.

**Jam**

- A Jam is either a screen video or an Instant Replay: "Instant Replay is a DOM session replay, not a video recording of your screen", a rolling buffer of up to 2 minutes ([Instant Replay](https://jam.dev/docs/record-a-jam/instant-replay)). Both carry console, network and user events ([what is in a Jam](https://jam.dev/docs/whats-in-a-jam)).
- The MCP gives the agent `getUserEvents` ("Read each click, input, and page navigation change in plain language."), `getEvents` ("Read network, console, and user events together in time order"), `getConsoleLogs`, `getNetworkRequests`, and for video Jams `getFrames`, `getVideoTranscript` (speech as WebVTT) and `getVideoChapters` ([Jam MCP](https://jam.dev/docs/debug-a-jam/mcp)). There is no tool that analyses or returns the video.
- AI titles and reproduction steps exist "only for video Jams" and the data is "shared with Google's Gemini AI model" ([Jam AI](https://jam.dev/docs/jam-ai)). The page does not say whether captured events also feed the model.

**PostHog**

- First generation, described in the engineering post: summarize from events, then check flagged moments on roughly 10 second video clips. One of its headings: "Video explains the issue, but not the reason". Events alone misled the model too: "LLMs see this, panic, and hallucinate a summary of the session in which the user completely failed on all their goals." ([post](https://posthog.com/blog/multi-modal-llm-user-behavior-analysis)).
- Current product (Replay Vision): it "Renders the recording to a sped-up video (inactive periods are trimmed out)", "Sends that video to a Google Gemini model, which watches it and then asks for the session's events" around the moments that matter ([docs](https://posthog.com/docs/session-replay/session-summaries-ai)). The in-player summary moved to this path in September 2026 ([PR 103629](https://github.com/PostHog/posthog/pull/103629)).
- Both generations pair video with events. Both need a server-side render and a third-party video model.
- The PostHog MCP exposes recording metadata, console logs and the Vision scanners. No tool is named for raw snapshots or for video ([tools](https://posthog.com/docs/model-context-protocol/tools.md)).

**Others, one line each**

- Fullstory: `get_session_events` ("a complete, chronological transcript of all events in a session") and `review-snapshot` (a screenshot, the component tree, or both, at a timestamp) ([tools](https://developer.fullstory.com/mcp/tools-reference/)).
- Replay.io: `UserInteractions`, `ConsoleMessages`, `NetworkRequest` and `Screenshot` at a timestamp ([tools](https://docs.replay.io/basics/replay-mcp/tools)).
- LogRocket: `get_network_entries` returns a HAR document; the session tools' return format is undocumented ([docs](https://docs.logrocket.com/docs/mcp)).
- OpenReplay: an MCP App for the human, "Replays render in an embedded player inside the chat" ([docs](https://docs.openreplay.com/en/mcp/capabilities/)).
- Marker.io, Userback, BugHerd: screenshots, console and network logs; no replay or video tool documented ([Marker.io](https://marker.io/marker-mcp), [Userback](https://docs.userback.io/docs/userback-mcp), [BugHerd](https://support.bugherd.com/en/articles/14835206-getting-started-with-the-bugherd-mcp-server)).
- Loom: the bug report workflow generates "a short description, steps to reproduce, and a link to your video", and AI workflows do not generate if "The video has no speech" ([Loom AI workflows](https://support.atlassian.com/loom/docs/use-ai-workflows/)).

### What the prior art has in common

- The agent-facing form is a time-ordered text log of user actions, merged or mergeable with console and network on one clock, with offsets from the start of the recording.
- Each action carries a human label (element text) and a target (selector). Sentry captures both at event time instead of reconstructing them later.
- Noise is filtered before the agent sees it: successful requests, mutations, mouse moves and resource loads are left out by default.
- Steps derived from a screen video alone come from a video model (Jam with Gemini) or from speech (Loom). No vendor documents deriving them from pixels without one of those.
- Jam and Loom capture events and logs alongside the video. The timeline does not come from the video.

## 6. From repro to action

- **Chrome DevTools Recorder** defines a step format worth knowing: `UserFlow { title, steps }`, where a step has a `type` (`navigate`, `click`, `change` and others), a `selectors` array offering several alternatives per element, and click offsets ([Schema.ts](https://raw.githubusercontent.com/puppeteer/replay/main/src/Schema.ts)). Selector priority is ARIA first, then test attributes, id, CSS, XPath and text. It exports JSON, `@puppeteer/replay` and Puppeteer scripts; Chrome's page names no Playwright exporter ([reference](https://developer.chrome.com/docs/devtools/recorder/reference)).
- **Playwright codegen** picks "the best locator, prioritizing role, text and test id locators" ([codegen](https://playwright.dev/docs/codegen)). A recorded CSS path is the weakest input for it.
- **Agents can already drive a browser.** Playwright MCP "Uses Playwright's accessibility tree, not pixel-based input" and offers `browser_generate_locator` ([README](https://raw.githubusercontent.com/microsoft/playwright-mcp/main/README.md)). Playwright Test Agents turn a markdown plan into tests, and the generator "verifies selectors and assertions live as it performs the scenarios" ([test agents](https://playwright.dev/docs/test-agents)). A step list in prose is a valid input for both.
- **Replay to test.** OpenReplay is the one vendor found that documents generating Cypress, Playwright or Puppeteer code from a recorded session; its examples use raw CSS such as `a:nth-of-type(9)` ([docs](https://docs.openreplay.com/en/session-replay/generate-e2e-test)). PostHog has only an open feature request from July 2025 with no team reply ([issue 34381](https://github.com/PostHog/posthog/issues/34381)). Nothing was found for Sentry.
- **Adjacent products.** Meticulous replays recorded interactions against recorded backend responses and diffs screenshots; it does not emit test code ([how it works](https://www.meticulous.ai/how-it-works)). QA Wolf records a live session and has an agent replay the step list before writing code ([blog, 2026-10-29](https://www.qawolf.com/blog/how-qa-wolf-turns-a-recording-into-a-real-test)).
- **From video.** No tool was found whose first-party docs say it derives a runnable script from video frames alone.
- **Limits visible in the sources.** Masked inputs leave holes in any regenerated script. A replayed flow depends on server state and authentication that the events do not carry, which is why Meticulous records and replays backend responses.

## 7. Ranking of forms, most to least actionable

This ranking is a synthesis of the facts above. "Actionable" means: a coding agent in Claude Code, Cursor or Codex can read it today through MCP and move toward a fix. Cost is what this repo would have to build or run to produce it.

| Rank | Form                                                                                                                                                 | Why it ranks here                                                                                                                                                                                                  | Cost to produce                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | **Step timeline in text**: navigations, clicks with selector and label, inputs, errors, merged with Console Entries and network entries on one clock | Read by every client. A few hundred to a few thousand tokens. It is the form every vendor gives its agent, and the input Playwright tooling takes. It also fits a Tracker Issue body                               | **DOM replay**: a transform over the event stream, with node ids resolved to selectors and labels; pure code, no media processing. **Screen video**: nothing to derive it from, so interactions must be captured by the Widget alongside the video, as Jam and Loom do. Either way the Diagnostic Trail needs a shared clock (its timestamps exist but the markdown drops them) and a longer window than 50 entries may be needed |
| 2    | **Key frames as images**, each anchored to a timeline step                                                                                           | Read by every client examined when sent as `image` blocks. About 1,100 to 1,200 tokens per 720p frame. Shows what text cannot: layout, visual glitches, wrong state. Useless as a video substitute without anchors | **Screen video**: canvas extraction in a browser; cheapest while the stream is live, unreliable by seeking a MediaRecorder file. **DOM replay**: a headless browser (server or developer machine), or capture-time rasterisation in the Widget. Both: a result shape that carries images, sized per Feedback and not per list; no `structuredContent` next to the images (Codex)                                                  |
| 3    | **Narration transcript**, if voice is recorded                                                                                                       | Text, cheap to read, carries intent ("I expected the total to update"). Jam exposes it as WebVTT with timestamps                                                                                                   | A speech-to-text step, which is a third-party service or a model to host. Nothing without voice                                                                                                                                                                                                                                                                                                                                   |
| 4    | **Generated reproduction script** (Playwright)                                                                                                       | The agent can run it to reproduce and to verify the fix. A derivative of form 1, and an agent with Playwright tooling can write it from form 1 itself, verifying selectors live                                    | Form 1 with role, text and test id locators instead of CSS paths; masked inputs, authentication and server state remain unsolved. One vendor documents it                                                                                                                                                                                                                                                                         |
| 5    | **Raw DOM event stream** as a file or resource                                                                                                       | Complete, but far too large to read (PostHog: over 1 million tokens with metadata) and replayable only with a browser the agent must set up                                                                        | Nothing beyond storage. Exists only with DOM replay                                                                                                                                                                                                                                                                                                                                                                               |
| 6    | **Raw video file** by URL or as an embedded blob                                                                                                     | Unreadable by Claude and OpenAI models. Among the clients examined, only Gemini CLI has a code path for it, capped at 20 MB. MCP has no video type. A 2 minute clip costs Gemini about 12,000 to 36,000 tokens     | Nothing beyond storage. Exists only with screen video                                                                                                                                                                                                                                                                                                                                                                             |
| 7    | **Link to the inbox player**                                                                                                                         | For the human. No agent can watch it                                                                                                                                                                               | Nothing                                                                                                                                                                                                                                                                                                                                                                                                                           |

## 8. Not verified

- Whether coding agents, in practice, fetch the Screenshot URL from today's `list_feedbacks` output. No test was run.
- Claude Code: whether a `resource_link` is read automatically; what happens to a result over the limit that contains images; how image tokens are counted against `MAX_MCP_OUTPUT_TOKENS`.
- Cursor: handling of `resource_link`, embedded resources and audio; any numeric output threshold. Closed source.
- VS Code Copilot: what the chat extension does with non-image data parts.
- OpenAI: whether the API fetches image URLs server side; image token rules for the gpt-6.1 models; video in the Realtime API.
- Gemini: the conflicting per-frame token figures and inline size limits were reported as written and not resolved.
- Jam: whether captured events feed the AI reproduction steps, or only the video.
- PostHog: the return shape of `session-recording-get`; the rasteriser architecture rests on an issue and an unmerged PR.
- Whether an rrweb replay can be rasterised in a viewer's browser with acceptable fidelity. No first-party source addresses it beyond one PostHog issue comment.
- Firefox's default MediaRecorder container and codec; the status of Chromium bug 642012.
- Any measured recommendation on frame count or sampling for UI recordings. None was found.
- Community projects converting rrweb or PostHog sessions to Playwright tests, and the BrowserStack Bug Capture MCP: seen in search snippets only.
- Windsurf and Cline: handling of images and limits in MCP results.
