# Architecture Decision Records

This directory holds the architectural decisions for the Faster Fixes repo. Each ADR captures **one decision**, the alternatives that were considered, and the reasoning behind the choice — so a developer six months later can understand _why_ the codebase looks the way it does.

## Conventions

- One file per decision: `NNNN-short-kebab-title.md` (e.g. `0001-event-sourced-orders.md`).
- Numbering is monotonic and never reused, even if a decision is later superseded.
- ADRs are produced lazily by `/grill-with-docs` when an architectural decision actually needs to be pinned down. Don't create speculative ADRs upfront.

## Suggested template

```markdown
# ADR-NNNN: <decision>

- **Status**: Proposed | Accepted | Superseded by ADR-XXXX
- **Date**: YYYY-MM-DD

## Context

What's the situation? What forces are at play?

## Decision

What did we decide?

## Alternatives considered

Other options and why they were rejected.

## Consequences

What changes because of this? What new constraints does it create?
```

## Status

- [ADR-0001](./0001-marketing-demo-uses-internal-widget-core.md) — Marketing demo uses an internal widget Core, not new widget props.
- [ADR-0002](./0002-linear-oauth-uses-actor-app.md) — Linear OAuth uses `actor=app` for stable, app-scoped attribution.
- [ADR-0003](./0003-encrypt-tracker-tokens-at-rest.md) — Encrypt Tracker tokens at rest despite Better Auth's plaintext precedent.
- [ADR-0004](./0004-programmatic-blog-images.md) — Programmatic blog images.
- [ADR-0005](./0005-widget-identity-public-id-origin-auth.md) — Widget identifies its Project by a public ID, secured by allowed origins + reviewer token, not a secret API key.
- [ADR-0006](./0006-slack-uses-custom-bot-install-oauth.md) — Slack integration uses a custom bot-install OAuth route, not Better Auth social login.
- [ADR-0007](./0007-agent-api-rate-limit-is-an-abuse-backstop.md) — Agent API rate limit is an abuse backstop keyed per Organization, not an authorization or metering control.
- [ADR-0008](./0008-jira-oauth-uses-user-bound-3lo-tokens.md) — Jira Cloud authorizes via OAuth 2.0 (3LO) user-bound tokens, a deliberate deviation from ADR-0002.
- [ADR-0009](./0009-diagnostic-trail-capture.md) — The Widget captures a Diagnostic Trail of recent console and network activity, redacted client-side.
- [ADR-0010](./0010-app-folder-architecture.md) — App folder architecture: root `_features/` becomes `_domains/`, one bucket set at both tiers, cross-domain access through a per-domain `index.ts`.
- [ADR-0011](./0011-server-file-conventions.md) — Server file conventions: `_services/` is the data/IO layer, verb prefixes declare read versus write, tRPC is thin transport at the scope root.
- [ADR-0012](./0012-domain-errors-and-transport-mapping.md) — Domain errors: one closed `DomainError` vocabulary thrown by services, mapped exactly once at each transport boundary.
- [ADR-0013](./0013-package-extraction-boundaries.md): Package extraction boundaries are reuse-driven, layered and lazy; nothing is extracted from the app until a second consumer exists.
- [ADR-0014](./0014-one-integration-domain.md): One `integration` domain holds every external system, with per-provider subfolders.
- [ADR-0015](./0015-every-convention-rule-is-always-on.md): Every convention rule is always on at `error`; the `ESLINT_AGENT_RULES` gate is removed and CI lints the web app.
- [ADR-0016](./0016-one-vanilla-widget-framework-embeds-are-wrappers.md): The Widget is one vanilla DOM implementation in `@fasterfixes/widget`; the script embed and every framework package are wrappers around it.
