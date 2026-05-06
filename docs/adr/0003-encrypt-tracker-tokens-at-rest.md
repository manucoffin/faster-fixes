# Encrypt Tracker tokens at rest, even though Better Auth stores user OAuth tokens in plaintext

`LinearInstallation.accessToken` and `refreshToken` are encrypted at rest with AES-256-GCM, keyed by `LINEAR_TOKEN_ENCRYPTION_KEY`. The Better Auth `Account` model in the same database stores user `accessToken` / `refreshToken` as plaintext. (The Linear webhook signing secret is app-level, lives in env as `LINEAR_WEBHOOK_SIGNING_SECRET`, and is therefore not in DB scope.)

## Why

The asymmetry is deliberate.

A Better Auth user OAuth token is scoped to a single end-user's data with the upstream provider. If one such token leaks, the blast radius is one user.

A Linear OAuth token issued under `actor=app` (see ADR-0002) grants write access across an entire customer's Linear workspace — every team, every issue, every label. One leaked token compromises a whole organization's tracker data, and we hold one such token per customer. The blast radius asymmetry justifies the asymmetric protection.

Application-level encryption (tier 2) protects against the most realistic compromise vector at our scale: a leaked DB backup or read access to prod data without simultaneous compromise of the running application's environment. KMS-managed envelope encryption (tier 3) was rejected as overkill until customer count and compliance posture warrant it.

## Consequences

- `LINEAR_TOKEN_ENCRYPTION_KEY` is required at boot. Missing or malformed keys must fail loud, not silently degrade.
- Key rotation requires a re-encryption migration. Plan for it; don't rotate casually.
- Future Tracker integrations (e.g. Jira, GitLab) that store long-lived workspace-scoped tokens should follow this pattern. GitHub App installation tokens are minted just-in-time from a JWT-signed app key and don't fall under this ADR.
- Do **not** "fix" the asymmetry by ripping out encryption to match Better Auth. The asymmetry is the decision.
