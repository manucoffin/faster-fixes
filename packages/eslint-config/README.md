# `@workspace/eslint-config`

Shared eslint configuration for the workspace.

## Local convention rules

`local-rules/` holds the project convention rules, exported as the `local/`
plugin from `local-rules/index.js` and wired per file glob: in `base.js` for the
generic rules every workspace is held to, in `next.js` for the web app.

Every rule is `error`, with no environment gate and no per-scope allowlist
(ADR-0015): `pnpm lint` is the single lint mode, so lint-staged, CI and an agent
all run the same set. Every rule reports nothing today, so a report is a
regression.

## The rule set

Twenty-five rules, every one `error`. The glob is the one it is wired on in `next.js`, or in
`base.js` where the row says so; "options" names the constant it reads.

| Rule                                  | Glob                     | Holds                                                                                             | Options                    |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------- | -------------------------- |
| `no-client-domain-error-instanceof`   | `**/*.{ts,tsx}`          | `instanceof DomainError` in a client module is always false; branch on `error.data.code`          |                            |
| `no-client-import-of-server-folder`   | `**/*.{ts,tsx}`          | a client module imports no runtime value from `@/server/**`                                       | `allowImportPatterns`      |
| `no-client-import-of-services`        | `**/*.{ts,tsx}`          | a client module imports no `_services/` path, bar `*.schema.ts` and type-only imports             |                            |
| `require-server-action-suffix`        | `**/*.{ts,tsx}`          | a `'use server'` directive, at module or function level, belongs only in `*.server.action.ts`     |                            |
| `no-cross-domain-deep-import`         | `**/src/app/_domains/**` | another domain is reached through its barrel, by alias, in every import form                      |                            |
| `no-cross-layer-import`               | `**/src/**/*.{ts,tsx}`   | the layer import table: nine rows, described below                                                | `layerImportRows`          |
| `no-default-export`                   | `**/src/**/*.{ts,tsx}`   | no `export default` and no `export { X as default }`, Next.js special files excepted              | `noDefaultExportOptions`   |
| `require-use-client-suffix`           | `**/src/**/*.{ts,tsx}`   | a `'use client'` module is named `*.client.ts(x)` and a `*.client.ts(x)` carries the directive    | `useClientSuffixOptions`   |
| `require-service-output-type`         | `**/src/**/*.{ts,tsx}`   | a read service exports `<Service>Output`; no consumer infers it from the router                   |                            |
| `require-inngest-function-placement`  | `**/src/**/*.{ts,tsx}`   | `createFunction` sits in an `*.inngest.ts(x)` file, and that file in a `_services/` folder        |                            |
| `no-restricted-patterns`              | `**/src/**/*.{ts,tsx}`   | (`base.js`) no `enum`, no `as unknown as`, no `query.data ?? []`                                  | `restrictedPatternOptions` |
| `no-em-dash-in-copy`                  | `**/src/**/*.{ts,tsx}`   | (`base.js`) no em dash in a string literal, JSX text or a template chunk                          |                            |
| `kebab-case-path`                     | every linted file        | (`base.js`) every folder and file name is kebab-case; `_` buckets and route segments excepted     |                            |
| `no-form-state-prop`                  | `**/src/**/*.{ts,tsx}`   | a react-hook-form `formState` is never handed to a child as a whole                               |                            |
| `no-form-mutation-in-effect`          | `**/src/**/*.{ts,tsx}`   | no form `reset` or `setValue` inside an effect: `useForm({ values })` or the event handler        |                            |
| `error-boundary-renders-error-screen` | `**/src/app/**/*.tsx`    | `error.tsx` and `global-error.tsx` render `ErrorScreen` and read no `message`, `stack`, `digest`  |                            |
| `no-feature-nesting`                  | `**/_features/**`        | one grouping level under a features folder, and no features folder inside one                     |                            |
| `services-verb-prefix`                | `**/_services/**`        | the basename carries a verb from the vocabulary, and the export is named after the file           | `serviceVerbOptions`       |
| `services-read-never-writes`          | `**/_services/**`        | a read-verb file calls no Prisma write method on a database client                                | `serviceVerbOptions`       |
| `services-no-trpc-import`             | `**/_services/**`        | a service imports no tRPC                                                                         |                            |
| `services-no-bare-error`              | `**/_services/**`        | a service throws a `DomainError` subclass, not `new Error(...)`                                   |                            |
| `require-schema-conventions`          | `**/*.schema.ts`         | `*Schema` names, `Input` as `z.infer` and `Values` as `z.input`, no `z.nativeEnum`, no `.merge()` | `schemaConventionOptions`  |
| `schema-must-be-pure-zod`             | `**/*.schema.ts`         | a schema imports only what the allowlist names                                                    | `schemaPurityOptions`      |
| `no-relative-test-mock`               | `**/*.test.{ts,tsx}`     | a `vi.mock` names a boundary, never a relative specifier                                          |                            |
| `no-raw-tailwind-colors`              | every linted file        | a hue with a semantic token is written as that token                                              | `rawTailwindColorOptions`  |

