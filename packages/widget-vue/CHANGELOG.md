# @fasterfixes/vue

## 1.0.1

### Patch Changes

- [#279](https://github.com/manucoffin/faster-fixes/pull/279) [`bdec91d`](https://github.com/manucoffin/faster-fixes/commit/bdec91d566116d24297455f600236eacb0445a76) Thanks [@manucoffin](https://github.com/manucoffin)! - Add the `customMetadata` option: key/value pairs your site attaches to every Feedback, such as a user ID, a release version or a tenant. Pass a plain object, or a function the Widget calls at each submission so a value known only after sign-in is always current. Keys are strings and values are `string`, `number`, `boolean` or `null`. At most 50 keys are sent, keys are cut to 40 characters and values to 500; extra keys are dropped, long values truncated, and in development the Widget logs a warning for each, and for a key that looks sensitive, such as `token` or `email`. A function that throws sends the Feedback without Custom metadata. The pairs are independent of `captureDiagnostics`, shown to your team in the dashboard, the agent API and mirrored Issues, and never returned to a Reviewer. With the script tag, call `window.FasterFixes.init({...})` to pass it: there is no `data-*` attribute. `FeedbackProvider` in `@fasterfixes/react` accepts `customMetadata` as a prop, and an inline function does not re-initialise the Widget. `@fasterfixes/vue`, `@fasterfixes/angular` and `@fasterfixes/svelte` forward it unchanged; use the function form to keep values fresh. `@fasterfixes/core` exports the `CustomMetadata` type, the three limits and `normalizeCustomMetadata`.
- Updated dependencies [[`bdec91d`](https://github.com/manucoffin/faster-fixes/commit/bdec91d566116d24297455f600236eacb0445a76)]:
  - @fasterfixes/widget@1.3.0

## 1.0.0

### Major Changes

- [#214](https://github.com/manucoffin/faster-fixes/pull/214) [`1bdc0a2`](https://github.com/manucoffin/faster-fixes/commit/1bdc0a253a9ff9e22ef234bbbb7236e3c55ac65c) Thanks [@manucoffin](https://github.com/manucoffin)! - First release of `@fasterfixes/vue`, the Vue Embed of the FasterFixes Widget. Install it with `app.use(createFasterFixes({ projectId }))` and control the Widget from any component with `useFeedback()`, which returns `show`, `hide`, `startAnnotation` and `togglePins`, plus `isVisible`, `feedbackItems` and `showPins` as readonly refs. The plugin takes the same options as `@fasterfixes/widget`, does nothing during server rendering, destroys the Widget when the app unmounts, and ignores a second install on the same app. Requires Vue 3.5 or later.

### Patch Changes

- Updated dependencies [[`195b1aa`](https://github.com/manucoffin/faster-fixes/commit/195b1aaa084b64b741b092805e7d6f2450847e25), [`3e86fca`](https://github.com/manucoffin/faster-fixes/commit/3e86fcaea1d1e984aa0276182c190ee479ff9c65)]:
  - @fasterfixes/widget@1.2.0
