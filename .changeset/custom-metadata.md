---
"@fasterfixes/core": minor
"@fasterfixes/widget": minor
"@fasterfixes/react": patch
"@fasterfixes/vue": patch
"@fasterfixes/angular": patch
"@fasterfixes/svelte": patch
---

Add the `customMetadata` option: key/value pairs your site attaches to every Feedback, such as a user ID, a release version or a tenant. Pass a plain object, or a function the Widget calls at each submission so a value known only after sign-in is always current. Keys are strings and values are `string`, `number`, `boolean` or `null`. At most 50 keys are sent, keys are cut to 40 characters and values to 500; extra keys are dropped, long values truncated, and in development the Widget logs a warning for each, and for a key that looks sensitive, such as `token` or `email`. A function that throws sends the Feedback without Custom metadata. The pairs are independent of `captureDiagnostics`, shown to your team in the dashboard, the agent API and mirrored Issues, and never returned to a Reviewer. With the script tag, call `window.FasterFixes.init({...})` to pass it: there is no `data-*` attribute. `FeedbackProvider` in `@fasterfixes/react` accepts `customMetadata` as a prop, and an inline function does not re-initialise the Widget. `@fasterfixes/vue`, `@fasterfixes/angular` and `@fasterfixes/svelte` forward it unchanged; use the function form to keep values fresh. `@fasterfixes/core` exports the `CustomMetadata` type, the three limits and `normalizeCustomMetadata`.
