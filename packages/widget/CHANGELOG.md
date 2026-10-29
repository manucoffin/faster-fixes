# Changelog

## 1.3.1

### Patch Changes

- [#287](https://github.com/manucoffin/faster-fixes/pull/287) [`928c17f`](https://github.com/manucoffin/faster-fixes/commit/928c17f414770f1a21bd0e08a656565256fc38f7) Thanks [@manucoffin](https://github.com/manucoffin)! - Attach a Screenshot shortly after submit on pages with lazy images, unplayed videos or many web fonts. The capture no longer waits 30 seconds for media below the fold: images and videos get 3 seconds to load, then each remote asset gets 15 seconds to embed. Videos without a decoded frame are left out of the image instead of hanging the capture, and only the woff2 source of each `@font-face` is embedded, which kept font-heavy pages from rendering blank. The full capture now gets 15 seconds before the fallback replaces it, up from 3. The fallback keeps every element on the page, skips font embedding and draws slow images as same-size placeholders, so its image shows the same layout as the page instead of one with images and videos removed. On very large Retina viewports the capture scale is lowered to keep the canvas under 16 million pixels, so Safari returns an image instead of nothing.

- [#287](https://github.com/manucoffin/faster-fixes/pull/287) [`5d37e3a`](https://github.com/manucoffin/faster-fixes/commit/5d37e3a229ded2e5bee2bb11ba030f74103ca3f2) Thanks [@manucoffin](https://github.com/manucoffin)! - Attach a Screenshot to Feedback submitted from Firefox. On Firefox 156 and later every capture failed with `can't access property "appendChild", l.body is null`, because the capture library wrote into its sandbox iframe before the iframe's document had loaded. The Widget now creates that iframe itself, waits for it to load, excludes it from the image and removes it after every capture, whether the capture succeeded or failed, so no hidden iframe is left in your page.

- [#287](https://github.com/manucoffin/faster-fixes/pull/287) [`4d6a401`](https://github.com/manucoffin/faster-fixes/commit/4d6a401c5ac6d9900bb2ad3d60210164d8972fa4) Thanks [@manucoffin](https://github.com/manucoffin)! - Record where the Selection sat on screen when the Reviewer made it. Each Feedback now carries a `selection` object in its metadata, measured in the same tick the Screenshot capture starts: the viewport size, the selected element's rectangle and the click point, all in viewport CSS pixels. The inbox uses it to draw the Selection frame over the Screenshot. `@fasterfixes/core` exports its shape as the `SelectionGeometry` type. No option, attribute or API contract changes.
- Updated dependencies [[`4d6a401`](https://github.com/manucoffin/faster-fixes/commit/4d6a401c5ac6d9900bb2ad3d60210164d8972fa4)]:
  - @fasterfixes/core@0.3.0

## 1.3.0

### Minor Changes

- [#279](https://github.com/manucoffin/faster-fixes/pull/279) [`bdec91d`](https://github.com/manucoffin/faster-fixes/commit/bdec91d566116d24297455f600236eacb0445a76) Thanks [@manucoffin](https://github.com/manucoffin)! - Add the `customMetadata` option: key/value pairs your site attaches to every Feedback, such as a user ID, a release version or a tenant. Pass a plain object, or a function the Widget calls at each submission so a value known only after sign-in is always current. Keys are strings and values are `string`, `number`, `boolean` or `null`. At most 50 keys are sent, keys are cut to 40 characters and values to 500; extra keys are dropped, long values truncated, and in development the Widget logs a warning for each, and for a key that looks sensitive, such as `token` or `email`. A function that throws sends the Feedback without Custom metadata. The pairs are independent of `captureDiagnostics`, shown to your team in the dashboard, the agent API and mirrored Issues, and never returned to a Reviewer. With the script tag, call `window.FasterFixes.init({...})` to pass it: there is no `data-*` attribute. `FeedbackProvider` in `@fasterfixes/react` accepts `customMetadata` as a prop, and an inline function does not re-initialise the Widget. `@fasterfixes/vue`, `@fasterfixes/angular` and `@fasterfixes/svelte` forward it unchanged; use the function form to keep values fresh. `@fasterfixes/core` exports the `CustomMetadata` type, the three limits and `normalizeCustomMetadata`.

### Patch Changes

- Updated dependencies [[`bdec91d`](https://github.com/manucoffin/faster-fixes/commit/bdec91d566116d24297455f600236eacb0445a76)]:
  - @fasterfixes/core@0.2.0

## 1.2.0

### Minor Changes

- [#214](https://github.com/manucoffin/faster-fixes/pull/214) [`3e86fca`](https://github.com/manucoffin/faster-fixes/commit/3e86fcaea1d1e984aa0276182c190ee479ff9c65) Thanks [@manucoffin](https://github.com/manucoffin)! - Add `createFakeWidget` under the `@fasterfixes/widget/testing` subpath: a Widget double for testing code that drives the Widget, such as a framework Embed. It records the arguments of every call in `calls`, `emit(patch)` updates `isVisible`, `feedbackItems` or `showPins` and notifies subscribers, and `listenerCount` reports the live listeners. It depends on no test runner. The subpath is unstable, like `@fasterfixes/widget/internal`: it may change in any release.

### Patch Changes

- [#214](https://github.com/manucoffin/faster-fixes/pull/214) [`195b1aa`](https://github.com/manucoffin/faster-fixes/commit/195b1aaa084b64b741b092805e7d6f2450847e25) Thanks [@manucoffin](https://github.com/manucoffin)! - Keep the Reviewer token out of the URL when a router puts it back. `init` removes the `ff_token` query parameter, but a router that finishes its first navigation afterwards, such as Vue Router, wrote back the URL it read at load. The token then stayed in the address bar, was saved in the page URL of new Feedback, and hid the pins of the current page. The Widget now removes the parameter again whenever it reappears, and keeps the router's history state.

## 1.1.0

### Minor Changes

- [#199](https://github.com/manucoffin/faster-fixes/pull/199) [`9d43ac2`](https://github.com/manucoffin/faster-fixes/commit/9d43ac25e4435ea0b86d245fc9ecd9965c1f3b02) Thanks [@manucoffin](https://github.com/manucoffin)! - Add `subscribe(listener)` to the Widget instance returned by `init` and by `createWidget` from `@fasterfixes/widget/internal`. The listener is called after `isVisible`, `feedbackItems` or `showPins` changes, and not when a value is set to what it already was. `subscribe` returns a function that removes the listener, and `destroy()` removes every listener. Use it to keep your own UI in sync with the Widget without polling.

## 1.0.0

### Major Changes

- [#197](https://github.com/manucoffin/faster-fixes/pull/197) [`576f72b`](https://github.com/manucoffin/faster-fixes/commit/576f72be552ee809aff126e94ad980ae03fdaf28) Thanks [@manucoffin](https://github.com/manucoffin)! - First release. `@fasterfixes/widget` installs the FasterFixes Widget on any website with no framework and no build step: paste one `<script>` tag pointing at `https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js` with `data-project-id`, and optionally `data-color`, `data-position`, `data-api-origin` and `data-capture-diagnostics`. Leave out `data-project-id` to call `window.FasterFixes.init(options)` yourself with the full option object, including `labels`. With a bundler, `import { init } from "@fasterfixes/widget"`. The instance exposes `show()`, `hide()`, `isVisible`, `startAnnotation()`, `feedbackItems`, `togglePins()`, `showPins` and `destroy()`, matching `useFeedback` in `@fasterfixes/react`. The Widget renders inside a Shadow DOM, is themed with `--ff-*` CSS custom properties and `::part()`, and ships no framework runtime. The version starts at 1.0.0 so the `@1` CDN channel never has to change.

### Patch Changes

- Updated dependencies [[`571b6f9`](https://github.com/manucoffin/faster-fixes/commit/571b6f9f9a00104ece629d6ce45dfb64846e78d8)]:
  - @fasterfixes/core@0.1.0
