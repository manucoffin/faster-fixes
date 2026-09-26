# ADR 0006: Slack integration uses a custom bot-install OAuth route, not Better Auth social login

**Status:** Accepted
**Date:** 2026-05-31

## Context

Faster Fixes uses Better Auth for application login, which ships a Slack social provider ("Sign in with Slack"). When adding the Slack notification integration, the obvious-looking shortcut is to reuse that provider.

But the two solve different problems:

- **Better Auth Slack provider** is OpenID Connect _user sign-in_. It authenticates a person into Faster Fixes and stores a user-scoped OIDC token against a `user` in Better Auth's `account` table, tied to a login session.
- **The notification integration** needs a _workspace bot install_: an Organization authorizes the Faster Fixes app to post into its channels, yielding a bot token (`xoxb-`) that lives at org level and persists with no human logged in.

A login token cannot post to a channel as the app, and it disappears when the dev logs out — so the bot must be installed and stored independently of any user session. This mirrors the situation already solved for Linear (ADR 0002) and GitHub: integration connections are org-owned and live outside Better Auth.

## Decision

We will connect Slack via a **custom OAuth route**, mirroring the existing Linear integration: `/api/slack/install` (owner/admin gate, state cookie, redirect to Slack `oauth/v2/authorize` with bot scopes) → `/api/slack/callback` (verify state, exchange the code at `oauth.v2.access`, encrypt and store the `xoxb-` bot token on a per-org `SlackInstallation`). The bot token is encrypted at rest under the same scheme as tracker tokens (ADR 0003).

Better Auth's Slack provider is reserved for a future, separate "Sign in with Slack" login feature, if we ever add one.

## Consequences

- The Slack connection is org-scoped and outlives any individual user session — correct for a shared notification channel.
- We reuse the Linear integration's `crypto.ts`, state-cookie, and owner/admin authorization, keeping integrations structurally uniform.
- We own the bot-token lifecycle (storage, revocation on disconnect) ourselves rather than leaning on Better Auth's session machinery.
- A future dev who sees the Better Auth Slack provider will wonder why it is unused for this; this ADR is the answer.

## Alternatives considered

- **Better Auth Slack social provider**: rejected. It is user-login OIDC — token is user-scoped, session-bound, and stored against a `user`; it cannot act as the app to post messages, and it breaks when the authorizing user logs out or leaves.
- **Better Auth `genericOAuth` plugin**: rejected. It can run an arbitrary OAuth2 flow but stores tokens per-user in the `account` table and models org-level bot installs poorly — fighting the framework for no gain over the proven Linear pattern.
