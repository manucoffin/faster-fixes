# ADR-0001: Marketing demo uses an internal widget Core, not new widget props

- **Status**: Accepted
- **Date**: 2026-05-03

## Context

The marketing homepage at `/` needs a live, interactive demo of `@fasterfixes/react` so visitors can directly try the feedback widget. The product hypothesis is that hands-on interaction ("show don't tell") converts better than a screencast or static screenshots.

The widget today assumes a real customer integration: it resolves a reviewer token from cookies, calls the hosted backend for `getConfig` and `getFeedback`, and only renders for authenticated reviewers. None of that fits a public homepage demo where:

- Every visitor must be able to interact, with no signup or token.
- Each visitor sees only their own pins (no cross-visitor pollution).
- No data should hit the production backend.

Two separate constraints made the obvious solutions unattractive:

1. **The widget package is published to npm under MIT** (`@fasterfixes/react`). Anything added to its public API surface is a permanent commitment to all external consumers, not just the marketing app.
2. **Demo-driven feature creep is real.** Features added "because we need them for the demo" calcify into permanent API surface even if no real customer asked for them.

## Decision

- **Extract `FeedbackProviderCore`** from the existing `FeedbackProvider`. The Core takes a resolved `client`, `reviewerToken`, and `config` as props and contains all the widget state, effects, portal mounting, and component composition. The public `FeedbackProvider` becomes a thin wrapper that does the auth/init dance and renders Core.
- **Define a `FeedbackClient` interface** in `@fasterfixes/core` matching the surface used by Core (`getConfig`, `getFeedback`, `createFeedback`, `updateFeedback`, `deleteFeedback`, `attachScreenshot`). The existing `FasterFixesClient` already implements this shape.
- **Expose `FeedbackProviderCore` (and the `FeedbackClient` interface re-export) via `@fasterfixes/react/internal`**, marked with a `@unstable` JSDoc tag declaring no semver guarantee. Add the subpath to the package's `exports` field.
- **Implement `LocalStorageFeedbackClient` in `apps/web`** (not in any published widget package). It satisfies `FeedbackClient` by reading from in-memory curated seed pins and `sessionStorage` for visitor-created pins, with no network calls.
- **The marketing demo** composes `FeedbackProviderCore` directly with the local client, a hardcoded `"demo"` reviewer token, and a synthetic `WidgetConfig`. No init dance runs.
- **No new props on the public `FeedbackProvider`. No server schema changes.**

## Alternatives considered

1. **Add `requireReviewerToken` and `storage: 'local' | 'remote'` props to the public `FeedbackProvider`** (the original plan). Rejected: framed as "real features" but driven entirely by the demo's needs, with no independent customer demand. Adds permanent public API surface, runtime conditionals on every render, and bundle cost on every consumer who never uses local storage. The retroactive justification ("offline dev, e2e tests, trial-before-signup") was thin.
2. **Add a `publicFeedbackEnabled` server flag and harden every read/write endpoint to check it.** Rejected for the demo specifically: the demo runs entirely client-side via session storage and never hits the backend. The flag would only be needed if/when public-feedback-mode becomes a real customer-requested feature.
3. **Server-side ephemeral per-visitor demo projects.** Rejected: backend provisioning + cleanup jobs deliver no user-facing benefit over `sessionStorage` for this use case.
4. **Iframe pointing at a separate `/demo` page.** Rejected: heavier page weight, visual "page within a page" feel, and pinning constrained to the iframe's content rather than the actual marketing copy weakens the "show don't tell" signal.
5. **Video / screencast on the homepage in place of a live demo.** Rejected for the homepage; deferred as the mobile-fallback option if the rough live mobile UX proves problematic.
6. **Internal escape-hatch props on existing `FeedbackProvider`** (an undocumented `client?` / `initialReviewerToken?` / `initialConfig?` set, exported only via `/internal`). Rejected: lurking conditional complexity in the init effect; future contributors reading `feedback-provider.tsx` would have to keep "is this the demo path?" in their head forever, in exchange for ~1 hour saved on the Core extraction.
7. **Don't publish the internal Core via the package's `exports` field; rely on monorepo workspace resolution to give the marketing app source-level access.** Rejected: bundler `exports`-field enforcement varies across versions and tools, and configuring the marketing app to bypass it is fragile. The standard pattern for this case (TanStack Query, Radix UI) is an explicit `/internal` subpath documented as unstable.
8. **Expose individual components (`FloatingButton`, `CommentPopover`, etc.) and the `FeedbackContext` via `/internal`, and have the marketing app build its own provider from primitives.** Rejected: duplicates ~150 lines of state-management code in the demo, which is exactly the duplication the Core extraction avoids.

## Consequences

- The public `@fasterfixes/react` API is unchanged. Existing customers see no behavior difference and no bundle increase.
- `FeedbackProviderCore` and the `FeedbackClient` interface are now reachable from npm under `@fasterfixes/react/internal`. They are documented as unstable, but external consumers may depend on them at their own risk; the social pressure to stabilize them will grow over time.
- The `FeedbackClient` interface becomes the single seam for any future storage backend (offline mode, e2e tests, etc.). If a real customer eventually requests one of those, the wiring already exists.
- Future refactors of the widget's internal state model are free to break `FeedbackProviderCore`'s prop shape — it's marked unstable. Breaks are caught immediately because the marketing demo lives in the same monorepo and will fail typecheck.
- The marketing demo is decoupled from the production backend entirely: no API keys, no rate-limiting concerns, no anti-spam surface, no DB cleanup jobs.
- "Demo mode" is **not** a concept inside the widget package. The widget is unaware it's running a demo. This keeps the package's mental model clean.

## Amendment 2026-09-26: the seam moves to `@fasterfixes/widget/internal`

[ADR-0016](./0016-one-vanilla-widget-framework-embeds-are-wrappers.md) rewrites the Widget UI in vanilla DOM inside `@fasterfixes/widget` and makes `@fasterfixes/react` a wrapper around it. `FeedbackProviderCore` and the `@fasterfixes/react/internal` subpath are removed at the `@fasterfixes/react` 1.0.0 release.

What this ADR decided survives unchanged in substance:

- The `FeedbackClient` interface in `@fasterfixes/core` remains the single seam for running the Widget against another backend.
- Client injection stays off the public API. It is exposed as `@fasterfixes/widget/internal`, `createWidget({ client, reviewerToken, config, ...options })`, marked `@unstable` with no semver guarantee, the same arrangement this ADR chose for React.
- The marketing demo composes that internal entry with `LocalStorageFeedbackClient`, the `"demo"` token and a synthetic `WidgetConfig`. "Demo mode" is still not a concept inside any widget package.

The rejected alternative 1 (public `storage` / `requireReviewerToken` props) stays rejected: `init()` of the vanilla widget takes no `client` option.