`base.js` holds the generic rules of every workspace, the web app and the
packages alike. On every file: `@typescript-eslint/no-unused-vars` with the `_`
convention (a `_` binding is imposed by the caller and ignored on purpose),
`eqeqeq` (`== null` allowed), `object-shorthand` and ASCII identifiers
(`id-match`). On `**/src/**/*.{ts,tsx}`: `consistent-type-definitions` (`type`
over `interface`), `consistent-type-imports`, `no-inferrable-types`,
`no-nested-ternary`, `no-else-return` (no `else if` either) and `max-depth: 3`.

The same glob runs the type-aware rules through the TypeScript project service:
`await-thenable`, `no-floating-promises` (`void` marks a deliberate
fire-and-forget), `no-misused-promises` (JSX attributes excepted),
`no-unsafe-call`, `no-unsafe-enum-comparison`, `no-unnecessary-type-assertion`,
`restrict-template-expressions`, `no-base-to-string`, `no-deprecated`,
`only-throw-error` and `switch-exhaustiveness-check`. They read the generated
types, so a fresh clone builds the packages, the Prisma client and the Next.js
route types before it lints. `next-config.test.js` lints made-up paths, so it
switches them off with `disableTypeChecked`.

`component-shape.js` holds `react/function-component-definition` (a named
component is an `export function`) for the web app and the React packages.

Severity is binary: `severity.js` promotes every `warn` a plugin preset ships
(react-hooks, Next.js, turbo) to `error`, and `binary-severity.test.js` holds
every exported config to it.

The core `no-restricted-imports` is the
`src/server/**` deep-import lock and nothing else.

Two conventions of the tree are held by a test in `apps/web` rather than by lint, because each is a
property of the whole tree: `src/app/_domains/domain-cycles.test.ts` (no domain import cycle) and
`src/mdx-no-em-dash.test.ts` (no em dash in the MDX content).

The coding standards skill at `.agents/skills/coding-standards/` is the reader's half of this
table: every checkable convention there names its rule, and every other one is marked prose only.

## How the rules behave

The boundary rules are `require-server-action-suffix`,
`no-client-import-of-server-folder`, `no-client-import-of-services`,
`no-cross-domain-deep-import`, `no-cross-layer-import` and the
`no-restricted-imports` lock on `src/server/`. An exception to one of them is a
named entry in `next.js`, reviewed like the three server folder exemptions, not
a disable comment.

