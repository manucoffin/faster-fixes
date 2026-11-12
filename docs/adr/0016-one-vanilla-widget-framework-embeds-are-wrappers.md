# ADR-0016: The Widget is one vanilla DOM implementation; every Embed is a wrapper around it

- **Status**: Accepted
- **Date**: 2026-09-26

## Context

The Widget ships today as `@fasterfixes/react` only. All of its UI (about 54 KB unminified) is React, styled with inline style objects, portalled into `document.body` without Shadow DOM. `@fasterfixes/core` is already framework-free and holds no UI. The docs and three marketing comparison pages promise a non-React install that does not exist.

The product wants one thing first: a script tag that installs the Widget on any site (WordPress, Webflow, static HTML, and also Vue, Angular or Svelte apps), with the same customization as the React package. Later, dedicated packages for Vue, Svelte and Angular will follow (on demand at the time of writing; the 2026-09-28 amendment below replaces this with a closed list). Two constraints were set before designing: the smallest possible footprint on the customer's page, and the cleanest structure for several Embeds to share, with no deadline pressure. A third constraint came from customers who already installed the Widget: nothing they run may stop working.

The glossary now names the pieces: the **Widget** is the in-page reporting UI, an **Embed** is a way of installing it (script embed, React embed, later Vue and others), and an Embed changes how the Widget is installed, never what it does.

## Decision

- **One UI, written in vanilla DOM, in a new published package `@fasterfixes/widget`.** It depends on `@fasterfixes/core` and holds everything visual: floating button, annotation overlay, pins, popovers, feedback list, screenshot capture, SPA navigation detection. `@fasterfixes/core` stays headless: HTTP client, Diagnostic Trail, selectors, Reviewer token. The pin placement math and the screenshot code move out of the React package into the widget package.
- **Every Embed is a thin wrapper around `@fasterfixes/widget`.** `@fasterfixes/react` becomes one: `FeedbackProvider` mounts the widget instance in an effect, `useFeedback` delegates to the instance methods, `children` is unchanged. Future framework packages are the same wrapper in their framework's idiom, drawn from the closed list set by the 2026-09-28 amendment below.
- **The script embed is sugar over `init()`.** `@fasterfixes/widget` builds an ESM entry for bundlers and an IIFE entry for the script tag. The IIFE exposes `window.FasterFixes.init(options)` and auto-initialises when the script tag carries `data-project-id`; simple options (`data-color`, `data-position`, `data-api-origin`, `data-capture-diagnostics`) are readable from `data-*` attributes, the full option object (including `labels`) goes through `init()`. `init()` returns the instance, which carries the programmatic surface `useFeedback` has today: `show`, `hide`, `isVisible`, `startAnnotation`, `feedbackItems`, `togglePins`, `showPins`. No event emitter.
- **The Widget renders in a Shadow DOM** attached to a light-DOM host element that keeps the `data-ff-widget` marker the screenshot filter relies on. Theming is by CSS custom properties on the host (accent, background, foreground, radius, font, z-index) and `::part()` for deep styling. `classNames` is removed from the contract. The dark theme stays the only built-in theme.
- **The customization contract is cleaned while it is rewritten.** Every visible or screen-reader string lives in `labels`, including the four strings hard-coded in English today ("Start feedback", "Show/Hide feedback list", "Show/Hide markers", "Exit feedback mode") and the pin aria-label. The three keys nothing reads (`labels.successMessage`, `labels.closeButton`, `classNames.successState`) and the deprecated `apiKey` option are not carried over. Customization is by code only: no Widget settings in the dashboard, `getConfig` keeps returning `enabled` and `branding`.
- **Client injection stays an internal seam.** ADR-0001's `FeedbackClient` interface remains the single way to run the Widget against another backend, exposed as `@fasterfixes/widget/internal` (`createWidget({ client, reviewerToken, config, ...options })`, marked `@unstable`), never on `init()`. The marketing demo moves onto it.
- **The script is served from jsDelivr off the npm release**, on a major channel (`@fasterfixes/widget@1`). No self-hosted copy for now.
- **Compatibility rules, binding from this ADR on:**
  1. The widget HTTP API is additive only: no field removed or renamed, no status changed, because shipped `@fasterfixes/core` clients cannot be forced to upgrade.
  2. `@fasterfixes/core` is additive only within a major.
  3. The storage key `ff_reviewer_token` and the URL parameter `ff_token` are frozen: changing them logs every Reviewer out.
  4. `@fasterfixes/widget` is published at `1.0.0` first, never at a public `0.x`: a script URL on `@0` would change with every minor.
  5. `@fasterfixes/react` becomes the wrapper at `1.0.0`. During major 1 it still accepts `apiKey` (mapped to `projectId`) and `classNames` (ignored), each with a development-only console warning.
  6. A breaking change to the script embed is a new major, therefore a new URL.
