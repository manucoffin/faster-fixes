# Changelog

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
