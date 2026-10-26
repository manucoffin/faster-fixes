# @fasterfixes/angular

## 1.0.1

### Patch Changes

- [#279](https://github.com/manucoffin/faster-fixes/pull/279) [`bdec91d`](https://github.com/manucoffin/faster-fixes/commit/bdec91d566116d24297455f600236eacb0445a76) Thanks [@manucoffin](https://github.com/manucoffin)! - Add the `customMetadata` option: key/value pairs your site attaches to every Feedback, such as a user ID, a release version or a tenant. Pass a plain object, or a function the Widget calls at each submission so a value known only after sign-in is always current. Keys are strings and values are `string`, `number`, `boolean` or `null`. At most 50 keys are sent, keys are cut to 40 characters and values to 500; extra keys are dropped, long values truncated, and in development the Widget logs a warning for each, and for a key that looks sensitive, such as `token` or `email`. A function that throws sends the Feedback without Custom metadata. The pairs are independent of `captureDiagnostics`, shown to your team in the dashboard, the agent API and mirrored Issues, and never returned to a Reviewer. With the script tag, call `window.FasterFixes.init({...})` to pass it: there is no `data-*` attribute. `FeedbackProvider` in `@fasterfixes/react` accepts `customMetadata` as a prop, and an inline function does not re-initialise the Widget. `@fasterfixes/vue`, `@fasterfixes/angular` and `@fasterfixes/svelte` forward it unchanged; use the function form to keep values fresh. `@fasterfixes/core` exports the `CustomMetadata` type, the three limits and `normalizeCustomMetadata`.
- Updated dependencies [[`bdec91d`](https://github.com/manucoffin/faster-fixes/commit/bdec91d566116d24297455f600236eacb0445a76)]:
  - @fasterfixes/widget@1.3.0

## 1.0.0

### Major Changes

- [#223](https://github.com/manucoffin/faster-fixes/pull/223) [`ddac759`](https://github.com/manucoffin/faster-fixes/commit/ddac7594804e0dd0dbefaf18ea44e57889964c9f) Thanks [@manucoffin](https://github.com/manucoffin)! - First release of `@fasterfixes/angular`, the Angular Embed of the FasterFixes Widget. Install it with `provideFasterFixes({ projectId })` in the providers of your application config and control the Widget from any injection context with `injectFeedback()`, which returns `show`, `hide`, `startAnnotation` and `togglePins`, plus `isVisible`, `feedbackItems` and `showPins` as read-only signals. The provider takes the same options as `@fasterfixes/widget`, does nothing during server rendering, destroys the Widget when the application is destroyed, and ignores a second provider in the same application. Requires Angular 19 or later.
