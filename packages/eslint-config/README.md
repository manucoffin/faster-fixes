# `@workspace/eslint-config`

Shared eslint configuration for the workspace.

## Local convention rules

`local-rules/` holds the project convention rules, exported as the `local/`
plugin from `local-rules/index.js` and wired per file glob in `next.js`.

Severities come from two constants in `next.js`:

- `agent`: `warn` when `ESLINT_AGENT_RULES=1`, otherwise `off`. The warning
  count per rule is the architecture migration burn-down metric. Only
  `no-raw-tailwind-colors` is still on this ramp.
- `migratedSeverity`: `error` when `ESLINT_AGENT_RULES=1`, otherwise `off`. The
  rules of migration steps 2 and 3 sit here since the step 3 final lock, so a
  violation is a regression on migrated code rather than a burn-down item.

Rules that guard a security boundary (`require-server-action-suffix`) and the
built-in `no-throw-literal` are `error` regardless of the gate.

Every rule has a colocated `*.test.js` `RuleTester` suite:

```sh
pnpm --filter @workspace/eslint-config test
```
