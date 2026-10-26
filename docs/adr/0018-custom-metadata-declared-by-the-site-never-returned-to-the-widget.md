# ADR-0018: Custom metadata is declared by the site through a function in the Widget options, stored in its own column and never returned to the Widget

- **Status**: Accepted
- **Date**: 2026-10-26

## Context

A customer debugging a Feedback wants the context only their site knows: which user was signed in, which release was deployed, which tenant or feature flag was active. The Widget captures a Diagnostic Trail and an element context, but nothing the host application declares. The obvious design, an option named `metadata`, collides with three existing facts:

- `CreateFeedbackData.metadata` is already a field of the widget HTTP API, filled by the Widget with the element context and pin placement, and ADR-0016 makes that API additive only: the field can be neither renamed nor given a new meaning.
- `FeedbackItem.metadata` is returned by `GET /api/v1/feedback` to every Reviewer of the Project, so anything stored there reaches the browser of every other Reviewer. The API reference labelled the field "Custom metadata", a promise the product never kept.
- A user ID is usually known only after sign-in, long after `init()`, and the Vue, Angular and Svelte Embeds read their options once with no reactivity. ADR-0016 fixes the control contract at seven members on every Embed, so adding a `setMetadata` method would amend that ADR and touch four packages.

## Decision

- **The concept is Custom metadata, and the word is used in full everywhere**: the public option `customMetadata`, the HTTP field `customMetadata`, the column `Feedback.customMetadata Json?`, the glossary term, the UI label and the docs page. The bare word "metadata" keeps its current, widget-internal meaning. Consistency across option, wire and storage was preferred to the shorter name a Stripe-trained developer would type first.
- **The option takes a plain object or a synchronous function returning one**, evaluated when a Feedback is submitted. The function form is how a value known after sign-in reaches the Widget without re-initialising it, on every Embed, without a new instance member. A throwing function is caught: in development a warning is logged, the Feedback is submitted without Custom metadata, and the Reviewer never pays for the host's bug. No async form: it would delay the submit and open a timeout question nobody asked.
- **The shape is flat: string keys, primitive values** (`string | number | boolean | null`), at most 50 keys, keys up to 40 characters, values up to 500 characters. The Widget normalises (drops extra keys, truncates values, warns in development) and the server applies the same normalisation on ingest, so a Feedback from an outdated client still lands; only a value that is not an object at all is rejected. A flat set renders as a table in the inbox, pastes into an Issue body, reads in one glance over MCP and indexes later; nesting can be added additively, flattening could not be.
- **Stored in a dedicated column, never selected on the widget read path.** Like `diagnosticTrail`, the column is omitted from every response the Widget consumes. Unlike the Trail it is small, so the inbox list selects it and the detail panel shows it without a second request, and a JSONB filter can be added later without a data migration.
- **Fixed at submission.** The widget `PUT` and the dashboard cannot change it; it describes the site at the moment of the report.
- **Independent of `captureDiagnostics`.** A customer who turns capture off for privacy still declares a release version. The Trail is what the Widget observed; Custom metadata is what the site declared.
- **No redaction, one warning.** The developer chose every key. Silently blanking a value they sent would read as a bug. A development-only warning fires when a key matches the Diagnostic Trail's sensitive-parameter denylist, and the docs state plainly not to send secrets or personal data the team should not see in its trackers.
- **Shown everywhere the team reads a Feedback, nowhere a Reviewer does**: a "Custom metadata" section in the detail panel's properties rail, the shared markdown export (dashboard copy buttons and the agent API in markdown), the agent API JSON and `list_feedbacks`, the GitHub and Linear Issue body (a collapsible section after Environment) and the Jira expand. Not in Slack announcements: the short, one-way channel where a sensitive value most easily reaches non-developers.
- **The React Embed holds the latest function in a ref** and hands the Widget a stable delegate, so an inline `customMetadata={() => ...}` never destroys and remounts the Widget on render; a static object is shallow-compared like `labels`. The script embed exposes it through `init()` only; `data-*` attributes stay scalar.

## Alternatives considered

1. **Name the option `metadata`** and map it to another wire field. Rejected by the owner: a permanent gap between the public name, the HTTP field and the column that every maintainer has to know.
2. **Reuse the existing `metadata` field and column**, as the API reference implied. Rejected: it is returned to every Reviewer, and it mixes developer-declared pairs with the Widget's own geometry.
3. **A `setCustomMetadata` instance method** (and `identify()` in the Sentry or PostHog idiom). Rejected: it amends the seven-member contract of ADR-0016 and needs four wrapper changes; the function form reaches the same freshness through the option object the wrappers already forward unchanged.
4. **Arbitrary JSON bounded by total size.** Rejected: it does not render as a table, does not filter and cannot be flattened later.
5. **A first-class user identity** (`user: { id, email, name }`, linked to the Reviewer). Deferred: a product feature of its own, with PII and Reviewer-token questions; a `userId` key covers the debugging need today.
6. **Reject an oversize payload with 400.** Rejected: the Feedback of a Reviewer must never be lost to a developer's oversight; the Feedback always lands, Custom metadata is best effort.
7. **Filtering the inbox by key and value in the same release.** Deferred: display, mirroring and the agent surface are already a complete lot; the storage choice keeps the filter a pure addition.
8. **A `data-custom-metadata` JSON attribute** on the script tag. Rejected: fragile to quote, static only, a third install path to document and test.

## Consequences

- `@fasterfixes/core` gains the field on `CreateFeedbackData` (minor), `@fasterfixes/widget` gains the option (minor); the four framework Embeds forward it unchanged, the React one adding the ref indirection. ADR-0016's "same option object on every Embed" rule applies: an Embed without `customMetadata` is a bug.
- The API reference corrects the `metadata` row to "element context and pin placement, set by the Widget" and documents `customMetadata`. The widget docs gain a "Custom metadata" page with one tab per Embed and the sign-in, release and tenant recipes; each install page's Options table points to it.
- The MCP package's `FeedbackJson` type, which already omits `metadata` and `diagnosticTrail` the server sends, is completed with all three fields.
- The agent create API does not accept Custom metadata for now; the field is additive and can be opened later.
