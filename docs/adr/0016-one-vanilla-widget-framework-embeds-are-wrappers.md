# ADR-0016: The Widget is one vanilla DOM implementation; every Embed is a wrapper around it

- **Status**: Accepted
- **Date**: 2026-09-26

## Context

The Widget ships today as `@fasterfixes/react` only. All of its UI (about 54 KB unminified) is React, styled with inline style objects, portalled into `document.body` without Shadow DOM. `@fasterfixes/core` is already framework-free and holds no UI. The docs and three marketing comparison pages promise a non-React install that does not exist.

The product wants one thing first: a script tag that installs the Widget on any site (WordPress, Webflow, static HTML, and also Vue, Angular or Svelte apps), with the same customization as the React package. Later, dedicated packages for Vue, Svelte and Angular will follow, on demand. Two constraints were set before designing: the smallest possible footprint on the customer's page, and the cleanest structure for several Embeds to share, with no deadline pressure. A third constraint came from customers who already installed the Widget: nothing they run may stop working.

The glossary now names the pieces: the **Widget** is the in-page reporting UI, an **Embed** is a way of installing it (script embed, React embed, later Vue and others), and an Embed changes how the Widget is installed, never what it does.

## Decision

- **One UI, written in vanilla DOM, in a new published package `@fasterfixes/widget`.** It depends on `@fasterfixes/core` and holds everything visual: floating button, annotation overlay, pins, popovers, feedback list, screenshot capture, SPA navigation detection. `@fasterfixes/core` stays headless: HTTP client, Diagnostic Trail, selectors, Reviewer token. The pin placement math and the screenshot code move out of the React package into the widget package.
- **Every Embed is a thin wrapper around `@fasterfixes/widget`.** `@fasterfixes/react` becomes one: `FeedbackProvider` mounts the widget instance in an effect, `useFeedback` delegates to the instance methods, `children` is unchanged. Future framework packages are the same wrapper in their framework's idiom, published only when a customer asks (ADR-0013's second-consumer gate).
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
