# `@workspace/eslint-config`

Shared eslint configuration for the workspace.

## Local convention rules

`local-rules/` holds the project convention rules, exported as the `local/`
plugin from `local-rules/index.js` and wired per file glob in `next.js`.

Convention rules take their severity from one constant in `next.js`,
`migratedSeverity`: `error` when `ESLINT_AGENT_RULES=1`, otherwise `off`. Every
convention rule reports nothing today, so a report is a regression.

Rules that guard a security or correctness boundary are `error` regardless of
the gate: `require-server-action-suffix`, `no-client-import-of-server-errors`,
`services-no-bare-error`, `no-cross-domain-deep-import`, the
`no-restricted-imports` lock on `src/server/` and the built-in
`no-throw-literal`.

Every rule has a colocated `*.test.js` `RuleTester` suite:

```sh
pnpm --filter @workspace/eslint-config test
```
