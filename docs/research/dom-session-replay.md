# DOM session replay capabilities

> Research for [#365](https://github.com/manucoffin/faster-fixes/issues/365), part of the map [#362 Recording in the Widget](https://github.com/manucoffin/faster-fixes/issues/362). It answers one question: what does recording the page as DOM events (rrweb and its alternatives) give and cost, for a Widget embedded on third-party sites? It does not choose between screen video and DOM replay.

- **Date of the checks**: 2026-11-10. Versions, release dates and sizes were read that day from npm, GitHub and the published tarballs.
- **Vocabulary**: Widget, Embed, Reviewer, Feedback, Screenshot, Diagnostic Trail and Ring Buffer are used as defined in `CONTEXT.md`. **Recording** is the map's working term for the new concept.
- **How to read the evidence**: every claim carries its source. Three kinds of evidence are used and labelled:
  - **[doc]** a statement in first-party documentation,
  - **[src]** read in the published source or package,
  - **[measured]** measured for this research (method in [Appendix A](#appendix-a-measurement-method)). Measurements are single runs on one machine. They give an order of magnitude, not a benchmark.
- Anything inferred rather than read is marked **inference**. What could not be verified is listed in [Not verified](#not-verified).

## Summary

- **One real candidate**: rrweb (MIT). It reached a stable 2.0.0 on 2026-06-01 after almost four years of alphas and has shipped 13 stable releases since (2.2.2 on 2026-11-09). Two maintainers write most commits. Every large adopter checked (Sentry, PostHog, Amplitude, Mixpanel, Highlight) runs its own fork, and both Sentry and PostHog tell outsiders not to use theirs.
- **Weight**: the recorder alone is 24 KB gzipped (78 KB minified). The published Widget is 32 KB gzipped today, so the recorder would add about 75 % if bundled, or nothing to the first load if lazy-loaded. The player is a dashboard-only cost: 88 KB gzipped for the replayer, 101 KB with the stock UI.
- **What a Recording is**: a JSON event stream. A full DOM snapshot plus the stylesheet rules, then mutations, pointer, scroll and input events. It is not pixels. Canvas, video frames, third-party iframes and anything the browser draws outside the DOM are absent unless extra work is done.
- **Payload**: on five public pages, 60 seconds weighed 16 KB to 633 KB gzipped. The full snapshot dominates (12 KB to 629 KB gzipped); the activity itself was 4 KB to 66 KB gzipped per minute.
- **Retroactive capture** is a documented pattern (periodic full snapshots, keep the last one or two segments) and is what Sentry ships as "buffer mode". The buffer lives in memory and dies with the page: nothing documented or shipped keeps a not-yet-uploaded buffer across a full page load.
- **Playback durability** is the weakest point. Images, fonts and media are fetched from the customer's site when the replay is watched. A replay of a staging site that has since been redeployed, is behind auth, or does not send CORS headers for fonts degrades. rrweb's asset capture API (`captureAssets`) has not landed.
- **Video or stills** require a headless Chromium on the server. rrweb's own tool plays the replay in real time and records WebM. PostHog built a dedicated worker (Chromium pool, Temporal, S3) and does not ship it in its self-hosted compose file.
- **For an agent**, the stream is already text: URL, viewport, typed values, clicks with coordinates and node ids, DOM text, timings. It carries no CSS selectors and no SPA navigation events; both have to be added by the recorder's host code or derived by replaying the node map.

## 1. Candidates

### rrweb (upstream)

| Fact                | Value                                                                                                                                                                  | Source                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| License             | MIT                                                                                                                                                                    | [LICENSE](https://github.com/rrweb-io/rrweb/blob/main/LICENSE)                                                                          |
| Latest release      | 2.2.2, published 2026-11-09                                                                                                                                            | [npm `rrweb`](https://www.npmjs.com/package/rrweb), [releases](https://github.com/rrweb-io/rrweb/releases)                              |
| Stable 2.x          | 2.0.0 on 2026-06-01. Before that: 2.0.0-alpha.3 (2022-09) to 2.0.0-alpha.20 (2026-02-03), with no npm release between alpha.18 (2024-12-06) and alpha.20               | npm registry `time` field                                                                                                               |
| Cadence since 2.0.0 | 13 stable releases in a little over 5 months (2.0.0, 2.0.1, 2.1.0 to 2.1.7, 2.2.0 to 2.2.2)                                                                            | npm registry `time` field                                                                                                               |
| Activity            | Last push 2026-11-09. About 108 commits in the last 12 months: 52 by Justin Halsall, 20 by Eoghan Murray, the rest spread over bots and occasional contributors        | GitHub API, `repos/rrweb-io/rrweb/commits`                                                                                              |
| Repository          | 20.4k stars, 436 open issues and pull requests                                                                                                                         | GitHub API                                                                                                                              |
| Governance          | "a community run project". Sponsors through Open Collective. The maintainers also run **rrweb Cloud**, a hosted commercial backend advertised at the top of the README | [SECURITY.md](https://github.com/rrweb-io/rrweb/blob/main/SECURITY.md), [README](https://github.com/rrweb-io/rrweb/blob/main/README.md) |
| Security advisories | One published: GHSA-xjgr-f74v-fx5m (medium, 2026-09-08), in the canvas WebRTC plugin                                                                                   | GitHub API, `repos/rrweb-io/rrweb/security-advisories`                                                                                  |
| Packaging           | `rrweb` (the all-in-one package) is deprecated. The guide recommends `@rrweb/record` on recorded pages and `@rrweb/replay` or `rrweb-player` on replay pages           | [guide.md](https://github.com/rrweb-io/rrweb/blob/main/guide.md)                                                                        |
| Browser support     | No IE11. Depends on `MutationObserver`                                                                                                                                 | [guide.md](https://github.com/rrweb-io/rrweb/blob/main/guide.md)                                                                        |

### The forks

| Fork                | State                                                                                                                                                                                                                                                                                                                                                                                                                            | Source                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Sentry              | `getsentry/rrweb`, branch `sentry-v2`, MIT. Publishes `@sentry/rrweb` 2.45.0 (2026-10-28), formerly `@sentry-internal/rrweb` (last 2.43.0, 2026-05-12). Its README lists the divergences: `hooks` and `plugins` removed, build flags to drop iframe, canvas and shadow DOM recording for bundle size, canvas off unless a canvas manager is passed. Stated purpose: "release Sentry-internal packages with our patches included" | [getsentry/rrweb README](https://github.com/getsentry/rrweb#readme), npm              |
| PostHog             | `PostHog/posthog-rrweb` was archived on 2026-05-07; the code is "now inlined into the posthog-js repo" (`packages/rrweb`). Last npm release of `@posthog/rrweb`: 0.0.60 (2026-04-24). The README says: "please don't use it yourself [...] we won't make any effort to support anybody else using this"                                                                                                                          | [PostHog/posthog-rrweb README](https://github.com/PostHog/posthog-rrweb#readme)       |
| Amplitude, Mixpanel | `@amplitude/rrweb` 2.1.6 (2026-11-05), `@mixpanel/rrweb` 2.0.0-alpha.18.6 (2026-08-06). Both MIT                                                                                                                                                                                                                                                                                                                                 | npm                                                                                   |
| Highlight           | `@highlight-run/rrweb` 2.0.0-lambda.9 (2026-08-19). Highlight announced it would deprecate its hosted service on 2026-02-28 after joining LaunchDarkly                                                                                                                                                                                                                                                                           | npm, [Highlight migration post](https://www.highlight.io/blog/launchdarkly-migration) |

Reading: the forks exist because each vendor needed patches faster than upstream shipped them during the long alpha. None is offered as a library for third parties. Upstream is the only one meant to be consumed.

### Alternatives that are not rrweb

| Library             | State                                                                                                                                                                                                                                                                    | Source                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Microsoft Clarity   | `clarity-js` 0.8.77 (2026-11-06), MIT. The repo also holds `clarity-decode` (server-side decoder) and `clarity-visualize` (replay). Described as "a behavioral analytics library"; it is the code behind the hosted Clarity service. No open-source backend is published | [microsoft/clarity](https://github.com/microsoft/clarity#readme)                      |
| OpenReplay tracker  | `@openreplay/tracker` 19.1.2 (2026-11-06), MIT on npm. The monorepo defaults to AGPL-3.0, with MIT directories and a separately licensed `ee/` folder. It is the tracker of the OpenReplay platform                                                                      | [openreplay LICENSE](https://github.com/openreplay/openreplay/blob/main/LICENSE), npm |
| Datadog Browser SDK | Apache-2.0, own recorder, part of the Datadog RUM SDK (`@datadog/browser-rum` 7.17.1)                                                                                                                                                                                    | [DataDog/browser-sdk](https://github.com/DataDog/browser-sdk), npm                    |

None of the three is documented as a standalone record-and-replay library with a storage-agnostic event format the way rrweb is. Whether their recorder and player can be used without their backend was not tested (see [Not verified](#not-verified)).

## 2. Weight

### Bundle sizes

Sizes of the published minified files, gzip level 9. **[measured]** from the npm tarballs; the bundlephobia figure is given where it exists as a cross-check.

| Artifact                                           | Where it runs               | Minified | Gzipped  | Bundlephobia (min / gzip) |
| -------------------------------------------------- | --------------------------- | -------- | -------- | ------------------------- |
| `@rrweb/record` 2.2.2 (`record.umd.min.cjs`)       | host page                   | 77.8 KB  | 24.1 KB  | 73.4 KB / 22.6 KB         |
| `@rrweb/packer` 2.2.2, `pack` only                 | host page (optional)        | 11.1 KB  | 5.2 KB   | 9.4 KB / 4.7 KB (whole)   |
| `@rrweb/rrweb-plugin-canvas-webrtc-record` 2.2.2   | host page (optional)        | 23.0 KB  | 6.7 KB   |                           |
| `@rrweb/replay` 2.2.2 (`replay.umd.min.cjs`)       | dashboard                   | 281.1 KB | 87.5 KB  | 270.2 KB / 81.7 KB        |
| `rrweb-player` 2.2.2 (replayer plus Svelte UI)     | dashboard                   | 320.3 KB | 101.5 KB | 308.3 KB / 95.0 KB        |
| `posthog-js` 1.447.7, `lazy-recorder.js`           | host page, loaded on demand | 221.1 KB | 68.7 KB  |                           |
| `clarity-js` 0.8.77 (`clarity.min.js`)             | host page                   | 73.8 KB  | 26.5 KB  |                           |
| **`@fasterfixes/widget` 1.3.1 (`widget.iife.js`)** | host page                   | 94.1 KB  | 31.7 KB  |                           |

- Sentry documents its replay integration as "an additional ~36KB gzipped" (as of SDK 7.78.0) on one page and "about 50 kB gzipped" on another. [doc] [performance overhead](https://docs.sentry.io/product/explore/session-replay/web/performance-overhead/), [troubleshooting](https://docs.sentry.io/platforms/javascript/session-replay/troubleshooting/)
- The Widget figure is the file served by jsDelivr for the `@1` channel on 2026-11-10. ADR-0016 promises a tracked bundle size that does not exist yet (map #362).

### Lazy loading

- `record()` can be called at any time after load. Its first output is a Meta event and a full snapshot of the DOM as it is at that moment. `recordAfter` defaults to `'load'`. [doc] [guide.md](https://github.com/rrweb-io/rrweb/blob/main/guide.md)
- PostHog loads its recorder as a separate script after init: "`posthog-js` fetches a separate `recorder.js` script, which a CSP can block". [doc] [PostHog troubleshooting](https://posthog.com/docs/session-replay/troubleshooting)
- Sentry documents lazy loading by dynamic import followed by `Sentry.addIntegration(replayIntegration())`. [doc] [Sentry session replay](https://docs.sentry.io/platforms/javascript/session-replay/)
- Consequence: lazy loading is compatible with deliberate capture (load when the Reviewer starts a Recording). For retroactive capture, nothing that happened before the recorder started is recoverable, the same limit ADR-0009 records for the Diagnostic Trail.
- For the script embed, a lazily loaded recorder is a second file fetched from the CDN, which a host site's Content Security Policy must allow like the first.

### Runtime overhead on the host page

- What the recorder installs **[src]** ([observer.ts](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb/src/record/observer.ts), [shadow-dom-manager.ts](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb/src/record/shadow-dom-manager.ts)): a `MutationObserver` on the document and on each open shadow root, listeners for pointer, scroll, input, resize, selection and media events, and patches on native prototypes: `Element.prototype.attachShadow`, `CSSStyleSheet.prototype.insertRule` / `deleteRule` / `replace` / `replaceSync`, `CSSStyleDeclaration.prototype.setProperty` / `removeProperty`, `FontFace`, `document.fonts.add`, `customElements.define`, and the canvas contexts when canvas recording is on. The Widget already patches `console`, `fetch` and `XMLHttpRequest` for the Diagnostic Trail (ADR-0009); this is a wider surface of the same kind.
- Starting a recording, full snapshot included, took 11 ms to 66 ms on the five pages measured (800 to 4,200 elements), on desktop headless Chromium. **[measured]** Mobile was not measured.
- Sentry's benchmark (its own app, "a strenuous recording scenario", 50 iterations, September 2023): Total Blocking Time 2,663 ms with the SDK alone against 3,037 ms with Replay; average memory unchanged (125.1 MB against 124.8 MB); upload 3.84 KB against 272.51 KB. Separately, "about 100 ms" of extra JS blocking time over four page navigations. [doc] [performance overhead](https://docs.sentry.io/product/explore/session-replay/web/performance-overhead/)
- The known bad case is a large burst of mutations (data grids, long lists). The work happens in the `MutationObserver` callback on the main thread. Sentry records a warning at 750 mutated nodes and **stops the recording** at 10,000 (`mutationBreadcrumbLimit`, `mutationLimit`). [doc] [Sentry configuration](https://docs.sentry.io/platforms/javascript/session-replay/configuration/). PostHog throttles repeated attribute changes on one element, which shows as a "frozen element" in the replay. [doc] [PostHog troubleshooting](https://posthog.com/docs/session-replay/troubleshooting)
- Sentry compresses in a Web Worker so the main thread is not blocked; the worker is inlined by default, which "can cause CSP violations" and needs `worker-src 'self' blob:`. [doc] [Sentry configuration](https://docs.sentry.io/platforms/javascript/session-replay/configuration/), [troubleshooting](https://docs.sentry.io/platforms/javascript/session-replay/troubleshooting/)
- rrweb 2.2.0 fixed record-side memory leaks: each start/stop cycle leaked one mutation buffer, and same-origin iframes were re-observed at every periodic full snapshot. Both paths (start/stop per Recording, periodic snapshots for a buffer) are the ones a Widget would exercise. [src] [rrweb CHANGELOG](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb/CHANGELOG.md)

## 3. Fidelity limits

The design principle: no script of the recorded page runs at replay. The replayer rebuilds the DOM in an iframe and applies recorded changes. [doc] [serialization.md](https://github.com/rrweb-io/rrweb/blob/main/docs/serialization.md), [sandbox.md](https://github.com/rrweb-io/rrweb/blob/main/docs/sandbox.md). Whatever is not in the DOM, or not readable from the page's script context, is not in the Recording.

| Subject                               | What is recorded                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Source                                                                                                                                                                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Canvas (2D)**                       | Nothing by default. With `recordCanvas: true`, either the drawing calls or image snapshots at a sampled frame rate (`sampling.canvas`, format and quality through `dataURLOptions`). Replaying canvas needs `UNSAFE_replayCanvas`, which "adds `allow-scripts` to the replay iframe and opts out of the sandbox script-execution protection". PostHog captures canvas as images at 4 fps by default (0 to 12), quality 0.4. A canvas tainted by cross-origin images throws a `SecurityError` | [doc] [canvas recipe](https://github.com/rrweb-io/rrweb/blob/main/docs/recipes/canvas.md), [PostHog canvas](https://posthog.com/docs/session-replay/canvas-recording), [Sentry troubleshooting](https://docs.sentry.io/platforms/javascript/session-replay/troubleshooting/) |
| **WebGL**                             | Same switches. Sentry: exporting a WebGL canvas needs `preserveDrawingBuffer`, "which can affect performance", or manual snapshots from the app's paint loop, which a Widget on a third-party site cannot ask for                                                                                                                                                                                                                                                                            | [doc] [Sentry session replay](https://docs.sentry.io/platforms/javascript/session-replay/)                                                                                                                                                                                   |
| **Video and audio elements**          | The element, its `src` URL and its state (paused, current time, rate, volume), then play, pause, seek, volume and rate events. Not the frames. The replay re-fetches the URL. Sentry: "Only static, publicly hosted videos are captured. Streamed video is not supported"                                                                                                                                                                                                                    | [src] [snapshot.ts](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb-snapshot/src/snapshot.ts), [doc] [Sentry troubleshooting](https://docs.sentry.io/platforms/javascript/session-replay/troubleshooting/)                                                        |
| **Same-origin iframes**               | Recorded                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | [doc] [PostHog iframes](https://posthog.com/docs/session-replay/iframes)                                                                                                                                                                                                     |
| **Cross-origin iframes**              | Only if the recorder also runs inside the iframe with `recordCrossOriginIframes: true` on both sides (events are relayed by `postMessage`). rrweb warns that this lets any embedding site record the framed page. Third-party embeds (Stripe Checkout, YouTube, Typeform, Calendly, Google Maps) are "recorded as an empty placeholder element"                                                                                                                                              | [doc] [cross-origin iframes recipe](https://github.com/rrweb-io/rrweb/blob/main/docs/recipes/cross-origin-iframes.md), [PostHog iframes](https://posthog.com/docs/session-replay/iframes)                                                                                    |
| **Shadow DOM (open)**                 | Recorded: shadow hosts and their children are serialized, each open shadow root gets its own observer, `attachShadow` is patched to catch new ones, adopted stylesheets are tracked. The Widget's root is open (`packages/widget/src/mount.ts`), so the Widget's own UI would be part of the Recording unless its host is blocked                                                                                                                                                            | [src] [shadow-dom-manager.ts](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb/src/record/shadow-dom-manager.ts)                                                                                                                                                   |
| **Shadow DOM (closed)**               | The recorder reaches shadow roots through `element.shadowRoot`, which is `null` for a closed root. **Inference**: closed roots are not recorded. No test or doc statement was found either way                                                                                                                                                                                                                                                                                               | [src] same file                                                                                                                                                                                                                                                              |
| **Stylesheets**                       | Rules are read from the CSSOM and inlined in the snapshot (`inlineStylesheet`, default `true`), so a stylesheet on an intranet or localhost is still in the Recording. Exception: a cross-origin stylesheet without CORS cannot be read ("Without `crossorigin="anonymous"`, Chrome blocks access to `cssRules`"); the Recording then keeps only its URL                                                                                                                                     | [doc] [serialization.md](https://github.com/rrweb-io/rrweb/blob/main/docs/serialization.md), [PostHog troubleshooting](https://posthog.com/docs/session-replay/troubleshooting)                                                                                              |
| **CSS-in-JS**                         | Covered by the prototype patches (`insertRule`, `replaceSync`, `setProperty` and the rest), emitted as stylesheet-rule events. This area regresses: 2.1.7 fixed a bug that broke recordings of pages using styled-components                                                                                                                                                                                                                                                                 | [src] [observer.ts](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb/src/record/observer.ts), [CHANGELOG](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb/CHANGELOG.md)                                                                                 |
| **Images**                            | The URL only, made absolute. `inlineImages` (default `false`) draws each image to a canvas and stores a data URL; it only works for images readable under CORS, it sets `crossOrigin="anonymous"` on the host page's `<img>` to retry, and it is "deprecated since 2.0.0"                                                                                                                                                                                                                    | [doc] [guide.md](https://github.com/rrweb-io/rrweb/blob/main/guide.md), [src] [snapshot.ts](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb-snapshot/src/snapshot.ts)                                                                                             |
| **Web fonts**                         | `@font-face` rules are kept as CSS with absolute URLs, so the font file is fetched at replay. `collectFonts` (default `false`) only captures fonts created in script through the `FontFace` constructor. Sentry: self-hosted fonts need an `Access-Control-Allow-Origin` header that permits the origin of the replayer                                                                                                                                                                      | [src] [observer.ts](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb/src/record/observer.ts), [doc] [Sentry troubleshooting](https://docs.sentry.io/platforms/javascript/session-replay/troubleshooting/)                                                          |
| **Assets behind auth or that vanish** | Not in the Recording, so not in the replay. PostHog: "If an asset URL is signed, expired, or unavailable, it won't appear", and for internal apps, assets that could not be inlined are "only visible to viewers who can reach your server"                                                                                                                                                                                                                                                  | [doc] [PostHog troubleshooting](https://posthog.com/docs/session-replay/troubleshooting)                                                                                                                                                                                     |
| **SVG `<use>` with external links**   | Cannot be loaded cross-origin at replay, "a known browser limitation"                                                                                                                                                                                                                                                                                                                                                                                                                        | [doc] [Sentry troubleshooting](https://docs.sentry.io/platforms/javascript/session-replay/troubleshooting/)                                                                                                                                                                  |
| **Large or virtualized DOMs**         | Recorded, at a cost. rrweb lists "long list", "complex SVG", "element with JS controlled animation" and "canvas animations" as the patterns that emit large volumes of events, and suggests blocking them. Sentry ends the recording at 10,000 mutations                                                                                                                                                                                                                                     | [doc] [optimize-storage recipe](https://github.com/rrweb-io/rrweb/blob/main/docs/recipes/optimize-storage.md), [Sentry configuration](https://docs.sentry.io/platforms/javascript/session-replay/configuration/)                                                             |
| **Hover states**                      | Simulated at replay by rewriting `:hover` rules to a class toggled from the pointer events                                                                                                                                                                                                                                                                                                                                                                                                   | [doc] [replay.md](https://github.com/rrweb-io/rrweb/blob/main/docs/replay.md)                                                                                                                                                                                                |
| **Layout exactness**                  | The replay is re-rendered by the viewer's browser. Sentry: "Font loading differences and variable-width font masking can shift layout", which puts clicks in the wrong place                                                                                                                                                                                                                                                                                                                 | [doc] [Sentry troubleshooting](https://docs.sentry.io/platforms/javascript/session-replay/troubleshooting/)                                                                                                                                                                  |

**Inference, by construction**: anything the browser draws outside the page's DOM is absent. That covers native dialogs (`alert`, file pickers, print), the open list of a native `<select>`, browser chrome, other tabs and other applications. No first-party page lists these one by one.

## 4. Privacy

Masking and blocking happen in the browser, at serialization, before any event exists. This is the same principle as ADR-0009's client-side redaction. PostHog: "masked data is never sent over the network"; Sentry: masking happens on the client before data is sent. [doc] [PostHog privacy](https://posthog.com/docs/session-replay/privacy), [Sentry privacy](https://docs.sentry.io/platforms/javascript/session-replay/privacy/)

### What rrweb provides

[doc] [guide.md, Privacy](https://github.com/rrweb-io/rrweb/blob/main/guide.md)

| Mechanism                           | Effect                                                                          | Default              |
| ----------------------------------- | ------------------------------------------------------------------------------- | -------------------- |
| `blockClass`, `blockSelector`       | The element is not recorded; it replays as a placeholder of the same dimensions | `rr-block`           |
| `ignoreClass`, `ignoreSelector`     | Input events on the element are not recorded                                    | `rr-ignore`          |
| `maskTextClass`, `maskTextSelector` | Text of the element and its children is masked                                  | `rr-mask`            |
| `maskAllInputs`                     | Every input value is replaced by `*`                                            | `false`              |
| `maskInputOptions`                  | Masking per input type (text, email, tel, textarea, select and others)          | `{ password: true }` |
| `maskInputFn`, `maskTextFn`         | Custom masking functions                                                        | none                 |
| `slimDOMOptions`                    | Drops scripts, comments and head metadata from the snapshot                     | `{}`                 |

Out of the box, upstream rrweb masks password inputs and nothing else.

### How PostHog and Sentry set the defaults

|                  | rrweb upstream | PostHog                                                                                    | Sentry                                                                                                       |
| ---------------- | -------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Input values     | Password only  | All masked (`maskAllInputs: true`)                                                         | All masked (`maskAllInputs: true`)                                                                           |
| Page text        | Not masked     | Not masked ("General text is not masked by default"); `maskTextSelector: "*"` masks it all | All masked (`maskAllText: true`), each character replaced by `*`                                             |
| Images and media | Recorded       | Recorded                                                                                   | Blocked (`blockAllMedia: true`: `img`, `svg`, `video`, `object`, `picture`, `embed`, `map`, `audio`)         |
| Opt-out class    | `rr-block`     | `ph-no-capture` (also `ph-ignore-input`, `ph-mask`)                                        | `sentry-block`, `sentry-mask`, `sentry-ignore` and the matching `data-sentry-*` attributes                   |
| Opt back in      |                |                                                                                            | `unmask`, `unblock` selectors                                                                                |
| Canvas           | Off            | Off; when on, masking is by app-supplied regions (`maskRegionsFn`)                         | Opt-in; "There is currently no PII scrubbing in canvas recordings!"                                          |
| Network bodies   | Plugin, opt-in | Opt-in; "We scrub some headers automatically"                                              | Opt-in per URL (`networkDetailAllowUrls`), truncated at 150,000 characters; best-effort server scrubbing too |

Sources: [PostHog privacy](https://posthog.com/docs/session-replay/privacy), [PostHog canvas](https://posthog.com/docs/session-replay/canvas-recording), `posthog-js` 1.447.7 recorder source (class names and defaults), [Sentry privacy](https://docs.sentry.io/platforms/javascript/session-replay/privacy/), [Sentry configuration](https://docs.sentry.io/platforms/javascript/session-replay/configuration/).

Points that bear on the Widget:

- Masking cannot run inside some content. Sentry blocks same-origin `srcdoc` iframes by default "because masking cannot run inside them". [doc] [Sentry privacy](https://docs.sentry.io/platforms/javascript/session-replay/privacy/)
- Masked text is masked for everyone downstream: the human watching, and an agent reading the event stream.
- Faster Fixes has no DOM masking today and the Screenshot is not masked (map #362). A DOM Recording brings selector-based masking with it; a pixel recording has no equivalent hook.
- PostHog's own warning on shared replays: "We make no guarantees about sensitive information contained in the recording." [doc] [PostHog sharing](https://posthog.com/docs/session-replay/sharing)

## 5. Payload

### Measured sizes

**[measured]** `@rrweb/record` 2.2.2, default options plus `maskAllInputs`, 60 seconds per page, scripted pointer moves and wheel scrolling, no clicks, typing or navigation. Sizes are the JSON of the events, and gzip of that JSON as one blob.

| Page                         | Elements | Full snapshot (raw / gzip) | 60 s of activity (raw / gzip) | Total (raw / gzip) |
| ---------------------------- | -------- | -------------------------- | ----------------------------- | ------------------ |
| Hacker News front page       | 817      | 110 KB / 12 KB             | 25 KB / 4 KB                  | 134 KB / 16 KB     |
| Wikipedia article            | 4,179    | 1,166 KB / 144 KB          | 178 KB / 23 KB                | 1,344 KB / 167 KB  |
| stripe.com home (animations) | 2,951    | 715 KB / 143 KB            | 556 KB / 66 KB                | 1,270 KB / 209 KB  |
| vercel.com home              | 1,182    | 1,505 KB / 206 KB          | 29 KB / 5 KB                  | 1,534 KB / 211 KB  |
| GitHub repository page       | 2,793    | 4,827 KB / 629 KB          | 26 KB / 4 KB                  | 4,853 KB / 633 KB  |

- The full snapshot is most of a short Recording, and its size follows the inlined CSS more than the element count (GitHub: 4.8 MB for 2,800 elements).
- Pointer movement and scrolling cost about 25 KB raw per minute. Mutations are what grows: the animated page emitted 1,790 mutation events (545 KB raw) in the same minute.
- Gzip brings the JSON down by a factor of 6 to 9 in this sample.
- For scale: the Diagnostic Trail is bounded at 64 KB and stored in a JSONB column, a size ADR-0009 called comfortable for Postgres; the Screenshot is capped at 5 MB (map #362). A one-minute Recording sits between the two when compressed, and above the Trail by one to two orders of magnitude when not.

### What the vendors document

- Sentry's 60-second in-memory buffer is "approximately 2-5MB". [doc] [understanding sessions](https://docs.sentry.io/platforms/javascript/session-replay/understanding-sessions/). The SDK caps the event buffer at 20 MB (`REPLAY_MAX_EVENT_BUFFER_SIZE`) and stops with reason `eventBufferOverflow` beyond it. [src] `@sentry/replay` 11.11.0
- Sentry's benchmark scenario uploaded 272.51 KB in total with Replay on. [doc] [performance overhead](https://docs.sentry.io/product/explore/session-replay/web/performance-overhead/)

### Compression

- rrweb: `packFn` from `@rrweb/packer` (fflate) compresses each event; the docs add that this "may not get the best result" and recommend compressing the whole session on the backend. They also suggest deduplicating inlined CSS across sessions. [doc] [optimize-storage recipe](https://github.com/rrweb-io/rrweb/blob/main/docs/recipes/optimize-storage.md)
- Sentry: gzip on the client, in a Web Worker. [doc] [performance overhead](https://docs.sentry.io/product/explore/session-replay/web/performance-overhead/)
- PostHog: gzip on the client (fflate, or the browser's `CompressionStream`), applied to the heavy fields of full snapshots and mutation events; on the server, recordings are stored as Snappy-compressed JSONL blobs. [src] `posthog-js` 1.447.7, [doc] [snapshot API](https://posthog.com/docs/session-replay/snapshot-api)

### Chunking and upload

- rrweb has no transport. `emit(event)` hands each event to the caller; the guide's example batches and POSTs every 10 seconds. [doc] [guide.md](https://github.com/rrweb-io/rrweb/blob/main/guide.md). rrweb's own cloud client streams over WebSocket with an HTTP POST fallback. [doc] [browser-client README](https://github.com/rrweb-io/rrweb/blob/main/packages/browser-client/README.md)
- Sentry: segments flushed every 5 to 5.5 seconds, 3 retries, a replay capped at 60 minutes, a session ended after 15 minutes idle. [src] `@sentry/replay` 11.11.0 constants, [doc] [understanding sessions](https://docs.sentry.io/platforms/javascript/session-replay/understanding-sessions/)
- PostHog: buffer flushed every 2 seconds, a single event capped at about 0.9 MB, a full snapshot every 5 minutes, a synchronous compress-and-beacon path on `beforeunload`. [src] `posthog-js` 1.447.7
- Both vendors upload continuously because they record sessions that may never end cleanly. A Recording attached to a Feedback at submission could instead be one upload, which is the case neither vendor documents.

## 6. Buffering

### Keeping the last N seconds

- A replay must start from a full snapshot, so "the last N seconds" cannot be cut out of a continuous stream. rrweb's mechanism is the **checkout**: `checkoutEveryNms` (or `checkoutEveryNth`) takes a fresh full snapshot periodically and flags it, so the caller can drop older segments. [doc] [guide.md, Checkout](https://github.com/rrweb-io/rrweb/blob/main/guide.md)
- rrweb states the precision limit: "we can not capture the last N events accurately". Keeping the last two segments yields between N and 2N of history.
- Sentry's buffer mode is this pattern with one segment: a checkout every 60 seconds (`BUFFER_CHECKOUT_TIME`), and the buffer is cleared at each checkout. The result is "up to one minute before the error", which in the source means anywhere between 0 and 60 seconds. [src] `@sentry/replay` 11.11.0, [doc] [Sentry configuration](https://docs.sentry.io/platforms/javascript/session-replay/configuration/)
- This is a Ring Buffer in the sense of `CONTEXT.md`, with one difference from the Diagnostic Trail's: its unit is a segment that starts with a full snapshot, not an entry.

### Cost of running it permanently

- **CPU**: the observers and patches of section 2 run for the whole life of every page where the Widget is mounted, plus one full snapshot per checkout interval (11 ms to 66 ms each on desktop in the sample above).
- **Memory**: one or two segments. With the measured pages, a segment is 0.1 MB to 5 MB of JSON, dominated by the snapshot. Sentry gives 2 to 5 MB for 60 seconds.
- **Risk surface**: the mutation-burst case of section 2 would now affect every visitor of the customer's site that has the Widget, not only a Reviewer who chose to record.
- **No vendor runs the buffer for free**: Sentry's buffer mode is sampled (`replaysOnErrorSampleRate`), and PostHog gates recording behind triggers, sampling and a minimum duration. [doc] [Sentry session replay](https://docs.sentry.io/platforms/javascript/session-replay/), [PostHog controls](https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record)

### Survival across full page loads

- The recorder and its in-memory buffer belong to the document. On a full page load they are gone; a new recording starts with a new Meta event and full snapshot. rrweb documents that streams from successive page loads "can be linearly combined into a single 'Session Replay'". [doc] [events.md](https://github.com/rrweb-io/rrweb/blob/main/docs/events.md)
- Sentry's `stickySession` (default `true`) keeps the **session id** in `sessionStorage` across refreshes, so that segments already uploaded are stitched server-side. The events themselves are not persisted. [src] `@sentry/replay` 11.11.0 (`sentryReplaySession`), [doc] [Sentry configuration](https://docs.sentry.io/platforms/javascript/session-replay/configuration/)
- **Inference from the above**: in buffer mode nothing has been uploaded, so a full page load discards the buffered history. No doc states it; the source has no persistence of the event buffer.
- Options to carry a buffer over a page load, none provided by rrweb:
  - `sessionStorage`: about 5 MiB per origin, synchronous, strings only, and the origin is the customer's site, so the quota is shared with the site's own usage. [doc] [MDN, storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
  - IndexedDB: large quota, asynchronous, so a write started at unload is not guaranteed to finish (inference).
  - Uploading continuously to the server and stitching there, which is what Sentry's session mode and PostHog do, and which means uploading data for sessions that never produce a Feedback.
- For deliberate capture across page loads, the minimum is a persisted "recording in progress" flag, an auto-restart of the recorder when the Widget mounts on the next page, and per-page segments joined at submission. The time between unload and the Widget's next mount is not recorded.

## 7. Playback

### The player

- `@rrweb/replay` exposes `Replayer`: play, pause, seek to a millisecond, speed, skip of inactive periods, events on each replayed event (`event-cast`, `custom-event`, `mouse-interaction`). It rebuilds the page in an iframe. [doc] [guide.md, Replay](https://github.com/rrweb-io/rrweb/blob/main/guide.md)
- `rrweb-player` is a Svelte UI on top: controls, timeline, speed selector, inactive-period markers and, since 2.2.0, captions and timeline markers fed by annotation events recorded with `record.addAnnotation()`. [doc] [rrweb-player README](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb-player/README.md)
- Sizes are in section 2. The player is only needed where a Recording is watched, so it never weighs on the Widget.
- Every event carries an epoch-millisecond timestamp, as Diagnostic Trail entries do, so the two can be aligned on one timeline. rrweb also has console and network plugins that put those entries into the same stream. [doc] [console recipe](https://github.com/rrweb-io/rrweb/blob/main/docs/recipes/console.md), [network recipe](https://github.com/rrweb-io/rrweb/blob/main/docs/recipes/network.md)

### Security of replaying untrusted data

- The event stream comes from a third-party page through an unauthenticated Reviewer and is rendered inside the dashboard. rrweb's position: "Browser replay security is enforced by iframe sandboxing, not by trying to sanitize every executable DOM, URL, CSS, SVG, or event-handler vector". The replay iframe is created with exactly `sandbox="allow-same-origin"`; rebuilding into an unsandboxed document requires an explicit unsafe opt-out. [doc] [ADR: require sandboxed browser rebuilds](https://github.com/rrweb-io/rrweb/blob/main/docs/adr/0001-require-sandboxed-browser-rebuilds.md), [sandbox.md](https://github.com/rrweb-io/rrweb/blob/main/docs/sandbox.md)
- Canvas replay removes that protection (`UNSAFE_replayCanvas`). [doc] [canvas recipe](https://github.com/rrweb-io/rrweb/blob/main/docs/recipes/canvas.md)
- The viewer's browser fetches every asset URL found in the Recording. PostHog's rasterizer routes that egress through a proxy and locks the player page with a CSP, which shows how seriously they treat it server-side. [src] [recording-rasterizer README](https://github.com/PostHog/posthog/blob/master/nodejs/src/session-replay/recording-rasterizer/README.md)

### Faithfulness months later

A Recording stores the DOM and the readable CSS rules. It stores URLs for everything else. At replay those URLs are requested from the customer's site, by the viewer's browser, from the dashboard's origin.

| Asset                                  | Stored in the Recording                         | Replays correctly later if                                                          |
| -------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| DOM structure, text, input values      | Yes                                             | Always                                                                              |
| Same-origin or CORS-readable CSS rules | Yes (inlined)                                   | Always, except `url()` references inside them                                       |
| Cross-origin CSS without CORS          | URL only                                        | The file still exists at that URL and is public                                     |
| Images, background images, SVG sprites | URL only (unless the deprecated `inlineImages`) | The file still exists, is public, and needs no cookie                               |
| Web fonts                              | URL only (unless created through `FontFace`)    | Same, plus an `Access-Control-Allow-Origin` header accepting the dashboard's origin |
| Video and audio                        | URL and playback state                          | Same; streamed media never                                                          |
| Canvas, cross-origin iframes           | Nothing by default                              | Never                                                                               |

- Sentry and PostHog both document the failure: add their origin to your CORS policy, or the assets do not load. [doc] [Sentry troubleshooting](https://docs.sentry.io/platforms/javascript/session-replay/troubleshooting/), [PostHog troubleshooting](https://posthog.com/docs/session-replay/troubleshooting)
- The Faster Fixes audience makes this sharper. `docs/product/icp.md` places usage in preview environments and staging first. Those are the sites that sit behind a login or a VPN, get redeployed with new hashed asset names, and are torn down. **Inference**: a Recording made on a preview deployment is the case most exposed to missing assets. On a self-hosted instance the dashboard origin is different for each installation, so there is no single origin customers could allow.
- **Asset inlining in rrweb is unfinished.** `inlineStylesheet` and `inlineImages` are "deprecated since 2.0.0 [...] planned to be superseded by future `captureAssets` asset recording APIs". As of 2.2.2 the type `EventType.Asset` exists, and a README says the API will come "once the `captureAssets` recording API lands from the assets branch". [doc] [guide.md](https://github.com/rrweb-io/rrweb/blob/main/guide.md), [src] [browser-client README](https://github.com/rrweb-io/rrweb/blob/main/packages/browser-client/README.md), [types](https://github.com/rrweb-io/rrweb/blob/main/packages/types/src/index.ts)
- PostHog says "most assets are captured inline" in its own pipeline and still lists missing assets as a troubleshooting item. How it stores them is not documented. [doc] [PostHog troubleshooting](https://posthog.com/docs/session-replay/troubleshooting)
- Old recordings and new players: the rrweb changelog shows replayer fixes made specifically so that recordings produced by older, buggy recorders still play (2.1.7, 2.2.1). That is practice, not a stated compatibility guarantee. [src] [CHANGELOG](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb/CHANGELOG.md)

## 8. Conversion to video or still frames

There is no client-side export in rrweb. Every documented route replays the events in a real browser and captures its output.

| Route                   | How it works                                                                                                                                                                                                                                                                                                                                      | Requires                                                                      | Source                                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rrvideo` 2.2.2 (rrweb) | Node CLI and library. Launches Chromium through Playwright (pinned 1.61.1), loads `rrweb-player` with the events inlined, plays the replay and records the page with Playwright's `recordVideo`. Output: WebM. Playback is in wall-clock time (a `speed` option exists), with a timeout of the replay duration plus 2 minutes                     | Node, Playwright, a Chromium binary on the server                             | [src] [rrvideo/src/index.ts](https://github.com/rrweb-io/rrweb/blob/main/packages/rrvideo/src/index.ts), [doc] [README](https://github.com/rrweb-io/rrweb/blob/main/packages/rrvideo/README.md) |
| PostHog rasterizer      | A dedicated worker: `puppeteer-capture` with Chrome's `HeadlessExperimental.beginFrame` for deterministic virtual-time capture, a warm Chromium pool, a Temporal queue, upload to S3. Outputs MP4, WebM or GIF; defaults 24 fps at 4x playback, 1280x720. "The rasterizer runs in Docker since `beginFrame` requires Linux chrome-headless-shell" | Linux headless Chrome in Docker, a job queue, object storage, an egress proxy | [src] [recording-rasterizer README](https://github.com/PostHog/posthog/blob/master/nodejs/src/session-replay/recording-rasterizer/README.md)                                                    |
| Still frames            | Same route: seek the replayer to a timestamp in a headless browser and screenshot. PostHog's player also has a Screenshot button for the current frame; how it captures was not checked                                                                                                                                                           | A headless browser, or the viewer's browser                                   | [doc] [PostHog sharing](https://posthog.com/docs/session-replay/sharing)                                                                                                                        |

- PostHog Cloud limits video exports to 10, 15 or 25 per project per month depending on plan; "Videos render in the background and usually take a few minutes." [doc] [PostHog sharing](https://posthog.com/docs/session-replay/sharing)
- PostHog's self-hosted compose file (`docker-compose.hobby.yml`) contains no rasterizer service on 2026-11-10 (the only Chromium in it is a `browserless/chromium` image). A closed pull request in their repo describes MP4 export as unavailable on the hobby stack for that reason. [src] [docker-compose.hobby.yml](https://github.com/PostHog/posthog/blob/master/docker-compose.hobby.yml), [PR 92592](https://github.com/PostHog/posthog/pull/92592)
- Sentry does not offer a video download of a replay (support article title "Can I Download a Session Replay"; its body could not be read, see [Not verified](#not-verified)).
- Any rendered video inherits the durability problem of section 7: the headless browser fetches the same asset URLs, at render time.
- What it means on a self-hosted Faster Fixes instance: the map records "no server-side media processing anywhere (no ffmpeg, no transcoding)". A video or still-frame export from a DOM Recording would be the first such component: a Chromium container beside the app in `docker-compose.yml`, a job to drive it, and a render time proportional to the Recording's length.
- Who needs the conversion: surfaces that cannot run the player. A mirrored GitHub or Linear Issue and a Slack announcement can carry a link, an image or a video file, not an rrweb player.

## 9. Machine readability

The event stream is "a set of strictly-typed JSON data". [doc] [events.md](https://github.com/rrweb-io/rrweb/blob/main/docs/events.md). Types below are from `@rrweb/types` 2.2.2. [src] [types/src/index.ts](https://github.com/rrweb-io/rrweb/blob/main/packages/types/src/index.ts)

| In the stream                | Content usable as text                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every event                  | `timestamp` in epoch milliseconds, `type`                                                                                                                      |
| Meta                         | Page `href`, viewport `width` and `height`. Emitted with each full snapshot                                                                                    |
| Full snapshot                | The whole DOM as a tree: tag names, attributes (ids, classes, `aria-*`, `href`), text nodes, input values, each node with a numeric `id`                       |
| Mouse interaction            | Kind (`Click`, `DblClick`, `ContextMenu`, `Focus`, `Blur`, `TouchStart`, `TouchEnd`, and others), target node `id`, `x`, `y`, pointer type (mouse, pen, touch) |
| Input                        | Target node `id`, `text` (the value, masked if masking applies), `isChecked`, optionally `userTriggered`                                                       |
| Scroll, viewport resize      | Target node `id` and offsets; new dimensions                                                                                                                   |
| Mutation                     | Added nodes (serialized), removed node ids, changed text, changed attributes                                                                                   |
| Media interaction, selection | Play, pause, seek, volume, rate on a node; text selection ranges                                                                                               |
| Custom                       | `tag` and a free `payload`, added by the host code with `record.addCustomEvent()`                                                                              |
| Annotation (2.2.0)           | `caption` or `timelineMarker` with plain text, added with `record.addAnnotation()`                                                                             |
| Plugin: console              | Level, arguments, stack trace                                                                                                                                  |
| Plugin: network              | Method, URL, status, timings, optionally headers and bodies                                                                                                    |

Limits of that readability:

- **No selectors.** Events reference nodes by numeric id. Turning "click on node 412" into "click on `button.checkout`" or "click on the button labelled Pay" requires replaying snapshots and mutations into a node map. `rrdom-nodejs` exists for that: "a Node.js implementation of the rrdom library for use in server side processing of rrweb data". [doc] [rrdom-nodejs README](https://github.com/rrweb-io/rrweb/blob/main/packages/rrdom-nodejs/README.md). The alternative is to compute the selector in the Widget at record time and store it in a custom event; `@fasterfixes/core` already holds selector code (ADR-0016).
- **No SPA navigations.** The page URL appears only in Meta events, which accompany full snapshots; the recorder has no `history` or `popstate` listener. [src] [record/index.ts](https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb/src/record/index.ts). Sentry and PostHog add their own navigation and breadcrumb events to the stream (Sentry as custom events tagged `breadcrumb` and `performanceSpan`). [src] `@sentry/replay` 11.11.0. The Widget has SPA navigation detection of its own (`packages/widget/src/navigation.ts`).
- **Volume.** Raw mutation events are verbose (545 KB in one minute on the animated page of section 5). The stream is machine-readable, but it is not a summary; a digest (navigations, clicks with labels, typed values, errors, with timings) has to be derived from it.
- **Visual facts are not in it.** Whether an element was visually broken, overlapped or off-screen is not stated anywhere in the stream; it follows only from rendering the DOM with its CSS.

## 10. Hard limits

1. **It is a reconstruction, not a capture.** What the Reviewer saw and what the replay shows can differ, and nothing in the Recording says where.
2. **Not captured by default, and costly or impossible to add**: canvas and WebGL content, video frames, third-party iframes (payment forms, embedded players, maps), closed shadow roots (inference), native browser UI.
3. **Nothing before the recorder started** can be recovered, on any page.
4. **A buffer does not survive a full page load** unless it has been persisted or uploaded before unload. Nothing in rrweb does this.
5. **Replays decay.** Images, fonts and media are fetched from the customer's site at viewing time. A redeploy, an expired signed URL, an auth wall or a missing CORS header degrades the replay, and `captureAssets` is not available in rrweb 2.2.2.
6. **No video or image without a headless browser** on the server. Trackers and Slack cannot play a replay.
7. **Mutation bursts can freeze or end a recording.** Sentry stops at 10,000 mutated nodes; the cost is paid on the host page's main thread.
8. **The recorder patches native prototypes on a site the team does not control**, alongside whatever else that site and its other scripts patch.
9. **Canvas replay requires dropping the script sandbox** of the replay iframe.
10. **Masking is selector-based and declared in advance.** It cannot know what is sensitive; Sentry's answer is to mask all text and block all media by default, which removes most of what a human would look at.

## 11. Operational costs a small team inherits

- **A dependency with two active maintainers and a commercial sibling.** rrweb 2.x is released often, which is good for fixes and means frequent upgrades of code that runs on customers' sites. The Widget ships on a major channel from jsDelivr (ADR-0016), so every recorder upgrade reaches every site at once.
- **Fidelity bug reports that depend on someone else's site.** "The replay looks wrong" is the top troubleshooting section at both PostHog and Sentry. Each report needs the customer's page to reproduce, and the fix is often in rrweb or in the customer's CORS setup.
- **A support burden on CORS and CSP**: font and asset headers for the dashboard origin, CSP allowances for a lazily loaded recorder script and for a compression worker if one is used.
- **A privacy contract to write and enforce**: default masking policy, blocking classes for customers, what happens with canvas and iframes, and the fact that DOM text and input values of a customer's site are now stored by Faster Fixes.
- **Storage of a new kind of object**: hundreds of kilobytes to a few megabytes per Recording once compressed, too large for a JSONB column by ADR-0009's own yardstick, plus retention rules.
- **Untrusted HTML and CSS rendered in the dashboard**: keeping the replay sandboxed, deciding whether the viewer's browser may fetch third-party asset URLs, tracking rrweb security advisories.
- **If stills or video are needed**: a headless Chromium service in the self-hosted stack, a queue, render time proportional to duration, and the memory and CPU profile that comes with a browser on the server. PostHog needed a dedicated worker with a browser pool and resource tuning, and did not ship it to self-hosters.
- **If retroactive capture is wanted**: an always-on recorder on every page with the Widget, with its CPU and memory cost and its exposure to the mutation-burst case, for all visitors rather than for the Reviewer who chose to record.
- **An agent-facing digest to build and maintain**: selectors, labels and navigations are not in the raw stream.
- **A long-lived format**: recorded events must stay playable by future versions of the player for as long as Recordings are retained.

## Not verified

- **The body of Sentry's support article** on downloading a replay ([link](https://sentry.zendesk.com/hc/en-us/articles/26473694604443-Can-I-Download-a-Session-Replay)) is behind a sign-in. Only its title and a search-engine summary ("not possible to download a video copy") were seen.
- **Closed shadow roots**: the conclusion that they are not recorded is read from the source, not from a test or a doc statement.
- **Sentry buffer mode across a page load**: inferred from the absence of any persistence of the event buffer in the source; not stated in the docs, not tested.
- **Payload figures** are one run per page with synthetic activity on desktop headless Chromium. Real usage with clicks, typing and SPA navigation was not measured. The customer sites Faster Fixes actually serves were not measured.
- **Mobile**: no measurement of snapshot time or memory on a phone. rrweb records touch events (`TouchStart`, `TouchMove`, `TouchEnd` in the types), which says nothing about cost.
- **Runtime overhead on a slow device or a heavy app**: only Sentry's 2023 benchmark of its own app and the snapshot timings above.
- **Whether `UNSAFE_replayCanvas` is also required to replay canvas image snapshots** (as opposed to recorded drawing calls). The docs state the requirement for canvas replay in general.
- **Clarity, OpenReplay and Datadog as standalone libraries**: versions, licenses and sizes were checked; using their recorder and player without their backend was not.
- **PostHog's asset inlining**: the docs say most assets are captured inline; the mechanism and its limits were not found in a first-party page.
- **How Playwright encodes `recordVideo`**: `rrvideo` outputs WebM through it; the Playwright video page does not name the encoder. A local Playwright install was seen to carry an ffmpeg build next to its Chromium builds.
- **Whether Highlight's hosted service did shut down** on the announced date.
- **A formal compatibility guarantee** between stored rrweb events and future players: none was found.
- **The rrweb `assets` branch**: its state and timeline were not examined.

## Appendix A: measurement method

- **Bundle sizes**: `npm pack` of each package on 2026-11-10, size of the published minified file, `gzip -9`. Bundlephobia figures from its public API for the same versions. The Widget file was fetched from `https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js` (served as 1.3.1).
- **Payload and snapshot time**: Playwright 1.63 with headless Chromium, viewport 1440x900, CSP bypassed to inject `@rrweb/record` 2.2.2 (`record.umd.min.cjs`) after `load` plus 2 seconds. `record({ emit, maskAllInputs: true })`, otherwise defaults (`inlineStylesheet: true`, no canvas, no image inlining). For 60 seconds: a pointer move in 8 steps every 400 ms, a wheel scroll every fourth move. Five pages recorded concurrently in one browser on a macOS development machine. Snapshot time is the duration of the `record()` call, which takes the first full snapshot synchronously. Sizes are `JSON.stringify` of the events in UTF-8 bytes, and Node `zlib.gzipSync` of that string at the default level.
- **Vendor constants**: read from the published packages `@sentry/replay` 11.11.0 and `posthog-js` 1.447.7.
- **rrweb source and docs**: the `main` branch at the 2.2.2 release (2026-11-09).

## Sources

**rrweb**

- Repository: https://github.com/rrweb-io/rrweb
- Guide (options, privacy, checkout, replay): https://github.com/rrweb-io/rrweb/blob/main/guide.md
- Events: https://github.com/rrweb-io/rrweb/blob/main/docs/events.md
- Serialization: https://github.com/rrweb-io/rrweb/blob/main/docs/serialization.md
- Incremental snapshots: https://github.com/rrweb-io/rrweb/blob/main/docs/observer.md
- Replay: https://github.com/rrweb-io/rrweb/blob/main/docs/replay.md
- Sandbox: https://github.com/rrweb-io/rrweb/blob/main/docs/sandbox.md
- ADR, sandboxed rebuilds: https://github.com/rrweb-io/rrweb/blob/main/docs/adr/0001-require-sandboxed-browser-rebuilds.md
- Recipes (canvas, cross-origin iframes, storage, video, console, network): https://github.com/rrweb-io/rrweb/tree/main/docs/recipes
- Types: https://github.com/rrweb-io/rrweb/blob/main/packages/types/src/index.ts
- Recorder source: https://github.com/rrweb-io/rrweb/tree/main/packages/rrweb/src/record
- Snapshot source: https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb-snapshot/src/snapshot.ts
- rrvideo: https://github.com/rrweb-io/rrweb/tree/main/packages/rrvideo
- Changelog: https://github.com/rrweb-io/rrweb/blob/main/packages/rrweb/CHANGELOG.md
- Security policy: https://github.com/rrweb-io/rrweb/blob/main/SECURITY.md
- npm: https://www.npmjs.com/package/@rrweb/record, https://www.npmjs.com/package/@rrweb/replay, https://www.npmjs.com/package/rrweb-player, https://www.npmjs.com/package/rrvideo

**Sentry**

- Session Replay setup, canvas, lazy loading: https://docs.sentry.io/platforms/javascript/session-replay/
- Configuration: https://docs.sentry.io/platforms/javascript/session-replay/configuration/
- Privacy: https://docs.sentry.io/platforms/javascript/session-replay/privacy/
- Understanding sessions: https://docs.sentry.io/platforms/javascript/session-replay/understanding-sessions/
- Troubleshooting: https://docs.sentry.io/platforms/javascript/session-replay/troubleshooting/
- Performance overhead: https://docs.sentry.io/product/explore/session-replay/web/performance-overhead/
- Fork: https://github.com/getsentry/rrweb
- npm: https://www.npmjs.com/package/@sentry/replay, https://www.npmjs.com/package/@sentry/rrweb

**PostHog**

- Privacy: https://posthog.com/docs/session-replay/privacy
- Canvas recording: https://posthog.com/docs/session-replay/canvas-recording
- Iframe recording: https://posthog.com/docs/session-replay/iframes
- Troubleshooting: https://posthog.com/docs/session-replay/troubleshooting
- Controlling what is recorded: https://posthog.com/docs/session-replay/how-to-control-which-sessions-you-record
- Sharing and video export: https://posthog.com/docs/session-replay/sharing
- Snapshot API: https://posthog.com/docs/session-replay/snapshot-api
- Rasterizer: https://github.com/PostHog/posthog/blob/master/nodejs/src/session-replay/recording-rasterizer/README.md
- Archived fork: https://github.com/PostHog/posthog-rrweb
- npm: https://www.npmjs.com/package/posthog-js

**Others**

- Microsoft Clarity: https://github.com/microsoft/clarity
- OpenReplay license: https://github.com/openreplay/openreplay/blob/main/LICENSE
- Datadog Browser SDK: https://github.com/DataDog/browser-sdk
- Highlight migration post: https://www.highlight.io/blog/launchdarkly-migration
- MDN, storage quotas: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- Playwright videos: https://playwright.dev/docs/videos
- Bundlephobia: https://bundlephobia.com/package/@rrweb/record@2.2.2
