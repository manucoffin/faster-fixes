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
`no-cross-domain-deep-import`, `no-cross-layer-import` and the
`no-restricted-imports` lock on `src/server/`. An exception to one of them is a
named entry in `next.js`, reviewed like the three server folder exemptions, not
a disable comment.

Six rules take options from `next.js`: `require-schema-conventions`
(`requirePascalCaseSchema`, `requireSingularInput`), `no-raw-tailwind-colors`
(`allowPatterns`, `ignorePathPatterns` for the four home page illustrations),
`no-client-import-of-server-folder` (`allowImportPatterns`, the sanctioned
client imports of the server folder, empty today), `services-verb-prefix`
(`readVerbs`, `writeVerbs`, `exemptSuffixes`, the service naming vocabulary),
`schema-must-be-pure-zod` (`allowImportPatterns`, the modules a schema may
import beyond the built-in allowlist) and `no-cross-layer-import` (`rows`, the
layer import table described below). `require-use-client-suffix` and
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

`no-cross-layer-import` is the layer import table: one rule reading a list of
rows from `layerImportRows` in `next.js`, rather than several blocks of the
core `no-restricted-imports` rule. Flat config replaces rather than merges two
blocks of the same core rule matching one file, so a second restriction written
that way would silently delete the first; the core rule therefore stays the
server folder lock's alone, pinned by its test.

A row is a source path pattern, the specifiers that source may not import, the
message an agent gets, and an allowlist of sanctioned specifiers. Rows are read
in order and the first match reports, so a narrow row owns the message. An
allowance lifts its own row only. `runtimeOnly` marks the rows about what
reaches a runtime, where a type import is erased and so does not cross the
boundary. Patterns are regular expressions over the posix path or the
specifier, as in every other rule here.

The nine rows today fall into two halves. Six scope themselves to one bucket
and say what that bucket is for: a domain barrel exports capabilities and not
services or routers (a type-only re-export of a service's output type stays
free); a tRPC router does not import Prisma; a helper imports neither the
database, nor Next.js, nor React; a service does not reach for the request or
the response itself; root `_components/`, `_providers/` and `_constants/` do
not import a domain; and `src/lib/` and `src/utils/` do not import the app
tree. Three watch the whole source tree for a specifier that belongs to one
layer only: `TRPCError` is confined to routers and `src/server/trpc/`; runtime
database imports are confined to `_services/` and `src/server/`; and the
database package is reached through `@workspace/db`, `@workspace/db/types` and
`@workspace/db/generated/prisma/enums`, which closes the deep-import leak
ADR-0013 records.

Two rows carry a named path exemption rather than a specifier allowlist,
because the exception is a whole file and not an import. The helper row spares
the three scope-local API error mappers and the two `NextRequest` test-double
modules: purity is about IO, and `NextResponse.json(…)` is a value
constructor. The service row spares
`api/v1/agent/_services/require-agent-auth.ts`, the one sanctioned exception to
transport agnosticism the backend standard records.

`require-inngest-function-placement` and `no-client-domain-error-instanceof`
are the two conventions of the same lot that are not import-shaped, so neither
is a row of the table and neither is a block of the core `no-restricted-syntax`
rule. The first reports `createFunction` called outside a `*.inngest.ts(x)`
file and a `*.inngest.ts(x)` file outside a `_services/` folder; the Inngest
client in `src/server/inngest/` is wiring and is untouched. The second reports
`instanceof DomainError` in a client module, where the prototype does not
survive serialization and the branch is therefore always false (ADR-0012).

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

## Disable comments

Every `eslint-disable` directive carries a written reason after `--`, enforced
by `eslint-comments/require-description`: an exception explains itself in the
diff or it does not land. `@eslint-community/eslint-plugin-eslint-comments` is
this package's only plugin dependency added for that policy.

`eslint-comments/no-restricted-disable` holds the `notDisableableRules` list in
`next.js`, which is the boundary set above: a directive naming one of them is
reported whether or not it has a reason, and so is a blanket
`/* eslint-disable */`, which would switch them off along with everything else.
A naming, schema or colour rule stays disableable with a reason.

`reportUnusedDisableDirectives` is `error` rather than the flat-config default
of `warn`, so an exception that outlived its reason fails lint on its own terms
rather than only under `--max-warnings 0`.
