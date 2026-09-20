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
`no-client-import-of-server-folder`, `no-client-import-of-services`,
`no-cross-domain-deep-import` and the `no-restricted-imports` lock on
`src/server/`. An exception to one of them is a named entry in `next.js`,
reviewed like the three server folder exemptions, not a disable comment.

Five rules take options from `next.js`: `require-schema-conventions`
(`requirePascalCaseSchema`, `requireSingularInput`), `no-raw-tailwind-colors`
(`allowPatterns`, `ignorePathPatterns` for the four home page illustrations),
`no-client-import-of-server-folder` (`allowImportPatterns`, the sanctioned
client imports of the server folder, empty today), `services-verb-prefix`
(`readVerbs`, `writeVerbs`, `exemptSuffixes`, the service naming vocabulary) and
`schema-must-be-pure-zod` (`allowImportPatterns`, the modules a schema may
import beyond the built-in allowlist). `require-use-client-suffix` and
`no-default-export` both take the Next.js special files as
`ignorePathPatterns`, from one list in `next.js`: the framework owns those
files' names and shapes, so neither the `.client.tsx` suffix nor a named export
can apply to them. The pattern is anchored on the whole basename, so a module
merely ending in one of their words (`edit-page.tsx`) is not exempt. No other
rule declares an option.

`no-default-export` is wired on the whole web app source, not on
`src/app/_domains/`: "never use default exports" is a repo-wide convention. It
reports `export { X as default }` as well as `export default`, and leaves
`export { default as X } from "…"` alone, which is how a third-party default is
consumed.

`require-server-action-suffix` holds a function-level `'use server'` directive
to the same rule as a module-level one: an inline server action is the same
public endpoint, under no name a reader can search for.

`schema-must-be-pure-zod` is an allowlist rather than a denylist: a schema may
import `zod`, another `*.schema` file, `@workspace/db/generated/prisma/enums`
and the three modules `schemaPurityOptions` names, and every other runtime
import is reported. A denylist only knew the leaks somebody had already met, so
the next server-only specifier to appear in a schema was admitted by default.
A type-only import stays free, whatever it points at.

`serviceVerbOptions` in `next.js` is the service naming vocabulary in one
place. The read verbs are closed (extending them is an ADR change, not a config
change); the write verbs are open, so coining a domain verb is a one-line,
reviewed addition there and the rule's report says where; the exempt suffixes
name the `_services/` modules that are not operations (an SDK client, an error
class, a token cipher, a cookie reader, the GitHub App factory).

`require-service-output-type` carries both halves of the output type
convention, which is why it is wired on the whole source tree rather than on
`_services/`: a read service exports `<Service>Output` built from `typeof` its
own service, and no consumer infers the same type with `inferProcedureOutput`
or `inferRouterOutputs`.

`local-rules/_deprecated_no-client-import-of-server-errors.js` and
`local-rules/_deprecated_require-trpc-output-type.js` are the empty stubs of the
rules `no-client-import-of-server-folder` and `require-service-output-type`
replaced. Nothing imports them; they are the maintainer's to delete.

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
