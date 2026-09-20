# `@workspace/eslint-config`

Shared eslint configuration for the workspace.

## Local convention rules

`local-rules/` holds the project convention rules, exported as the `local/`
plugin from `local-rules/index.js` and wired per file glob in `next.js`.

Every rule is `error`, with no environment gate and no per-scope allowlist
(ADR-0015): `pnpm lint` is the single lint mode, so lint-staged, CI and an agent
all run the same set. Every rule reports nothing today, so a report is a
regression.

The boundary rules are `require-server-action-suffix`,
`no-client-import-of-server-errors`, `no-client-import-of-services`,
`no-cross-domain-deep-import` and the `no-restricted-imports` lock on
`src/server/`. An exception to one of them is a named entry in `next.js`,
reviewed like the three server folder exemptions, not a disable comment.

Two rules take options from `next.js`: `require-schema-conventions`
(`requirePascalCaseSchema`, `requireSingularInput`) and `no-raw-tailwind-colors`
(`allowPatterns`, `ignorePathPatterns` for the four home page illustrations).
`require-use-client-suffix` takes the Next.js special file names as
`ignorePathPatterns`. No other rule declares an option.

`local-rules/imports.js` is the shared import view, not a rule: it visits the
four import forms (static `import`, `export … from`, `export *`, dynamic
`import()`), resolves a relative specifier against the importing file and
expresses it in its `@/` alias form, classifies an import as value or type, and
answers whether a file is a client module. Every import rule reads it, so a hole
closed once is closed everywhere. It has no test suite of its own: it is
observed through the rules that consume it.

`next-config.test.js` tests the wiring: a rule wired on the wrong glob matches
nothing and reports nothing, which looks exactly like passing.

Every rule has a colocated `*.test.js` `RuleTester` suite:

```sh
pnpm --filter @workspace/eslint-config test
```
