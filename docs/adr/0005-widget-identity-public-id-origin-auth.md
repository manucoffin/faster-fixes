# The widget identifies its Project by a public ID, secured by allowed origins + reviewer token — not a secret API key

- **Status**: Accepted
- **Date**: 2026-05-30

The widget previously embedded a per-Project `apiKey` (`ff_` + 256-bit random), stored SHA-256-hashed at rest with only the last 4 chars shown and a "regenerate" flow — i.e. treated as a secret. But the key ships in the customer's client bundle (e.g. `layout.tsx` reads `NEXT_PUBLIC_FF_API_KEY`), so it was never actually confidential. We are replacing it: the widget embeds the public `publicId` (`proj_` + 96-bit random), and a request is authorized by (1) the browser-set `Origin` matching the Project's registered **domain or a subdomain of it**, and (2) a per-**Reviewer token**. Genuine secrets remain only on the agent/MCP surface (`ff_agent_` tokens).

## Why

- The widget identifier is unavoidably public (embedded in client code). Hashing it and showing only the last 4 implied a confidentiality the value never had. The real controls were already `validateOrigin` + the Reviewer token; the `apiKey` only **resolved the Project** and **bucketed the rate limit** — both of which `publicId` does equally well (and `publicId` is indexed, whereas `apiKeyHash` was not).
- Exposing `publicId` in the widget adds **no risk over today**: it already exists on every Project, is already public (shown as "Project ID", used by the agent API), and is 96-bit random (unguessable). The only endpoint reachable with the bare identifier is `GET /api/v1/widget/config` → `{ enabled, branding }`. Reading or submitting Feedback requires the Reviewer token, which the identifier cannot mint (reviewer tokens are created in the dashboard and delivered to reviewers by URL param / localStorage — there is no public minting endpoint).

## Allowed origins = domain + subdomains, not a free-form allowlist

`projects` is the billed unit (Free 1 / Pro 5 / higher ∞) and a Project is _one website_. A free-form domain allowlist would let one Project serve unrelated sites under a single billable unit, **bypassing per-website pricing**. Instead, a Project's widget is allowed on its registered domain and any subdomain (`*.acme.com`) plus localhost. This covers the real need — staging / preview / app environments of the _same_ site — without letting one Project span unrelated domains. An unrelated domain (`otherclient.com`) does not match and therefore requires its own Project, which is billed.

## Alternatives considered

- **Keep a distinct publishable key (`pk_`-style): public, but separate from `publicId`.** Rejected. Its only real advantage over `publicId` is independent rotation and a future home for per-key scopes; but with origin as the security boundary, **editing the domain already provides revocation**, so rotation is largely redundant. Re-introducing a scoped-key table later is additive and back-compatible, so we defer it (YAGNI) rather than carry a second public identifier now.
- **Make the widget key a genuine secret** (server-side proxy, signed tokens). Rejected: a large redesign for a surface that is structurally public, and the secret need is already met by agent tokens.
- **Free-form multi-domain allowlist** (the original request). Rejected: leaks per-Project pricing, as above.

## Consequences

- `resolveProject` accepts **both** `proj_` (lookup by `publicId`, indexed) and legacy `ff_` (lookup by `apiKeyHash`) via **prefix routing**, so live customer installs keep working with zero code changes on their side. The migration is staged and non-breaking.
- The only irreversible step — dropping `apiKeyHash` / `apiKeyLastFour` and the legacy fallback — is **gated on telemetry showing zero legacy `ff_` resolutions over a sustained window**, not a guessed deadline. The legacy branch logs each resolution for this purpose.
- Rate limiting re-keys from `apiKeyHash` to `project.id` (identical behaviour for both resolution paths).
- The `@fasterfixes/react` **`apiKey` prop name** and the **`X-API-Key` header** are retained for backward compatibility; the value is now a `publicId`. Renaming them is a breaking package change deferred to a future major version.
- `validate-origin.ts` loosens to allow subdomains (suffix match with a leading-dot boundary, so `evil-acme.com` and `acme.com.evil.com` do not match). Strictly additive — existing exact-domain matches still pass.
- The "regenerate API key" feature is retired. **Do not** re-introduce a secret widget key to "harden" the widget — the surface is public by design and the security lives in allowed origins + Reviewer token. The asymmetry with agent tokens (which _are_ real secrets) is deliberate.
- Step-by-step migration tasks live in `_internals/publishable-key-migration-plan.md`.