Ten rules take options from `next.js`, as the table's last column says. Seven of them take options of their own: `require-schema-conventions`
(`requirePascalCaseSchema`, `requireSingularInput`), `no-raw-tailwind-colors`
(`allowPatterns`, `ignorePathPatterns` for the four home page illustrations),
`no-client-import-of-server-folder` (`allowImportPatterns`, the sanctioned
client imports of the server folder, empty today), `services-verb-prefix`
(`readVerbs`, `writeVerbs`, `exemptSuffixes`, the service naming vocabulary),
`services-read-never-writes` (`readVerbs`, the same closed list),
`schema-must-be-pure-zod` (`allowImportPatterns`, the modules a schema may
import beyond the built-in allowlist) and `no-cross-layer-import` (`rows`, the
layer import table described below). `require-use-client-suffix` and
`no-default-export` both take the Next.js special files as
`ignorePathPatterns`, from one list in `next.js`: the framework owns those
files' names and shapes, so neither the `.client.tsx` suffix nor a named export
can apply to them. The pattern is anchored on the whole basename, so a module
merely ending in one of their words (`edit-page.tsx`) is not exempt. The tenth
is `no-restricted-patterns`, whose `allowDoubleCastPathPatterns` is described
with it below. No other rule declares an option.

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

`services-read-never-writes` is the other half of the verb convention: the
prefix rule checks that a service name carries a read verb, this one checks
that the name is true. A file in `_services/` named `get-`, `list-`, `find-`,
`search-`, `has-`, `is-` or `count-` may not call a Prisma write method
(`create`, `update`, `upsert`, `delete` and their bulk forms, `$executeRaw`) on
a database client. The receiver has to be a database client, so
`crypto.createHash(…).update(raw)` and `response.cookies.delete(name)` are not
writes; a read service calling a write _service_ is not reported either, since
that service carries its own verb. It reads the same closed read list the verb
prefix rule declares, passed to both rules from `serviceVerbOptions`.

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

`no-relative-test-mock` is wired on `**/*.test.{ts,tsx}` and reads
`vi.mock`, `vi.doMock`, `vi.unmock` and `vi.doUnmock`, including the
`vi.mock(import("…"))` form. A relative specifier is reported: a test mocks at
a boundary, spelled as an alias or a package (`@workspace/db`, `@/server/…`,
`@/lib/…`, an external package, another domain's barrel), and a relative path
either points inside the test's own scope or spells a boundary as if it were
one. It is not a boundary rule, so a genuine one-off is a disable comment with
a reason.

`no-restricted-patterns` holds the three shapes with no plugin rule to lean
on, in one rule rather than a second block of the core `no-restricted-syntax`
rule, for the same reason the layer import table is one rule: a second block
matching the same file would replace the first. It reports a TypeScript `enum`
(the standard prefers a `const` object plus a union of its values), an
`as unknown as` double cast, and `query.data ?? []`, where the fallback renders
a failed read as an empty list and the child shows its empty state instead of
the error. Each message names the alternative.

Its one option, `allowDoubleCastPathPatterns` in `restrictedPatternOptions`,
spares `*.test.ts(x)` the double cast: a service test builds a partial fake of
the Prisma client and passes it through the dependency-injection seam, whose
parameter type is the real client. The enum and the fallback are still reported
in a test file.

`no-em-dash-in-copy` holds the one punctuation non-negotiable of the house
style. It reports the em dash character in a string literal, in JSX text and in
a static chunk of a template literal, and names the replacement: a comma, a
colon or a period, whichever reads correctly in the sentence. A comment is not
user-facing, so the rule never visits one. It does not sort user-facing strings
from internal ones, because an internal string has no use for the character
either. MDX is the other half of the convention and ESLint cannot parse it:
`apps/web/src/mdx-no-em-dash.test.ts` reads those files directly and fails on
the same character.

`local-rules/imports.js` is the shared import view, not a rule: it visits the
four import forms (static `import`, `export … from`, `export *`, dynamic
`import()`), resolves a relative specifier against the importing file and
expresses it in its `@/` alias form, classifies an import as value or type, and
answers whether a file is a client module. Every import rule reads it, so a hole
closed once is closed everywhere, and `no-relative-test-mock` asks it the one
question it needs about a specifier carried by a call rather than an import. It has no test suite of its own: it is
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
