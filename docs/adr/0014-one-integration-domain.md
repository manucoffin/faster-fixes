# One `integration` domain holds every external system, with per-provider subfolders

All code bound to GitHub Issues, Linear, Jira and Slack lives in a single domain,
`apps/web/src/app/_domains/integration/`, sub-structured by provider inside each bucket
(`_services/jira/`, `_services/slack/`, `_helpers/linear/`). **Integration** is the
glossary's umbrella term for an external system Faster Fixes connects to; **Tracker** and
**Notification channel** are its two categories and stay glossary terms, but neither is a
folder.

## Why

The code was written one folder per provider under `src/server/`, and the glossary
separates Trackers (two-way mirror) from Notification channels (one-way announce), so both
"one domain per provider" and "a `tracker` domain plus a `notification-channel` domain"
were legal readings. Both were rejected for the same reason: a domain is scoped to glossary
entities, and two of the three entities here span the categories. **Installation** and
**Project link** are defined for a Tracker and for a Notification channel alike; only
**Issue link** is Tracker-specific. Splitting by category leaves Installation owned by no
domain, and splitting by provider puts no glossary term behind any folder name. The
categories describe behaviour, not entity boundaries.

Three practical points weighed in:

- The Jira issue body reuses the GitHub formatter. Under a per-provider split that is a
  cross-domain import of an implementation, which a barrel may not export.
- The OAuth state cookie and the four near-identical token `crypto.ts` files can be
  factored inside one domain. Across two domains the only legal move would be lifting them
  into `src/server/`.
- Planned Integrations (Notion, Telegram) never force a "which domain" decision. Telegram is
  a Notification channel; Notion is a Tracker if Feedback is mirrored as a page whose status
  converges. An inbound source would be a third category and still lands in the same
  domain.

## Consequences

- The domain is large (roughly sixty files once the Inngest functions and the webhook and
  OAuth services join it). The per-provider subfolders are what keep it navigable; a file
  shared by several providers sits at the bucket root.
- A category is visible in behaviour and in the glossary, not in the folder tree. A reader
  looking for "everything a Tracker does" reads three provider folders.
- The route scopes `(authenticated)/integrations` and `(authenticated)/(project)` keep their
  own `_services/`; they call into the domain and do not move into it.
- **A shared mechanism is a service at the bucket root; each provider's constant configuring
  it stays a helper under that provider.** `_services/oauth-state-cookie.ts` holds the cookie
  mechanism, `_helpers/<provider>/oauth-state-cookie.ts` holds the provider's own cookie name
  and lifetime. A fifth provider follows that split rather than copying the mechanism.
- Slack keeps its own OAuth state constants at the move and deliberately does **not** adopt
  `OAuthStateCookie`: it still carries two plain constants. That inconsistency is scoped out,
  not overlooked. Aligning it with the shared cookie is a behaviour change and is tracked
  separately.