- **Delivery in two releases.** First: `@fasterfixes/core` minor, `@fasterfixes/widget` 1.0.0, a "Script embed" docs page, `other-frameworks.mdx` rewritten to point at it, `customization.mdx` rewritten on the new contract, the script snippet as a second tab in onboarding (React stays the first tab and the primary product), marketing copy corrected. `@fasterfixes/react` 0.0.11 untouched. Second: `@fasterfixes/react` 1.0.0 as the wrapper, migration note, `@fasterfixes/react/internal` removed.
- **Parity is proven, not assumed.** Playwright lands in `apps/web/e2e/` with the widget API stubbed via `page.route`. Two fixtures run the same scenarios (open, annotate an element, submit, see the pin, navigate in-app, token from URL): a static HTML page loading the script embed under a hostile stylesheet (`button { all: unset !important }` and the like), and the app layout, which keeps dogfooding the React wrapper. Vitest covers pure widget logic (pin placement, option resolution, auto-init). `1.0.0` of the widget ships only with these green.

## Alternatives considered

1. **Compile the existing React UI with Preact into the IIFE.** Zero rewrite, parity by construction, about 60 to 80 KB minified. Rejected on the two stated constraints: it is neither the smallest footprint (a framework runtime ships on every customer page) nor the structure a Vue or Angular package can wrap cleanly, and it leaves React as the source of truth for an UI that must run where React is absent.
2. **Two implementations kept in parity by hand** (React keeps its UI, vanilla gets another). Rejected: it is the maintenance debt the rewrite exists to avoid.
3. **A Web Component (custom element) with Shadow DOM.** Same rewrite cost as the chosen option and the same isolation; rejected only because it adds a registration and lifecycle model on top of `init()` without a consumer asking for it. The Shadow DOM half of the idea is kept.
4. **Put the vanilla UI inside `@fasterfixes/core`.** One package fewer. Rejected: core is imported by the app in 12 files, some server-side, for utilities and types, and the docs promise a headless client for customers who build their own UI. A separate package is what a future `@fasterfixes/vue` reuses without dragging core along.
5. **Light DOM with inline styles, as today, keeping `classNames`.** Rejected: on an unknown host a theme reset or an `!important` rule reaches inline styles, and `classNames` already does not work (inline styles win over the class; the app's own `bg-primary` has no effect).
6. **Dashboard-side customization delivered through `getConfig`.** Rejected for now: a real product feature with its own settings screen, schema and migration, and the owner prefers code-level customization. The option object is shaped so `getConfig` could feed it later.
7. **`data-*` attributes only, no `init()`.** Rejected: `labels` is an object, and framework wrappers need a function to call. **A global config object set before the script** (`window.FasterFixesConfig = {...}`) was the other way to pass objects; rejected because it makes the minimal snippet two tags.
8. **Self-hosted script on `www.faster-fixes.com/widget/v1.js`.** Instant rollout and rollback, no third party, but it ties the app deployment to the package release. Deferred: adding it later is one more URL and breaks nobody.
9. **Events on the instance (`on("submit")`).** Rejected: new public API without a request.
10. **A light theme or `theme: "auto"`.** Rejected: strict parity with the current dark-only Widget; CSS variables already let a customer build a light theme.
11. **Manual parity checks instead of Playwright.** Rejected: without end-to-end tests, switching React to the wrapper would be a blind change, and the hostile-CSS case cannot be checked by hand across themes.

## Consequences

- The React package no longer participates in the React tree below `FeedbackProvider`: no React context reaches inside the Widget. Nothing depends on that today; `useFeedback` only drives state.
- `FeedbackProviderCore` and `@fasterfixes/react/internal` disappear at the second release. ADR-0001 is amended accordingly; the seam it created survives as `@fasterfixes/widget/internal`.
- ADR-0013's graph gains a package and a three-deep published chain (core, widget, react). ADR-0013 is amended.
- The script bundle carries no framework runtime. `@floating-ui/dom` replaces `@floating-ui/react`; `modern-screenshot` remains the one heavy dependency. Bundle size becomes a tracked number in the widget package's CI output.
- The React-specific component path that `captureElementContext` reads from `__reactFiber$*` stays in core and returns `null` on non-React pages; a script-embedded Widget on a Vue site simply sends no component path.
- Every future framework Embed is bound by the same contract: same option object, same `labels`, same CSS variables, same instance methods. A customization that exists in one Embed and not another is a bug against the glossary's definition of Embed.
- The compatibility rules above constrain every future change to the widget HTTP API and to core, not only this project.

## Amendment 2026-09-28: a closed list of framework Embeds

The rule that a framework Embed ships only when a customer asks is withdrawn. Faster Fixes is a developer tool first: a Vue, Angular or Svelte developer who finds only a script tag and a hand-wired `onMounted` call reads the product as React-only, whatever the docs promise. The motive for the packages below is developer experience and market coverage, not recorded demand.

- **The framework Embeds are a closed list: React, Vue, Angular, Svelte.** `@fasterfixes/react`, `@fasterfixes/vue`, `@fasterfixes/angular` and `@fasterfixes/svelte` exist. Adding a framework outside this list needs a new amendment. The Angular and Svelte package shapes are not decided here; this amendment only reserves their place, and the amendments below decide them.
- **One package per rendering runtime, never per meta-framework.** Nuxt installs the Vue Embed; Next.js, Remix and TanStack Start install the React Embed. Meta-framework guidance lives in the docs of the runtime's Embed, not in a separate package.
- **The control contract has exactly seven members, and every Embed exposes all seven:** `show`, `hide`, `isVisible`, `startAnnotation`, `feedbackItems`, `togglePins`, `showPins`. They carry the same meaning as on the instance returned by `init()`. An Embed may adapt their form to its framework (a readonly ref, a signal, a store) but may not add, drop or rename a member.
- **The install shape follows the framework's idiom; the option object does not.** A Vue plugin, an Angular provider or a React provider is fine; the options they take are the `@fasterfixes/widget` option object, forwarded unchanged, with no renamed keys and no defaults of the wrapper's own.

ADR-0013's second-consumer gate still governs extraction from the app; it no longer gates publishing a framework Embed from this list. ADR-0013 is amended to place these packages in the graph.

## Amendment 2026-09-29: the Angular Embed

`@fasterfixes/angular` fills Angular's place on the closed list, next to `@fasterfixes/react` and `@fasterfixes/vue`.

- **Install with a provider function, control with an inject function.** `provideFasterFixes(options)` returns environment providers for the application config, like `provideRouter`; it works in an NgModule's providers too, so there is no `forRoot`. `injectFeedback()` returns the seven members. The names follow ecosystem convention: `provideX` for the install, `injectX` for a function that needs an injection context.
- **Signals are the reactive form.** `isVisible`, `feedbackItems` and `showPins` are read-only signals; the four actions are plain functions. No RxJS.
- **No decorators, therefore no ng-packagr.** The package holds no component, directive, pipe, injectable class or NgModule. The Angular linker only rewrites files with partial-compilation declarations, which a decorator-free package never emits, so it is built with tsdown as plain ESM like the Vue Embed, and installs in any build setup, Vite-based ones included. A decorator in the package would move the build to ng-packagr and the Angular Package Format; do not add one to "make it more Angular".
- **Peer `@angular/core` and `@angular/common` at `>=19.0.0`, open upward.** Angular 19 is the first major with `provideEnvironmentInitializer`. `@angular/common` is a peer for `isPlatformBrowser`: the provider does nothing on the server. Only the current major is tested.

## Amendment 2026-09-30: the Svelte Embed

`@fasterfixes/svelte` fills Svelte's place on the closed list, next to `@fasterfixes/react`, `@fasterfixes/vue` and `@fasterfixes/angular`. With it the list is complete.

- **Install with a function called in the root component, control with a context getter.** Svelte has no application object to install a plugin on and no injector. `initFasterFixes(options)` is called in the script of the root component (the root `+layout.svelte` in SvelteKit, `App.svelte` with plain Vite): it sets a Svelte context, mounts the Widget, and tears it down when that component is destroyed. `getFeedback()` reads the context and returns the seven members. The names follow the ecosystem: `init` because the function returns nothing and acts at once, like the Widget's own `init`; `get` because Svelte reads context with `getContext` and reserves `use` for actions.
- **The Widget is mounted at the call, not on mount.** Children mount before their parent in Svelte, so an `onMount` in the root would leave a child calling `show()` in its own `onMount` with no instance. On the server (no `document`) nothing is initialised and `getFeedback()` returns the unmounted values.
- **Reactive properties are the reactive form.** `isVisible`, `feedbackItems` and `showPins` are read-only getters on the object `getFeedback()` returns, made reactive with `createSubscriber` from `svelte/reactivity`; the four actions are plain functions. Destructuring the three state members loses reactivity, as with any Svelte 5 reactive object. No stores: they are the Svelte 4 idiom.
- **No `.svelte` file and no rune, therefore no `svelte-package`.** `createSubscriber` is a plain function, so nothing in the package needs the Svelte compiler, and it is built with tsdown as plain ESM like the Vue and Angular Embeds. A component or a `.svelte.ts` module in the package would move the build to `svelte-package` and turn the options into props; do not add one to "make it more Svelte".
- **"The same app" is the component tree under the root that called `initFasterFixes`.** A second call under that root finds the context, warns in development and does nothing. Two independent Svelte roots on one page each mount their own Widget, as two Vue apps do; there is no global guard.
- **Peer `svelte` at `^5.7.0`.** 5.7.0 is the first release with `createSubscriber`. The range is closed upward because the last Svelte major replaced the reactivity model; a new major is supported when it is tested.

## Amendment 2026-11-11: the recorder is a second file, loaded for Reviewers only

A **Recording** (ADR-0021) needs a DOM recorder of about 24 KB gzipped, next to a script of about 32 KB. Every visitor of a customer's site downloads the script, and only a Reviewer mounts the Widget, so the recorder does not go into the script.

- **The script embed loads a second file from the same package and the same CDN**, addressed at the exact version fixed at build time (`@fasterfixes/widget@1.x.y`), while the script itself stays on the major channel. The two can never be out of step. Everything a Recording needs on the page (the recorder, the buffer, masking) lives in that file, in `@fasterfixes/widget`, never in `@fasterfixes/core`, which the app imports on the server.
- **A framework Embed gets it through a dynamic `import()`** that the site's bundler splits; the recorder is an ordinary dependency of `@fasterfixes/widget`.
- **Fetched as soon as a Reviewer token is found, started at mount.** The download runs alongside the config request; recording starts once the Project has the Widget enabled and `captureRecording` is not `false`. Nothing waits for idle time or a first interaction: only Reviewers pay the cost, and a buffer that does not survive a page load cannot afford a late start.
- **A Recording asks nothing more of a Content Security Policy than the Widget does.** The second file is inserted as a `<script>` element carrying the nonce of the script that inserts it, never a dynamic `import()`, which cannot carry one. The recorder runs no worker and evaluates no string as long as canvas capture stays off. No Subresource Integrity on the second file.
- **A failed or late load is silent.** No Recording, no line in the comment form, no retry during the page session, no wait at the Selection, nothing in the console. The Feedback is created as before.
- **One size ceiling per file.** The build already fails when the script goes over its ceiling (`IIFE_MAX_BYTES` in `packages/widget/tsdown.config.ts`); the recorder file gets its own ceiling by the same mechanism. The script grows by the loader only, and its ceiling is raised in a commit of its own if the loader does not fit.
- **The cost on the page is bounded three ways**, with figures set at implementation: past a threshold of mutations the current slice of the buffer is dropped and recording resumes with the next one; no periodic snapshot is taken while the tab is hidden; pointer movement and scrolling are sampled. The recorder stays on the main thread.

Rejected: bundling the recorder into the script (every visitor without a token pays for it); loading it at idle or on first interaction (shorter coverage, nobody protected). Left for later: loading `modern-screenshot` the same way, which would lighten the script further but makes a failed load cost a Screenshot.
