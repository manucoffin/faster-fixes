# Every convention rule is always on; the agent gate is removed

- **Status**: Accepted, not yet implemented
- **Date**: 2026-09-20

Every rule of the `local/` ESLint plugin runs at `error` in plain `pnpm lint`. The
`ESLINT_AGENT_RULES` environment gate and the `pnpm lint:agent-rules` script are removed, a
CI job runs typecheck, lint and tests for `apps/web` on every pull request, and an
`eslint-disable` comment needs a written reason and cannot target a boundary rule. This
reverses the gate criterion the architecture document recorded at the end of the migration.

## Why

The lint rules exist so that agents can work autonomously while the code stays inside the
coding standards. A rule only does that job if something the agent does not control runs it.

The gate was introduced in March 2026 because the existing tree violated the first five
convention rules: gating them let agents hold new code to the rules without breaking the
commit hook. The migration then reused it as a burn-down counter (131 warnings down to 0),
and its exit kept it on a stated criterion: a rule that guards correctness or security is
always on, a rule that enforces a convention stays gated, "because taking a rule out of the
gate is the same as adding it to the commit hook", and so that plain `pnpm lint` stays
"fast and stable".

Measured on the finished tree, none of that holds:

- **Fast.** Gated and ungated lint both take about four seconds over the web app.
- **Stable.** Both report zero problems, so no rule can destabilise a commit today.
- **The commit hook.** Joining the hook is the point. Behind the gate, nine of fourteen
  rules ran only when an agent remembered to type the command: not in lint-staged, not in
  CI, which linted the published packages and never `apps/web`.
- **The criterion was not applied as written.** `no-client-import-of-services` and
  `schema-must-be-pure-zod` guard against server code reaching the client bundle, a
  correctness property, and both sat behind the gate with no recorded reason.
- **The gate made exceptions impossible.** Plain lint reports a disable comment for a gated
  rule as unused, so every exception had to become rule code or a path pattern.

## Considered options

- **Keep the gate for taste rules only** (naming, Tailwind colours). Rejected: a convention
  worth writing a rule for is worth enforcing on every commit, and one that is too
  irritating to enforce should be deleted rather than hidden behind an environment variable.
- **Keep the gate and run it in CI.** Rejected: it keeps two lint modes to document, wire and
  test, for a distinction that no longer changes the outcome.

## Consequences

- A human commit is now blocked by a naming or colour convention. The escape is an
  `eslint-disable` with a reason, enforced by `eslint-comments/require-description`.
- The boundary rules (client/server imports, cross-domain imports, the server folder lock,
  `require-server-action-suffix`, the layer import table) cannot be disabled by comment. An
  exception to one of them is a named entry in `packages/eslint-config/next.js`, reviewed
  like the three server folder exemptions.
- The hook lints staged files only and `--no-verify` skips it, so the CI job is the
  enforcement of record; the hook is fast feedback.
- The "Which gate a rule belongs in" paragraph and the `pnpm lint:agent-rules` row of
  `docs/architecture/target-architecture.md`, the "Required checks" section of `AGENTS.md`,
  `packages/eslint-config/README.md` and the gate assertions in
  `packages/eslint-config/next-config.test.js` describe the gate and change with it.
- Rules stay custom `local/` rules rather than `no-restricted-syntax` or
  `no-restricted-imports` blocks: flat config replaces, rather than merges, two blocks of the
  same core rule matching one file, so a later block silently cancels an earlier one. The
  server folder lock remains the single use of the core rule, and a test pins it.
