# Migration log

> Temporary. This folder exists only for the duration of the architecture migration and is deleted at the end of step 5, together with `docs/architecture/migration-kit/`. Nothing here is permanent documentation: anything that must outlive the migration belongs in `docs/architecture/target-architecture.md`, an ADR, or the `coding-standards` skill.

## Purpose

The migration moves the web app from its current `_features/` layout to the target architecture, in five steps described in `docs/architecture/migration-kit/`. This log is what makes the move measurable:

- the **baseline** below records how many convention violations existed before any application code moved, per rule, so each later step can be compared against it;
- the **locked scopes** table records which scopes have been migrated and which rules were flipped from `warn` to `error` for them, so a regression on migrated code fails the build;
- the **prerequisites** section records what must be decided or added before the next step starts;
- the **exit verification** section of a completed step records the commands that closed it and what they returned, plus anything left for the maintainer;
- the **deferred** and **anomalies** sections record what a step left behind, so "what is left" is a lookup rather than a rediscovery.

The burn-down metric was `pnpm lint:agent-rules`. From step 1 to the end of step 4 it ran without `--max-warnings 0`: errors failed the command, warnings were counted per rule with:

```sh
pnpm lint:agent-rules | grep -o 'local/[a-z-]*' | sort | uniq -c
```

`--max-warnings 0` returned at the step 4 final lock (issue #107), once every scope was migrated and every convention rule was locked to `error` at zero. The burn-down is over: the command now reports 0 problems, and any report at all, warning or error, is a regression. The counting recipe above is kept because the entries below quote it.

## Baseline

Measured on 2026-09-17 at commit `ebd017c`, after the 14 convention rules landed and before any application code moved. Command: `pnpm lint:agent-rules` from the repo root (gated ESLint over the web app). Result: **131 problems, 0 errors, 131 warnings**.

| Rule                                | Severity in step 1      | Baseline | After step 2 | Note                                                                      |
| ----------------------------------- | ----------------------- | -------: | -----------: | ------------------------------------------------------------------------- |
| `no-raw-tailwind-colors`            | `agent`                 |       88 |           88 | Untouched by step 2: no moved file changed a class name.                  |
| `require-schema-conventions`        | `agent`                 |       28 |           28 | Untouched: schemas moved with their folder, unedited.                     |
| `require-use-client-suffix`         | `agent`                 |       14 |            3 | The 11 files renamed during the move burned down. See amendment 5.        |
| `schema-must-be-pure-zod`           | `agent`                 |        1 |            1 | Untouched.                                                                |
| `no-client-import-of-services`      | `agent`                 |        0 |            0 | No `_services/` folder to import from yet.                                |
| `no-feature-nesting`                | `agent`                 |        0 |            0 | No `_features/` folder nested inside another.                             |
| `no-default-export`                 | `domainRulesSeverity`   |        0 |            0 | Now `error` on `_domains/**`; the `_features/**` transition glob is gone. |
| `services-verb-prefix`              | `servicesRulesSeverity` |        0 |            0 | `_services/` does not exist until step 3.                                 |
| `services-no-trpc-import`           | `servicesRulesSeverity` |        0 |            0 | Same.                                                                     |
| `require-trpc-output-type`          | `servicesRulesSeverity` |        0 |            0 | Same.                                                                     |
| `services-no-bare-error`            | `servicesRulesSeverity` |        0 |            0 | Same. Becomes always-on in step 4.                                        |
| `no-cross-domain-deep-import`       | `error`, always on      |        0 |            0 | `_domains/` now exists and the hardened rule guards it. See below.        |
| `require-server-action-suffix`      | `error`, always on      |        0 |            0 | `*.trpc.query.ts` and `*.trpc.mutation.ts` exempt until step 3.           |
| `no-client-import-of-server-errors` | `error`, always on      |      n/a |            0 | Raised from `off` in issue #58, now that `src/server/errors/` exists.     |

The built-in `no-throw-literal` is on as an error outside the gate and reports zero.

A zero on a rule whose target folder does not exist yet is expected. A zero on a rule that should match existing files means the glob is wrong: verify with `ESLINT_AGENT_RULES=1 npx eslint --print-config <file>` from `apps/web` before trusting it. The `no-default-export` zero was verified this way.

The planning estimate for `require-use-client-suffix` was 11, under the narrower `_domains/**` scope from the kit. Widening the rule to `src/**` raised it to 14.

### Re-measured after step 2

Re-measured on 2026-09-18 at commit `93b5653`, with the root `_features/` folder gone and `_domains/` locked. Same command, run with `--force` so Turbo does not serve a cached run. Result: **120 problems, 0 errors, 120 warnings**, down 11 from the baseline of 131.

The whole burn-down of step 2 is `require-use-client-suffix`, from 14 to 3, because the step renamed every `'use client'` file that reached its final home. The three left are `admin/users/_features/users-table/users-table.tsx`, `admin/users/_features/users-table/users-table-action-dropdown.tsx` and `src/lib/trpc/trpc-provider.tsx`: route-tier and plumbing files that step 2 did not move. The other rules are flat by design, since step 2 moved files and rewrote import paths without editing file bodies.

A zero on `no-cross-domain-deep-import` is now a real zero rather than a vacuous one: the rule has six domains to guard and reports no violation.

## Locked scopes

A scope is locked when its files satisfy the target convention and the matching rules are raised from `warn` to `error` for it.

| Scope                          | Step | Commit    | Rules locked                                                                                                                                                                                                                                                                                                |
| ------------------------------ | ---- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_domains/**`                  | 2    | `930f233` | `no-cross-domain-deep-import`, `no-default-export`                                                                                                                                                                                                                                                          |
| `(public)`                     | 3    | `fb076dd` | `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `services-no-bare-error`, `no-client-import-of-services`, `no-feature-nesting`, `require-schema-conventions`, `schema-must-be-pure-zod`, `require-use-client-suffix`                                                         |
| `_domains/organization`        | 3    | `a9ba3a3` | `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `services-no-bare-error`, `no-client-import-of-services`, `no-feature-nesting`, `require-schema-conventions`, `schema-must-be-pure-zod`, `require-use-client-suffix`                                                         |
| `_domains/user`                | 3    | `ac5a4bb` | `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `services-no-bare-error`, `no-client-import-of-services`, `no-feature-nesting`, `require-schema-conventions`, `schema-must-be-pure-zod`, `require-use-client-suffix`                                                         |
| `_domains/auth`                | 3    | `dc7a8db` | The same nine. The four `(auth)` mutations moved into the domain in the same commit, so the domain owns the whole authentication surface.                                                                                                                                                                   |
| `(auth)`                       | 3    | `dc7a8db` | The same nine. The route group keeps only UI features after its four mutations left, so it was locked in the same commit rather than revisited by a later ticket.                                                                                                                                           |
| `_domains/subscription`        | 3    | `71a0b0c` | `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `services-no-bare-error`, `no-client-import-of-services`, `no-feature-nesting`, `require-schema-conventions`, `schema-must-be-pure-zod`, `require-use-client-suffix`                                                         |
| `onboarding`                   | 3    | `0f67c6a` | `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `services-no-bare-error`, `no-client-import-of-services`, `no-feature-nesting`, `require-schema-conventions`, `schema-must-be-pure-zod`, `require-use-client-suffix`                                                         |
| `(authenticated)`              | 3    | `8b945ba` | The same nine, on the shell tier only: the entry ignores the four child segments until their own tickets lock them.                                                                                                                                                                                         |
| `admin`                        | 3    | `fb4a72f` | The same nine, on the whole admin tier: the admin root, the `(dashboard)` route group (`a7fe9e3`) and `admin/users` (`860de52`, `fb4a72f`). The `admin/users` ignore is gone, so the entry is a plain string again.                                                                                         |
| `(authenticated)/account`      | 3    | `6012c44` | The same nine, on the whole account scope: the billing segment (`2b14b18`) and the settings segment. The `(authenticated)` entry keeps its `account` ignore, so the lock comes from this entry.                                                                                                             |
| `(authenticated)/organization` | 3    | `b21a3cb` | The same nine, on the whole organization scope: the general, leave and received invitations segment (`723c7c1`) and the members segment. Row added in the integrations part 2 commit, which found it missing.                                                                                               |
| `(authenticated)/integrations` | 3    | `ec003fb` | The same nine, on the whole integrations scope: the agent tokens segment (`d60d149`) and the ten installation operations. The `(authenticated)` entry keeps its `integrations` ignore, so the lock comes from this entry.                                                                                   |
| `(authenticated)/(project)`    | 3    | `f3fca41` | The same nine, on the whole Project scope: the inbox (`4f4a646`, `08563bb`), reviewers and core settings (`3e03177`), the GitHub and Slack links (`3f60bf9`), the Jira links (`47c4911`) and the Linear links. The `(authenticated)` entry keeps its `(project)` ignore, so the lock comes from this entry. |
| `api/v1/agent`                 | 3    | `d045ea5` | The same nine, on the whole REST agent API tier: the three `_utils/` folders became `_services/` and `_helpers/`. The handlers keep their own error helper and their `NextResponse` result style, so no rule had to be disabled for them.                                                                   |

`no-cross-domain-deep-import` is always on, outside the agent gate, and was hardened in `51998d2` before the first domain moved. `no-default-export` stays behind `ESLINT_AGENT_RULES=1` but reports at `error` there, so a default export inside a domain fails `pnpm lint:agent-rules` instead of adding a warning to the burn-down. The `_features/**` transition glob was removed from that rule in the same commit: it only ever matched the root folder, which no longer exists, and the route-tier `_features/` folders never matched it. No file under `_domains/` had a default export, so the lock needed no fix.

The `require-server-action-suffix` exemption for `*.trpc.query.ts` and `*.trpc.mutation.ts` was removed at the step 3 final lock (`0f9d293`), once the last role-suffixed file was gone. Since that commit the table above is history rather than configuration: the step's rules are declared once, on their own globs, with no per-scope allowlist, so every scope under `src/app` is locked and a new one is locked the moment it is created. See the step 3 exit verification below.

## Step 2 exit verification

Re-run on 2026-09-18 at commit `2627a87`, the last commit of the step. Every command was run with `--force` so Turbo served no cached result. Recorded here rather than left in a commit message, so the step's exit state is a lookup like everything else in this log.

| Check                                                                          | Result                                                                     |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `pnpm typecheck`                                                               | 4 tasks, clean                                                             |
| `pnpm test`                                                                    | 150 ESLint rule tests, 4 app tests, all passing                            |
| `pnpm lint`                                                                    | 5 tasks, 0 warnings                                                        |
| `pnpm lint:agent-rules`                                                        | 120 problems, 0 errors, 120 warnings, matching the re-measured table above |
| `test ! -d apps/web/src/app/_features`                                         | the folder is gone                                                         |
| `app/_features/` referenced anywhere in `apps/web/src` or `mdx-components.tsx` | no match                                                                   |
| nested `_components/**/*.tsx`                                                  | only the `dashboard/`, `mdx/` and `seo/` sub-libraries                     |
| an `index.ts` per domain, exporting nothing                                    | six of six                                                                 |
| `pnpm build` (web)                                                             | passes with a populated `apps/web/.env.local`                              |

The 22 cases of `no-cross-domain-deep-import.test.js` are the rule's own proof: a relative import into another domain, a relative import of another domain's barrel, and `export { x } from` / `export * from` a deep path are all reported, while same-domain relative and alias imports and any importer outside `_domains/` stay valid.

### Left for the maintainer

1. **`pnpm build` needs a populated `apps/web/.env.local`.** Without one it fails at "Collecting page data" on missing R2 and `JIRA_TOKEN_ENCRYPTION_KEY` values, which is environment, not anything step 2 changed. A gitignored `.env.local` holding dummy values was written for the smoke test and left in place, because this repo forbids the agent from deleting files. It is untracked, so it never reaches a commit. Remove or replace it when convenient.
2. **Route rendering is unverified.** The build proves the client/server boundaries of the moved layouts and the MDX registry; it does not prove the pages still render. Home, a `/vs/*` page, a blog article, login, the inbox, project settings, billing and admin are the manual pass.

## Step 3 exit verification

Run on 2026-09-18 at the final lock commit `0f9d293` (issue #82), with `--force` everywhere so Turbo
served no
cached result. The per-scope entries of the step 3 scope log below record what each scope moved,
renamed, reclassified and smoked; this section records what closed the step.

**What the final lock changed in the ESLint config.** `migratedScopes`, `migratedScopeEntry`,
`migratedScopeConfigs`, the `lockedSeverity` constant and the `lockedScopeConfigs` spread are gone
from `packages/eslint-config/next.js`. The nine convention rules of the step and
`services-no-bare-error` now read one `migratedSeverity` constant (`error` under
`ESLINT_AGENT_RULES=1`, `off` otherwise) and are declared exactly once, on the rule's own glob:
`services-*` and `require-trpc-output-type` on `**/_services/**`, `no-feature-nesting` on
`**/_features/**`, the schema rules on `**/*.schema.ts`, `require-use-client-suffix` on `**/src/**`,
`no-client-import-of-services` everywhere. `servicesRulesSeverity` and `domainRulesSeverity` folded
into the same constant, so step 2's `no-default-export` lock rides on it too. The consequence worth
stating: a scope created tomorrow is locked the day it is created, because there is no list to
forget to update. `agent` (`warn`) now carries `no-raw-tailwind-colors` alone, which is the whole
remaining burn-down. `next-config.test.js` was rewritten with the mechanism it pinned: it now asserts
that each rule is declared exactly once, that `next.js` exports `nextJsConfig` and nothing else, that
every rule resolves to `error` through ESLint's own matcher inside the gate and to `off` outside it,
and that a `*.trpc.mutation.ts` path is no longer exempt from `require-server-action-suffix`.

**The `'use server'` exemption is gone.** The block that turned `require-server-action-suffix` off
for `*.trpc.query.{ts,tsx}` and `*.trpc.mutation.{ts,tsx}` was removed. It existed because all 81
pre-migration procedure modules carried a module-level `"use server"`; none of those files exists
any more, and a future file with that name is now reported like any other. It was the last transition
glob in the config.

**One file outside the perimeter was renamed.** `src/lib/trpc/trpc-provider.tsx` became
`trpc-provider.client.tsx`, and `src/app/layout.tsx` follows the new path. Step 3's perimeter is
`src/app/**`, so this file was never in scope, but it was the last `require-use-client-suffix`
warning in the repo and the rule cannot be locked at `error` on `**/src/**` while it stands. The
alternative was a second severity tier for everything outside `src/app`, which is the allowlist this
ticket exists to delete. The rename is a file name and one import, with no behaviour change.

### The "must be gone" checks

The ten commands of `03-services.md`, run from the repo root with `/usr/bin/grep`.

| Check                                   | Result                                                             |
| --------------------------------------- | ------------------------------------------------------------------ |
| 1 role suffixes                         | nothing, down from 112 files at the baseline                       |
| 2 old buckets                           | **two `_utils/` folders left**, see below                          |
| 3 `_constants/` inside a scope          | nothing; the domain-agnostic `src/app/_constants/` stays           |
| 4 `*.types.ts` files                    | nothing                                                            |
| 5 routers inside a bucket or a feature  | nothing; all 13 `trpc-router.ts` sit at a scope root               |
| 6 tRPC imported by a service            | nothing, across 246 files in 21 `_services/` folders               |
| 7 `TRPCError` in a service              | nothing                                                            |
| 8 `'use server'` in a service or router | nothing, down from 81 files                                        |
| 9 Prisma queried outside a service      | nothing outside the deliberately excluded `route.ts` handlers      |
| 10 procedure output as the type source  | nothing outside `src/lib/trpc/`, down from 190 aliases in 95 files |

Three checks this ticket adds on top of the table, all returning nothing: no `_utils/` folder holding
a source file, no `mergeRouters` call anywhere in `apps/web/src`, and no router inside a bucket or a
feature (check 5).

**Check 2 is the one open item, and it is not the agent's to close.** The two folders are
`(auth)/_utils/` and `(public)/_features/github-stars/_utils/`. Each holds exactly one file, a
`_deprecated_trpc-router.ts` stub of two comment lines and an `export {}`, because this repo forbids
the agent from deleting files. `03-services.md` says so in the rules of the game for the table: "a
stub still sitting in a `_utils/` folder keeps the old-bucket check red", and the checks "clear only
after the maintainer has deleted the `_deprecated_<name>.ts` stubs". That deletion is issue #81,
which was still open when this lock landed. Moving the stubs out of `_utils/` would have turned the
check green without making the statement it checks true, so they were left where they are.

### End state under `src/app`

| Metric                                      | Before step 3    | Now                                       |
| ------------------------------------------- | ---------------- | ----------------------------------------- |
| tRPC operation files holding business logic | 111              | 0                                         |
| `_services/` files                          | 0                | 246, in 21 folders                        |
| `trpc-router.ts` at a scope root            | 0                | 13                                        |
| routers living in `_utils/`                 | 14               | 0                                         |
| `mergeRouters` calls                        | 1                | 0                                         |
| `TRPCError` throws                          | 208              | 8, all in a router, at the transport edge |
| `DomainError` subclass throws               | 0                | 224                                       |
| `INTERNAL_SERVER_ERROR` throws              | 26               | 0                                         |
| bare `throw new Error(` in a service        | n/a              | 0                                         |
| `inferProcedureOutput` aliases              | 190, in 95 files | 0                                         |
| `'use server'` directives                   | 81               | 0                                         |
| `_helpers/` folders                         | 0                | 7                                         |
| `_types/` folders                           | 0                | 1, placed by the close-out (issue #54)    |

`_types/` stayed empty through every scope ticket: each hand-written shared type found there either
derived from a service return type (`<Service>Output`) or belonged next to the feature that used it.
Its one inhabitant, `_domains/feedback/_types/feedback-status.ts`, was placed by the close-out
(issue #54) below, which also added the `feedback` and `project` `_helpers/` folders. The bucket is
documented, not mandatory.

The eight surviving `TRPCError` throws are the transport-edge cases the invariants keep in a
procedure: two `UNAUTHORIZED` translations of a Better-Auth message plus a rate-limit
`TOO_MANY_REQUESTS` in `_domains/auth/trpc-router.ts`, one `FORBIDDEN` answerable from the session
alone in `_domains/organization/trpc-router.ts`, and four in
`(authenticated)/account/trpc-router.ts`.

Five `eslint-disable` comments remain under `src/app`. Four are `@next/next/no-img-element` on image
tags that predate the migration. The fifth is the one justified suppression this step introduced,
`schema-must-be-pure-zod` on `admin/users/_services/create-subscription.schema.ts`, which points at
step 5.

### Gate

| Check                   | Result                                                                      |
| ----------------------- | --------------------------------------------------------------------------- |
| `pnpm typecheck`        | 4 tasks, clean                                                              |
| `pnpm lint`             | 5 tasks, 0 warnings                                                         |
| `pnpm test`             | 120 app tests (33 files) plus the ESLint rule and config tests, all passing |
| `pnpm lint:agent-rules` | **88 problems, 0 errors, 88 warnings**, all `no-raw-tailwind-colors`        |
| `npx next build` (web)  | compiles, every route still listed                                          |

Warning counts per rule, against the step 2 re-measured baseline of 120:

| Rule                         | After step 2 | Now | Note                                                                      |
| ---------------------------- | -----------: | --: | ------------------------------------------------------------------------- |
| `no-raw-tailwind-colors`     |           88 |  88 | Outside this step's definition of done.                                   |
| `require-schema-conventions` |           28 |   0 | Burned down scope by scope, at `error` now.                               |
| `require-use-client-suffix`  |            3 |   0 | The last one was the provider renamed above.                              |
| `schema-must-be-pure-zod`    |            1 |   0 | The one impure schema carries a justified suppression pointing at step 5. |
| every other step 3 rule      |            0 |   0 | At `error` now, so a zero is enforced rather than vacuous.                |

`pnpm build` is refused by the sandbox, as the earlier entries record; `npx next build` from
`apps/web` with dummy environment values is the substitute used throughout the step.

### Left for the maintainer

1. **Delete the three `_deprecated_` stubs (issue #81)**, then re-run check 2, which is the only
   check still red:
   - `apps/web/src/app/(auth)/_utils/_deprecated_trpc-router.ts`
   - `apps/web/src/app/(public)/_features/github-stars/_utils/_deprecated_trpc-router.ts`
   - `apps/web/src/app/(authenticated)/account/billing/_features/current-plan/_deprecated_get-active-subscription.ts`

   The first two are the only contents of their folder, so deleting them removes the last two
   `_utils/` folders under `src/app`. None of the three is imported by anything, and none of them
   exports a value: typecheck and the build pass without them.

2. **Walk the smoke checklists of the scope entries below against a real database.** The sandbox has
   no Postgres, so every authenticated path stopped at the first query throughout the step. Each
   scope entry lists what was verified and what was left to QA.

3. **The gitignored `apps/web/.env.local` of dummy values is still in place**, as step 2's exit
   verification records.

### Debt recorded for steps 4 and 5

Found during step 3 and deliberately not fixed here.

**Step 4's legacy error class grep detects none of the six existing classes.** The check in
`04-domain-errors.md` greps for `lib/errors`, `CustomError`, `ValidationError` and
`UnauthorizedError`, which is the source project's vocabulary. Run against this repo it returns three
lines, all of them `isJiraUnauthorizedError`, a predicate function in
`server/jira/jira-rest-client.ts`, and it misses every class this repo actually has:
`JiraIssueConfigurationError` and `JiraRequestError` (`server/jira/jira-rest-client.ts`),
`JiraNotConnectedError` and `JiraReauthRequiredError` (`server/jira/token-access.ts`), `EmailError`
(`lib/mailer/types.ts`) and `ApiError` (`packages/widget-core/src/client.ts`, which is published and
outside the migration's perimeter entirely). Step 4 has to rewrite that check against this list
before it can claim the legacy vocabulary is retired.

**No Inngest function uses a non-retriable error today.** `NonRetriableError` appears nowhere in
`apps/web/src`. Step 4's `rethrowDomainErrorsAsNonRetriable` therefore has no existing call site to
convert: every Inngest function currently retries on any failure, expected or not. That is a
behaviour change step 4 introduces, not a refactor it performs.

**Step 4's masking will hide any meaningful copy still thrown as a 500.** Inside `src/app` this is
now safe: no service throws a bare `Error` and no `INTERNAL_SERVER_ERROR` is thrown anywhere. The
exposure is `src/server/**`, which step 3 did not touch and which holds 28 bare `throw new Error(`
sites, plus one in `src/lib`. Some carry user-facing copy that reaches a client today through a
procedure that calls into them. Step 4's sweep has to read those 29 sites before the masking
`errorFormatter` is enabled, not after.

**Twelve inverted imports from `src/server/` into domain internals remain.** The count is unchanged
from step 2's list, but two paths moved with their bucket during step 3:
`server/auth/config/database-hooks.ts` now imports
`_domains/organization/_services/get-unique-organization-slug` (was `_utils/generate-unique-slug`)
and `server/auth/plugins/organization.tsx` now imports
`_domains/organization/_helpers/organization-roles` (was `_utils/organization-roles`). The other ten
are the `feedback-status` and `format-feedback-markdown` imports listed in "`src/server/` imports of
domain internals" above. They resolve when the importing file joins its domain in step 5. The three
router mounts in `server/trpc/routers/_app.ts` are by design and are not in this count.

**The plan configuration has to move in step 5.** `@/server/auth/config/subscription-plans` is
imported by 29 files, 20 of them under `src/app`, including two `_domains/subscription` services, a
`_helpers/` label function, the `use-plan-gate` client hook and the agent API's `require-agent-auth`.
It holds the Plan vocabulary of the `subscription` domain, not Better Auth configuration. One
consequence is visible in the lint config today: the single `schema-must-be-pure-zod` suppression on
`admin/users/_services/create-subscription.schema.ts` exists only because the schema reads
`SubscriptionPlanName` and `SubscriptionStatus` from that module, and the config carries a
`reportUnusedDisableDirectives: "off"` block for that one file so the suppression is not reported as
unused outside the agent gate. Both come out with the relocation, and anomaly 1 of step 2 (a client
hook importing `@/server/`) closes with them.

**Twelve route handlers still query Prisma inline.** Check 9 excludes `route.ts` on purpose, as
`03-services.md` records: five OAuth install and callback routes, three tracker webhooks, the upload
endpoint and the three public widget endpoints. No step 3 ticket touched them, and the REST agent API
keeps its own error helper and its `NextResponse` result style until step 4 gives it a mapped
boundary.

## Step 3 close-out (issue #54)

The parent ticket of the step. Its twenty-eight children (#55 to #82) shipped the prerequisites, the
scopes, the REST API buckets and the final lock; this entry records what the close-out pass found
still open against the step's own statement that **every scope under `src/app` has the final bucket
set**, and what it decided.

### Two domains no scope ticket reached

`_domains/feedback/` and `_domains/project/` hold no tRPC operation, so they appear in neither the
order list of the spec nor any child ticket. Step 2 moved them under `_domains/` and left their files
bare at the domain root, which the target architecture does not allow: a scope owns the buckets and
nothing else. Seven files were placed, with no change to any function body.

| File                                   | From                 | To                                            | Why                                                                              |
| -------------------------------------- | -------------------- | --------------------------------------------- | -------------------------------------------------------------------------------- |
| `feedback-status.ts`                   | `_domains/feedback/` | `_domains/feedback/_types/`                   | The Feedback status vocabulary. See the prerequisite 6 answer below.             |
| `format-feedback-markdown.ts`          | `_domains/feedback/` | `_domains/feedback/_helpers/`                 | Pure formatting, no IO. Its parameter type stays with it, like a service output. |
| `generate-api-key.ts`                  | `_domains/project/`  | `_domains/project/_helpers/`                  | Pure: `crypto.randomBytes` is not IO, so it is a helper, not a service.          |
| `generate-public-id.ts`                | `_domains/project/`  | `_domains/project/_helpers/`                  | Same.                                                                            |
| `normalize-domain.ts`                  | `_domains/project/`  | `_domains/project/_helpers/`                  | Pure, minus the schema split out of it.                                          |
| `DomainSchema` (was in the file above) | `_domains/project/`  | `_domains/project/_services/domain.schema.ts` | A Zod schema belongs in `_services/` as `*.schema.ts`.                           |
| `active-project-provider.client.tsx`   | `_domains/project/`  | `_domains/project/active-project/`            | A capability slice, with its cookie plumbing beside it.                          |
| `active-project-cookie.ts`             | `_domains/project/`  | `_domains/project/active-project/`            | Browser cookie access used by that provider alone, by no one else.               |

`DomainSchema` was the one placement with a consequence beyond a path. Three migrated `*.schema.ts`
files (`create-project`, `update-project`, `create-onboarding-project`) imported it from a non-schema
module at a domain root, which the schema conventions have no name for. It now lives in a
`*.schema.ts` of its own, exports the `DomainInput` type the convention requires, and imports
`normalizeDomain` from `_helpers/`, which `schema-must-be-pure-zod` allows. `server/api/validate-origin.ts`
imports the helper directly, since it wants the function and not the schema. Thirty-two files changed
an import path; no behaviour changed, and `_types/` stopped being an empty bucket.

### Prerequisite 6 answered

**`feedback-status.ts` goes to `_types/`, not to `_services/` as a `*.schema.ts`.** The file is a Zod
enum plus the type inferred from it, and it is the runtime validator of a free-form `String` column,
not the input of a form or a procedure. Naming it `feedback-status.schema.ts` would put it under
`require-schema-conventions`, which demands an exported type ending in `Input`, `Inputs` or `Values`.
`FeedbackStatusInput` is a worse name than `FeedbackStatus` for a status union that ten modules use
as domain vocabulary, and renaming a glossary type to satisfy a rule aimed at input schemas would be
the tail wagging the dog. `_types/` is "a hand-written, isomorphic shared type": that is what this
is, and Zod is client-safe, so the validator travels with the type it defines. Both exported names
are unchanged.

**The search-params module stays in `_components/dashboard/`** (step 2, amendment 2). It is the
period selector's URL contract, it is domain-agnostic, and its only other consumer is the admin
subscriptions chart in the same sub-library. The target architecture has no bucket for a
route-agnostic search-params module and inventing one for a single file would be a bucket with one
inhabitant. Revisit only if a third consumer appears outside the sub-library.

### Deviations accepted, not fixed

1. **Capability folders sit at a domain root, not under `_features/`.** `auth/send-verification-email-button/`,
   `auth/stop-impersonate-button/`, `subscription/plan-card/`, `subscription/plan-gate/`,
   `subscription/upgrade-subscription/` and now `project/active-project/` are capability slices in
   the target architecture's sense, and it places those under `<scope>/_features/<name>/`. Step 2
   gave the domains the flat shape and the domain entries of step 3 kept it deliberately, so the
   close-out kept it too rather than move six folders and rewrite thirty imports for a naming
   question no rule enforces (`no-feature-nesting` only forbids a feature inside a feature). It is
   one decision for the maintainer: either the domains gain a `_features/` bucket, or the target
   architecture records that a domain's capability folders sit at its root. Route scopes are not
   affected; they all use `_features/`.

2. **The two `index.ts` barrels of these domains stay `export {}`.** Nothing outside either domain
   imports through the barrel: the consumers of `feedback-status`, the markdown formatter and the
   active-project provider are routes, `src/server/` and the agent API, all of which the
   cross-domain rule exempts by design. Step 2, amendment 6 made the same call for all six barrels.

### Carried forward to step 5

Prerequisites 2 and 3 of step 3 were never answered and step 3 never needed them: it did not move a
single file out of `src/server/`.

- **The open question on the integration domains** (one domain per external system, or one `tracker`
  domain) still decides the home of `server/github`, `server/linear`, `server/jira`, `server/slack`,
  `server/oauth`, the domain-bound Inngest functions and the Jira mail template.
- **The domain of `server/storage`** is still undecided, because Asset is still not a glossary term.

Both are step 5 questions, since that is the step that relocates `src/server/**`. The rest of the
debt is in "Debt recorded for steps 4 and 5" above.

### Re-verification

Run from the repo root at the close-out commit, with `--force` where Turbo caches.

| Check                         | Result                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| The ten "must be gone" checks | Unchanged: nine return nothing, check 2 is still the two stub folders                   |
| `pnpm typecheck`              | 4 tasks, clean                                                                          |
| `pnpm lint`                   | 5 tasks, 0 warnings                                                                     |
| `pnpm test`                   | 120 app tests (33 files), 181 ESLint rule and config tests                              |
| `pnpm lint:agent-rules`       | 88 problems, 0 errors, 88 warnings, all `no-raw-tailwind-colors`                        |
| `npx next build` (web)        | compiles, every route still listed                                                      |
| Bare file at a domain root    | none; every domain root holds buckets, capability folders, `index.ts`, `trpc-router.ts` |

**Smoke checklist for this entry.** Not run against a real database, as everywhere in this step:
create a Project from the sidebar and from onboarding (both call the two `generate-` helpers and
`DomainSchema`), change a Project's domain in its settings, switch the active Project in the header
(the cookie survives a reload), copy a Feedback and a selection as markdown from the inbox, read a
Feedback through the agent API, and check that the admin dashboard overview still buckets by status.

### Still open at the close-out

Issue #81 only. The three `_deprecated_` stubs listed under "Left for the maintainer" are the last
red line of the step, and the agent may not delete them.

## Step 4 exit verification

Run on 2026-09-19 at the final lock commit (issue #107), with `--force` everywhere so Turbo served
no cached result. The per-ticket entries of the step 4 scope log below record what each ticket
changed and what it left to smoke; this section records what closed the step.

**What the final lock changed.** One script and three status paragraphs:

- `apps/web/package.json`: `lint:agent-rules` is now `ESLINT_AGENT_RULES=1 eslint --max-warnings 0 .`.
  A convention warning fails the command again, as the Purpose section above promised at the start of
  the migration. Nothing else in the command changed, so `pnpm lint:agent-rules` from the repo root
  still forwards through Turbo to the web app alone.
- The Purpose section of this log, `AGENTS.md` and `docs/architecture/target-architecture.md` no
  longer say the command drops `--max-warnings 0` for the duration of the migration.
- The coding-standards skill's migration block says step 4 is done and what step 5 still owns.

No source file was touched. Every convention rule was already at `error` and already at zero before
the flag went back: #104 and #105 closed the last one (`no-raw-tailwind-colors`), and #106 wrote the
documentation. The lock is therefore a recording of a state, not a change to it.

### The eleven "must be gone" checks

The table of "'Must be gone' checks for this repo" below, run from the repo root. All eleven pass.

| #   | Check                                       | Command                                                                                                                      | Result                                                                                                                               |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Bare errors in services                     | `grep -rn "throw new Error(" apps/web/src \| grep _services/`                                                                | nothing                                                                                                                              |
| 2   | Expected Jira errors outside the vocabulary | `grep -n "class Jira.*Error extends" apps/web/src/server/jira/*.ts`                                                          | the three expected classes extend `PreconditionFailedError` in `jira/errors.ts`; `JiraRequestError` is the only `extends Error` left |
| 3   | Blind refresh catch                         | `grep -n "catch {" apps/web/src/server/jira/token-access.ts`                                                                 | nothing                                                                                                                              |
| 4   | Per-procedure mapping                       | `grep -rn "catch" apps/web/src --include="trpc-router.ts"`                                                                   | nothing, across the 13 routers                                                                                                       |
| 5   | Transport errors in routers                 | `grep -rn "new TRPCError" apps/web/src/app --include="trpc-router.ts"`                                                       | nothing, down from the 8 the step 3 close-out recorded                                                                               |
| 6   | Sentinel messages                           | `grep -rn "EMAIL_NOT_VERIFIED" apps/web/src`                                                                                 | nothing                                                                                                                              |
| 7   | Handlers posing as services                 | `grep -rln "NextResponse\|NextRequest" apps/web/src/app/api/v1/agent --include="*.ts" \| grep _services/`                    | `require-agent-auth.ts` only, the one documented exception                                                                           |
| 8   | Server errors in client code                | `pnpm lint:agent-rules`                                                                                                      | passes with `no-client-import-of-server-errors` at `error`, declared outside the agent gate in `packages/eslint-config/next.js`      |
| 9   | Raw messages in boundaries                  | `grep -n "error.message\|digest"` over the six boundary files                                                                | three hits, all the same comment line saying `digest` is left out on purpose; no boundary renders either value                       |
| 10  | Missing boundaries                          | `ls apps/web/src/app/{error,global-error,not-found,forbidden,unauthorized}.tsx "apps/web/src/app/(authenticated)/error.tsx"` | six files                                                                                                                            |
| 11  | Warnings                                    | `pnpm lint:agent-rules --force`                                                                                              | runs with `--max-warnings 0` and reports **0 problems**                                                                              |

Two of them need a word on how they were read.

Check 9 turned out stricter than its own wording. The table expected "only the logging line"; the
boundaries log the error object itself (`console.error("Root render error", error)`), so the pattern
does not match the logging line either, and the only three hits are the comment, repeated in
`error.tsx`, `global-error.tsx` and `(authenticated)/error.tsx`, that says `digest` is deliberately
not rendered.

Check 3 asks for the absence of a _bare_ catch, not of every catch. `refreshUnderLock` still has a
`catch (error)` around `refreshAccessToken`, which is the point of #89: it rethrows unless
`isRefusedByAtlassian(error)` is true, and only then writes **Reconnect required**. The outer
`catch (error)` in `getValidJiraAccessToken` is the revocation event emitter, also added by #89.
The `catch {` grep is what distinguishes the two shapes, so that is the form recorded here.

### End state of the error model

| Metric                                         | Before step 4          | Now                                                                               |
| ---------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------- |
| Modules in `src/server/errors/`                | 1 (`domain-errors.ts`) | 3, with a test file for each of the two new ones                                  |
| Route handlers mapping a `DomainError`         | 0                      | 2, both agent API routes                                                          |
| Inngest functions with a non-retriable wrapper | 0                      | 3 (`create-jira-issue`, `sync-feedback-status-to-jira`, `sync-jira-issue-status`) |
| Expected Jira errors inside the vocabulary     | 0 of 3                 | 3 of 3, all `PreconditionFailedError`                                             |
| `new TRPCError` under `src/app`                | 8, in 3 routers        | 0; the three plan and feature middlewares keep theirs by design                   |
| `catch` in a `trpc-router.ts`                  | 2                      | 0                                                                                 |
| Masked `INTERNAL_SERVER_ERROR` messages        | none                   | all, behind `UNEXPECTED_FAILURE_MESSAGE`, with `logTRPCError` as `onError`        |
| Boundary files                                 | 1 (`unauthorized.tsx`) | 6, all rendering one `ErrorScreen`                                                |
| `no-raw-tailwind-colors` warnings              | 88                     | 0, rule at `error`                                                                |
| `services-no-bare-error`                       | agent-gated            | always on for `**/_services/**`                                                   |
| Web tests                                      | 120 (33 files)         | 204 (48 files)                                                                    |

### Gate

| Check                           | Result                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm typecheck --force`        | 4 tasks, clean                                                               |
| `pnpm lint --force`             | 5 tasks, 0 warnings                                                          |
| `pnpm test --force`             | 204 web tests (48 files) and 191 `@workspace/eslint-config` tests (16 files) |
| `pnpm lint:agent-rules --force` | **0 problems, 0 errors, 0 warnings**, now with `--max-warnings 0`            |
| `npx next build` (web)          | compiles, every route still listed, the two agent API routes included        |

Warning counts per rule, against the 88 that step 3 handed over:

| Rule                     | After step 3 | Now | Note                                                                     |
| ------------------------ | -----------: | --: | ------------------------------------------------------------------------ |
| `no-raw-tailwind-colors` |           88 |   0 | 72 exempted as illustrations (#104), the rest rewritten to tokens (#105) |
| every other rule         |            0 |   0 | At `error`, so a zero is enforced rather than vacuous.                   |

The build was run as `npx next build` from `apps/web` with a placeholder `GITHUB_PRIVATE_KEY`, for
the environment reason recorded under issue #88: `server/github/github-app.ts` reads that variable at
module evaluation, so page-data collection for `/api/github/setup` fails without it. `pnpm build` is
refused by the sandbox, as every earlier entry records.

### The deliberate behaviour changes of the step

Step 4 is the first step of the migration that changes what a User sees. What changed, and where it
is recorded:

1. **Every unexpected server error now reads "Something went wrong. Please try again."** (#98). An
   expected failure keeps its message and `zodError` still reaches the form. The original is logged
   with its `cause` chain by `logTRPCError` (#97), so masking costs no debuggability.
2. **A transient Atlassian failure no longer marks a Jira Installation "Reconnect required"** and no
   longer emails the Organization to reconnect (#89). Only an explicit 4xx refusal does.
3. **A Jira run that cannot succeed fails on the first attempt** (#91). A disconnected or refused
   Installation is a `NonRetriableError` in the three functions that let it bubble, so the run
   history stops filling with retries that cannot work.
4. **Five Jira screens answer with copy instead of a 500** (#90), because the three expected Jira
   errors now transport as `PRECONDITION_FAILED`.
5. **An unverified email at sign-in gets a real sentence** instead of the `EMAIL_NOT_VERIFIED`
   sentinel, and the login form branches on `error.data.code` to keep offering the resend (#92).
6. **A render error shows a product screen** rather than the framework default, at the root, inside
   the dashboard shell and for the three interrupt destinations (#99, #100, #101).
7. **A failed query in a visible region shows its error state** rather than an empty panel (#102,
   #103).

The agent API is the deliberate non-change: #84 and #85 froze its contract in characterization tests
before #86, #87 and #88 converted its three handlers into services, and those tests pass unchanged,
so the published MCP server and widget clients need no release.

### Left for the maintainer

1. **Delete the `_deprecated_` stub this step created:**
   - `apps/web/src/lib/trpc/_deprecated_handle-trpc-error.ts`

   It is the retired `handleTRPCError` helper (#95), which had no caller before the step and has none
   now that `logTRPCError` is the transport's single logging path. The file exports no value, so
   typecheck, test and the build pass without it. The agent may not delete files, which is why the
   stub is listed here rather than gone.

   The three stubs of the step 3 lock (issue #81) are still listed under "Left for the maintainer" of
   that entry and are untouched by this step.

2. **Walk the smoke checklists of the step 4 scope log entries against a real database.** The sandbox
   still has no Postgres, so every authenticated path stops at the first query. The ones nothing
   automated covers: the six boundary files and the `matchQueryStatus` sweep (#99 to #103), the login
   form's branch on the error code (#92), the colour rewrites in both themes (#105), and the agent
   API's "byte for byte" promise against a real Agent token (#88).

3. **The gitignored `apps/web/.env.local` of dummy values is still in place**, and
   `GITHUB_PRIVATE_KEY` still has to be passed on the command line for a build.

### Debt carried into step 5

Recorded by the step's tickets, not fixed here:

- **`services-no-bare-error` does not reach `src/server/` yet** (decision 3). The infrastructure
  `throw new Error(` sites there are deliberate and stay bare; the rule follows them when those files
  join a domain in step 5, rather than landing an `eslint-disable` line per site that the relocation
  would revisit.
- **`interruptOnDomainError` was not created** (deviation 1). No RSC page calls a throwing service,
  so the helper lands with its first caller. `forbidden.tsx` and `unauthorized.tsx` are already in
  place as its destinations.
- **Twelve route handlers still query Prisma inline.** The agent API is the only mapped boundary; the
  OAuth install and callback routes, the tracker webhooks, the upload route and the public widget
  endpoints reach no service until step 5, which also owns the kit's per-webhook "4xx or swallowed
  2xx" decision.
- **The three invitation services still pass Better Auth's own messages through** as
  `BadRequestError(error.message)` (decision 4).
- **`warning` and `info` tokens do not exist.** `rules/frontend.md` lists them among the design-system
  colours and `packages/ui/src/styles/globals.css` does not define them (#104). Until one is added,
  the five yellow, amber and blue sites stay unreported: one line in the rule's hue-to-token table
  turns them on.
- **The agent API and the dashboard keep two status-update services** (#88). Merging them behind one
  "caller scope" concept is a deepening candidate for after the migration, not a migration task.
- **Whether a password-reset mailer outage should be visible to the User at all** is a product
  question #95 recorded rather than decided.

## Prerequisites and decisions for step 4

Settled on 2026-09-19 in a design session held before the step's spec was written, against an
inventory of the code at commit `c1b47bd`. This section is the input of that spec: the facts the
decisions rest on, the decisions, the deviations from `04-domain-errors.md`, and the "must be gone"
checks rewritten for this repo.

### Inventory the decisions rest on

| Surface                              | State at `c1b47bd`                                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/server/errors/`                 | `domain-errors.ts` only. Five subclasses, no `UNAUTHORIZED` by design.                                                                                                                                                                                 |
| tRPC mapping                         | `domainErrorMiddleware` on `publicProcedure`, inherited by every procedure. `enforce-feature`, `enforce-limit` and `with-plan-context` throw `TRPCError` directly.                                                                                     |
| tRPC `errorFormatter`                | Exposes `zodError`. No masking.                                                                                                                                                                                                                        |
| tRPC route handler                   | No `onError`. `lib/trpc/handle-trpc-error.ts` has no caller.                                                                                                                                                                                           |
| Route handlers                       | 23 `route.ts`. None reaches code that throws a `DomainError`. Only the agent API has a `_services/` folder, and its three files are the handlers themselves (`NextRequest` in, `agentError(...)` out), re-exported by `route.ts`.                      |
| Published error contract             | `packages/mcp` reads `body.error` only. `packages/widget-core` reads `body.error` and `body.details`. `code` is never read by a published client.                                                                                                      |
| Inngest                              | 17 functions. None imports `_services/` or `DomainError`. No `NonRetriableError` anywhere. Four call `getValidJiraAccessToken`; `refresh-jira-installation-webhooks` already catches its errors, the other three let them bubble.                      |
| Server actions                       | None. No action client.                                                                                                                                                                                                                                |
| `authInterrupts`                     | Already enabled. `forbidden()` and `unauthorized()` are never called.                                                                                                                                                                                  |
| Boundary files                       | `app/unauthorized.tsx` only, static copy. No shared error screen component.                                                                                                                                                                            |
| RSC pages                            | 0 pages call a service that can throw `NotFoundError`. Not-found is a nullable `find-` everywhere.                                                                                                                                                     |
| Error classes outside the vocabulary | `JiraIssueConfigurationError`, `JiraRequestError`, `JiraNotConnectedError`, `JiraReauthRequiredError`, `EmailError`. Five tRPC-reachable services call `getValidJiraAccessToken` without catching, so both token errors are a 500 today.               |
| Bare `throw new Error(`              | 28 in `src/server/**`, 1 in `src/lib`. 28 are infrastructure. One carries user copy: `server/auth/config/email-and-password.tsx:28`. None in any `_services/`.                                                                                         |
| Routers                              | 2 of 13 contain a `catch` that matches Better Auth `error.message` and throws `TRPCError UNAUTHORIZED` (`account/trpc-router.ts`, `_domains/auth/trpc-router.ts`). 2 more `throw new TRPCError` sit in routers without a catch.                        |
| Client                               | No import of `@/server/errors`, no `instanceof DomainError`, no read of `error.data.code`. `login-form` matches `error.message === "EMAIL_NOT_VERIFIED"`. 42 toasts pass `error.message`. `matchQueryStatus` is used by 28 of the 42 files that query. |
| Logging                              | `console.*` only. No logger, no monitoring provider, no `instrumentation.ts`.                                                                                                                                                                          |
| `no-raw-tailwind-colors`             | 88 warnings. 72 in four home page illustration files, mostly `zinc`. 16 in product screens: 7 green or emerald (`success` exists), 4 red (`destructive` exists), 5 yellow, amber or blue (no token).                                                   |

**The Jira refresh trap.** `refreshUnderLock` in `server/jira/token-access.ts` wraps
`refreshAccessToken` in a bare `catch {}` that turns any failure, an Atlassian 5xx and a network
error included, into `JiraReauthRequiredError`, flips the Installation to `reconnect_required` and
triggers the reconnect email. Today the Inngest retries paper over it: the next attempt refreshes
and writes `connected` back. Making that error non-retriable without fixing the catch would lose an
issue creation on a transient Atlassian failure. Decision 7 below exists because of this.

### Decisions

**Scope**

1. **Step 4 changes behaviour in place; step 5 only relocates.** Error conversions under
   `src/server/**` happen where the files are today.
2. **Only user copy is converted under the server folder.** `email-and-password.tsx:28` becomes a
   `DomainError`. The 28 infrastructure sites of `src/server/**` stay bare `Error`: they must surface
   as a 500.
3. **`services-no-bare-error` becomes always-on for services only,** under the `**/_services/**`
   glob. Its extension to `src/server/**` waits for step 5, when those files join a domain, rather
   than landing 28 `eslint-disable` lines that the relocation would revisit.
4. **Out of scope, recorded as debt:** Better Auth messages passed through as
   `BadRequestError(error.message)` in the three invitation services; the twelve route handlers with
   inline Prisma other than the agent API (step 5); `warning` and `info` theme tokens; anomalies 3
   and 4; deviation 1 of the step 3 close-out. Anomaly 4 gets its own ticket outside the migration.

**Vocabulary**

5. **The three expected Jira errors join the vocabulary as second-level subclasses.**
   `JiraNotConnectedError`, `JiraReauthRequiredError` and `JiraIssueConfigurationError` extend
   `PreconditionFailedError` and keep their names, so the existing `instanceof` checks in Inngest
   keep working, tRPC maps them for free and the five uncaught services stop returning a 500. A
   second-level subclass is allowed when a caller must tell cases apart; its code is still one of
   the five. `JiraRequestError` and `EmailError` are infrastructure and stay plain `Error`.
6. **No `UnauthorizedError`.** The Better Auth translations in the two routers move down into their
   services as `BadRequestError` with the current copy: a wrong password is a rejected input, not a
   missing session. The unverified email case becomes a `PreconditionFailedError` with real copy,
   reserved for that case in `sign-in-user`, and `login-form` branches on
   `error.data.code === "PRECONDITION_FAILED"`. The two remaining `throw new TRPCError` in routers
   (`_domains/organization/trpc-router.ts`, `stopImpersonate` in `_domains/auth/trpc-router.ts`) move
   into their services in the same ticket. The `enforce-*` middlewares keep throwing `TRPCError`:
   they are the tRPC boundary, not services.
7. **The Jira refresh discriminates before anything becomes non-retriable.** Only an explicit
   refusal from Atlassian (a 4xx such as `invalid_grant` or `unauthorized_client`) raises
   `JiraReauthRequiredError` and sets `reconnect_required`. A 5xx or a network error stays an
   infrastructure `Error`, leaves the Installation untouched and is retried. This also fixes the
   existing bug where a transient failure sends the reconnect email. "Reconnect required" is now a
   glossary term in `CONTEXT.md` with that rule.

**Boundaries**

8. **The agent API gets the HTTP boundary; no other route handler does in this step.** `route.ts`
   becomes the boundary (auth, parsing, transport codes, `domainErrorResponse` in its `catch`), and
   the three files in `_services/` become transport-agnostic services that throw `NotFoundError`.
   Transport codes are unchanged and stay in the boundary: `UNAUTHORIZED`, `FORBIDDEN` (scope),
   `RATE_LIMITED` with its headers, `VALIDATION_ERROR` as 422, `RESOURCE_LIMIT_EXCEEDED` with its
   extra fields. The kit's 1:1 status table is unchanged, since no `DomainError` yields a 422. Bodies
   are byte-compatible (`{ error, code }`), so no changeset. The ticket starts with characterization
   tests of today's bodies and statuses: `api/v1` has no test today.
9. **`requireAgentAuth` stays a transport guard.** It keeps its `token | NextResponse` result style
   and its place in `_services/` (it does IO). Its 401, 403 and 429 carry headers a `DomainError`
   cannot. It is the one agent API service allowed to return a `NextResponse`, with a one-line
   comment saying why.
10. **The agent API keeps its own services.** `update-feedback-status` exists on both transports
    with different authorization (Member of the Organization versus Project owned by the token's
    Organization) and a different Status actor. Merging them needs a "caller scope" concept that is
    not an error question. Recorded as a deepening candidate for after the migration. One
    behavioural gap for the ticket to settle: the dashboard service emits `feedback/status-changed`
    on a no-op status set; the agent one does not.
11. **Non-retriable wrapping is targeted.** `rethrowDomainErrorsAsNonRetriable` wraps the three
    Inngest functions that let a Jira `DomainError` bubble (`create-jira-issue`,
    `sync-feedback-status-to-jira`, `sync-jira-issue-status`). The other fourteen cannot receive one.
    The rule goes into `rules/backend.md`: an Inngest function body that calls code able to throw a
    `DomainError` wraps it. Effect: a disconnected or refused Installation fails on the first
    attempt instead of the fourth; transient failures still retry, thanks to decision 7.
12. **Webhooks, OAuth routes, widget endpoints and the upload route are untouched.** They reach no
    service, so the kit's per-endpoint 4xx-or-swallowed-2xx decision has nothing to decide yet.
13. **Masking copy:** `Something went wrong. Please try again.` The tRPC route handler gains an
    `onError` that `console.error`s the original error with its `cause` chain. No monitoring
    provider is introduced. `handle-trpc-error.ts` becomes a `_deprecated_` stub.

**Client**

14. **Six boundary files, one screen.** The five root files plus `(authenticated)/error.tsx`, so a
    render error keeps the sidebar and the header. All render one `ErrorScreen` from root
    `_components/` with fixed copy from one constants module beside it. No support address is
    rendered while `SUPPORT_EMAIL` is a placeholder.

    | File               | Title                  | Body                                                                                   |
    | ------------------ | ---------------------- | -------------------------------------------------------------------------------------- |
    | `error.tsx`        | `Something went wrong` | `An unexpected error occurred. Try again, or contact support if the problem persists.` |
    | `not-found.tsx`    | `Page not found`       | `The page you are looking for does not exist or has been moved.`                       |
    | `forbidden.tsx`    | `Access denied`        | `You do not have permission to view this page.`                                        |
    | `unauthorized.tsx` | `Sign in required`     | `Sign in to access this page.` with a link to `/login`                                 |

    `error.tsx` carries a `Try again` button. `global-error.tsx` reuses the `error.tsx` copy.

15. **The `matchQueryStatus` sweep covers only queries that show, or should show, an error state.**
    Of the 14 files that query without it, a query whose failure is invisible by design stays as it
    is, and the ticket lists the cases it kept.

**Lint**

16. **`no-raw-tailwind-colors` is reshaped around its intent:** forbid a raw palette class when a
    semantic token exists for it. The rule takes a configurable hue-to-token table
    (`red` to `destructive`, `green` and `emerald` to `success`, the neutral hues to `muted`,
    `border`, `foreground`), names the token in its message, and lets hues with no equivalent pass.
    The four home page illustration files join `ignorePathPatterns`: drawn mock screens keep fixed
    colours on purpose. That leaves 11 sites to fix (10 once the split was recounted against the
    rule: see the #104 entry in the step 4 scope log). No `warning` or `info` token is added; when one
    is, a line in the table makes the rule report the 5 yellow, amber and blue sites.
17. **`--max-warnings 0` returns to `lint:agent-rules` at the end of step 4,** as the Purpose section
    above promised, once decision 16 brings the rule to `error` at zero.

### Deviations from `04-domain-errors.md`

| Kit                                                               | Here                                                               | Why                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `next-interrupts.ts` exists                                       | Not created                                                        | No RSC page calls a throwing service. It lands with its first caller.          |
| Every Inngest function wraps its service calls                    | Three functions wrap                                               | Decision 11. Wrapping fourteen functions that cannot receive one is dead code. |
| Every route handler calls `domainErrorResponse` first             | The agent API only                                                 | Decisions 8 and 12. The rest reach no service until step 5.                    |
| Legacy vocabulary retired, ban rule `no-deprecated-error-imports` | Three classes re-parented, two left as infrastructure, no ban rule | Decision 5. There is no legacy module to ban.                                  |
| Server actions branch                                             | Not applicable                                                     | No action client in this repo.                                                 |
| `services-no-bare-error` always on                                | Always on for `_services/**`; `src/server/**` in step 5            | Decision 3.                                                                    |
| Five boundary files                                               | Six                                                                | Decision 14.                                                                   |

The ADR amendment (second-level subclasses, `interruptOnDomainError` deferred, the agent API's
transport codes, removal of the "Added by step 4" status note) is written at the final lock, when
the code matches it, not before.

### Order

Strictly ordered:

1. `http-response.ts`, `non-retriable.ts`, and the agent API conversion (decisions 8 to 10).
2. Jira: the refresh discrimination, then the re-parenting, then the three wrappers (7, 5, 11).
3. The two auth routers and the two stray `TRPCError` (6).
4. The one user-copy site under `src/server`, and the `handle-trpc-error` stub (2, 13).
5. `services-no-bare-error` always on (3).
6. Masking and `onError` (13). Starts only after 4 is done and the 28 infrastructure sites have been
   re-read against the list above.

Independent of that chain and of each other: the boundary files (14), the `matchQueryStatus` sweep
(15), the Tailwind rule (16). The final lock (17, the ADR amendment, the checks below, the log
entry) closes the step.

### Tests and verification

Step 4 changes behaviour, unlike steps 2 and 3. Minimum automated coverage:

- unit tests for `domainErrorResponse` and `rethrowDomainErrorsAsNonRetriable`;
- `domain-error-mapping.test.ts` extended: a 500 is masked, a `DomainError` is not, `zodError`
  survives;
- the Jira refresh, both branches of decision 7;
- the agent API characterization tests of decision 8, written before the conversion;
- the hue-to-token table of the Tailwind rule;
- the auth services: wrong password to `BadRequestError`, unverified email to
  `PreconditionFailedError`.

Nothing automated for the boundary files or the `matchQueryStatus` sweep: rendering, checked by
hand. Smoke checklists are written per ticket and walked by the maintainer, as in step 3. The four
risky tickets (Jira, auth routers, masking, agent API) cannot close unless their automated tests
cover the changed branch.

### "Must be gone" checks for this repo

These replace the table in `04-domain-errors.md`, whose legacy grep matches none of this repo's
classes.

| Pattern                                     | Check                                                                                                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bare errors in services                     | `grep -rn "throw new Error(" apps/web/src \| grep _services/` returns nothing                                                                                              |
| Expected Jira errors outside the vocabulary | `grep -n "class Jira.*Error extends" apps/web/src/server/jira/*.ts` shows `PreconditionFailedError` for the three expected classes and `Error` for `JiraRequestError` only |
| Blind refresh catch                         | `refreshUnderLock` no longer holds a bare `catch {` around `refreshAccessToken`                                                                                            |
| Per-procedure mapping                       | `grep -rn "catch" apps/web/src --include="trpc-router.ts"` returns nothing                                                                                                 |
| Transport errors in routers                 | `grep -rn "new TRPCError" apps/web/src/app --include="trpc-router.ts"` returns nothing                                                                                     |
| Sentinel messages                           | `grep -rn "EMAIL_NOT_VERIFIED" apps/web/src` returns nothing                                                                                                               |
| Handlers posing as services                 | `grep -rln "NextResponse\|NextRequest" apps/web/src/app/api/v1/agent --include="*.ts" \| grep _services/` returns `require-agent-auth.ts` only                             |
| Server errors in client code                | `pnpm lint:agent-rules` passes with `no-client-import-of-server-errors` at `error`                                                                                         |
| Raw messages in boundaries                  | `grep -n "error.message\|digest"` over the six boundary files returns only the logging line                                                                                |
| Missing boundaries                          | `ls apps/web/src/app/{error,global-error,not-found,forbidden,unauthorized}.tsx "apps/web/src/app/(authenticated)/error.tsx"` lists six files                               |
| Warnings                                    | `pnpm lint:agent-rules` runs with `--max-warnings 0` and reports 0 problems                                                                                                |

## Step 4 scope log

### `api/v1/agent` status update, and the no-op decision (issue #88)

Closes the agent API conversion of decisions 8 to 10. `POST
/api/v1/agent/feedbacks/[id]/status` now has the boundary-plus-service shape the two `feedbacks`
handlers got in #86 and #87: for an Agent-token caller the responses are unchanged, byte for byte,
and the ten characterization tests of #85 pass untouched.

**What moved.** `_services/update-feedback-status.ts` was the handler, re-exported as `POST` by a
one-line `route.ts`. It is now a transport-agnostic service: it takes `{ feedbackId, status,
organizationProjects }` and an injectable `db`, imports nothing from `next/server`, and throws
`NotFoundError("Feedback not found")` (no trailing period: this copy is the published contract) for
a Feedback outside the token's Organization. `route.ts` is the boundary and owns agent auth, the
422 paths (`Invalid feedback ID`, `Invalid JSON body`, `Validation failed`), the access log and
`domainErrorResponse` in its `catch`, with the non-domain branch rethrown so a bug still surfaces as
a 500. The service returns `previousStatus` alongside the stored row so the boundary names the
transition in its log line without reading the row a second time.

**The no-op emission gap stays open, deliberately.** The dashboard's `updateFeedbackStatus` emits
`feedback/status-changed` on a redundant status set; the agent one does not, and keeps not doing so.
The two transports have different traffic: an agent looping over a queue re-sets the status it just
read, and the fan-out (a tracker write per linked integration) is the costly half of the operation,
while a human toggling a Status in the inbox does not repeat the same value in a loop. Closing the
gap in the agent's direction would mean emitting events no Reviewer's customer can observe; closing
it in the dashboard's direction would change inbox behaviour, which is outside step 4's chain. Both
services now carry a comment pointing at this decision, and the gap is part of the "caller scope"
deepening candidate of decision 10. The pinned characterization test keeps asserting no event, with
its comment rewritten from "shows up as a diff" to the settled reason.

**Why the agent API still keeps its own service.** Unchanged from decision 10: authorization is
Project-owned-by-the-token's-Organization rather than Membership, and the Status actor is `agent`
rather than `user`.

**Tests.** `_services/update-feedback-status.test.ts` (4 cases) drives the service through an
injected database fake with `@/server/inngest` mocked at the module boundary: a Feedback outside the
Organization rejects with `NotFoundError` and writes nothing, a real change stores the status and
returns the transition, a real change fans out with `actor: "agent"`, a no-op writes but sends no
event. `route.test.ts` (10 cases, unchanged since #85) keeps proving the HTTP contract.

**Checks at this commit.**

| Check                                      | Result                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Handlers posing as services                | returns `require-agent-auth.ts` only                                   |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (163 tests, zero warnings)                                        |
| `pnpm lint:agent-rules`                    | 0 errors, 88 `no-raw-tailwind-colors` warnings (the #104/#105 backlog) |
| `pnpm --filter web build`                  | every route listed, both agent routes included                         |

`requireAgentAuth` keeps its `token | NextResponse` result style and gained the one-line comment
decision 9 asked for: it is the one agent API service allowed to return a response, because its 401,
403 and 429 carry headers and extra body fields a `DomainError` cannot express.

**Build note for the sandbox.** `next build` fails at "collect page data" for `/api/github/setup`
unless `GITHUB_PRIVATE_KEY` is set: `server/github/github-app.ts` reads it at module evaluation. The
build above was run with a placeholder value. This is an environment gap, not a regression, and it
predates step 4.

**Smoke checklist for the maintainer** (a real Agent token against a real database, decision 8's
"byte for byte" promise):

- [ ] `GET /api/v1/agent/feedbacks?project=<publicId>` returns the Project's Feedbacks with their
      signed screenshot URLs, and `&format=markdown` returns the Markdown rendering.
- [ ] `GET /api/v1/agent/feedbacks?project=<another organization's publicId>` returns 404
      `{ "error": "Project not found", "code": "NOT_FOUND" }`.
- [ ] `POST /api/v1/agent/feedbacks` with a small batch creates the Feedbacks, returns 201 with
      `created`, `feedbacks`, `reviewer` and `atLimit`, and opens no tracker Issue.
- [ ] `POST /api/v1/agent/feedbacks/<id>/status` with `{"status":"resolved"}` returns 200
      `{ id, status, updatedAt }` and mirrors the Status to the linked Tracker.
- [ ] The same call repeated returns 200 again and mirrors nothing the second time (the no-op
      decision above).
- [ ] `POST /api/v1/agent/feedbacks/<a Feedback of another Organization>/status` returns 404
      `{ "error": "Feedback not found", "code": "NOT_FOUND" }`.
- [ ] A token without `feedbacks:update_status` returns 403 `Insufficient permissions`, and no token
      returns 401 `Unauthorized`.
- [ ] The MCP server (`@fasterfixes/mcp`) lists, creates and resolves a Feedback against this build
      with no change of its own.

### The Jira token refresh tells a refusal from an outage (issue #89)

Decision 7, and the fix of the bug the inventory called "the Jira refresh trap". `refreshUnderLock`
in `server/jira/token-access.ts` wrapped `refreshAccessToken` in a bare `catch {}`: an Atlassian
5xx, a network failure and an explicit `invalid_grant` all ended as `JiraReauthRequiredError`, all
flipped the Installation to **Reconnect required** and all triggered the reconnect email. Only the
Inngest retries hid it, by refreshing successfully on the next attempt and writing `connected` back.

**What changed.** `refreshAccessToken` in `server/jira/jira-client.ts` now throws
`JiraRequestError(status, body, "/oauth/token")` instead of a bare `Error` whose message carried the
status as text, so the caller can discriminate. `refreshUnderLock` catches with a predicate,
`isRefusedByAtlassian`: a 4xx (`invalid_grant`, `unauthorized_client`) keeps today's behaviour
(write **Reconnect required**, throw `JiraReauthRequiredError`, which `getValidJiraAccessToken`
turns into the `jira/oauth.revoked` event); anything else is rethrown untouched, writes nothing,
emits nothing and is retried by the caller. The refresh token is decrypted before the `try` on
purpose: a key or payload problem is ours, not a refusal, and must not flip an Installation.

No new error class was introduced: `JiraRequestError` already carries the status and is the
infrastructure error decision 5 leaves as a plain `Error`, so the "expected Jira errors outside the
vocabulary" check that #90 has to pass still sees one `extends Error` in `server/jira/*.ts`.

**Deliberate behaviour change.** A transient Atlassian failure during a refresh no longer marks a
healthy Installation as **Reconnect required** and no longer emails the Organization to reconnect;
the run fails with an infrastructure error and retries, as an outage should.
`refresh-jira-installation-webhooks` is unchanged and still skips on the two Jira domain errors,
so a transient failure now makes that run retry instead of reporting
`skipped: "reauthorization_required"`. This is the prerequisite of #91: wrapping the three Jira
Inngest functions as non-retriable before this fix would have lost a Feedback mirror on a brief
Atlassian outage.

**Tests.** `server/jira/token-access.test.ts` (8 cases) drives `getValidJiraAccessToken` with
`@workspace/db` and `@/server/inngest` mocked at the module boundary and `fetch` stubbed, so the
real `refreshAccessToken` and the real cipher run: fresh token takes the fast path with no lock and
no fetch; no Installation rejects with `JiraNotConnectedError`; a successful refresh stores the
rotated token, `connected` and a cleared `reconnectNotifiedAt`; a 400 `invalid_grant` writes
**Reconnect required** and emits `jira/oauth.revoked`; a 503 and a network `TypeError` write nothing
and emit nothing; a missing refresh token still asks for a reconnect; the loser of the lock race
returns the token the winner just wrote. The two outage cases fail against the previous `catch {}`,
which is what makes them worth their lines.

**Checks at this commit.**

| Check                                      | Result                                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| Blind refresh catch                        | `grep -n "catch {" server/jira/token-access.ts` returns nothing |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (171 web tests, zero warnings)                             |
| `pnpm lint:agent-rules`                    | 0 errors, 88 `no-raw-tailwind-colors` warnings (#104/#105)      |
| `pnpm --filter web build`                  | every route listed                                              |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason
recorded under issue #88.

**Smoke checklist for the maintainer** (a real Jira Installation against a real database):

- [ ] With Atlassian reachable, let an access token expire (or set `tokenExpiresAt` in the past) and
      open Jira settings: the page loads, the Installation stays `connected`, and the row shows a new
      `tokenExpiresAt` and a rotated `refreshToken`.
- [ ] Point the token endpoint at an unreachable host (or block `auth.atlassian.com`) with an expired
      token, then trigger a Jira sync: the run fails and retries, `healthState` stays `connected`,
      `reconnectNotifiedAt` is untouched, and no reconnect email arrives.
- [ ] Revoke the app from the Atlassian account (or corrupt the stored refresh token so Atlassian
      answers `invalid_grant`) and trigger a Jira sync: `healthState` becomes `reconnect_required`,
      `jira/oauth.revoked` fires once, the reconnect email arrives, and Jira settings prompts to
      reconnect.
- [ ] Reconnect the Installation: `healthState` returns to `connected` and `reconnectNotifiedAt` is
      cleared, so a later revocation can notify again.

### The expected Jira errors join the vocabulary (issue #90)

Decision 5. `JiraNotConnectedError`, `JiraReauthRequiredError` and `JiraIssueConfigurationError` now
extend `PreconditionFailedError`, so the five tRPC-reachable services that read the Jira access token
answer `PRECONDITION_FAILED` with copy instead of a 500, with no per-service `catch` added anywhere.
`JiraRequestError` and `EmailError` are infrastructure and stay plain `Error`.

**Where they live.** The three classes moved into a new `server/jira/errors.ts`, which imports the
vocabulary and nothing else. They were split between `token-access.ts` (database client, token
cipher, Inngest client at module load) and `jira-rest-client.ts`, so naming one in a test meant
stubbing three env vars and mocking two modules. The transport test needs to name a real
second-level subclass rather than a local lookalike, which is what forced the move. The four
importers (`token-access.ts`, `jira-rest-client.ts`, the two Inngest functions) and
`token-access.test.ts` were repointed; no name and no field changed, so every `instanceof` check
behaves as before. The "expected Jira errors outside the vocabulary" check still greps
`server/jira/*.ts` and now sees three `PreconditionFailedError` and one `Error`.

**The messages became user copy.** `JiraNotConnectedError` reads
`Jira is not connected. Connect a Jira site first.` and `JiraReauthRequiredError` reads
`The Jira connection needs to be re-authorized.`, word for word the two sentences the
`get-jira-access` pre-check already throws for the same two facts, so a screen reads identically
whichever of the two fires. `JiraIssueConfigurationError` carried the raw Jira response body in its
message; the body stays on its `detail` field and the message is now one sentence per reason
("The linked Jira project is no longer available. …" / "The linked Jira issue type no longer accepts
this issue. …"), both pointing at the Project settings. Nothing read `detail` or that message
before, and `create-jira-issue` still stores `error.reason` verbatim in `linkHealthIssue`.

**Behaviour change.** The five Jira screens (Organization Jira settings and site selection, and the
three Project Jira link procedures) answer 412 with a sentence where they previously answered 500
with a masked framework message. The two Inngest catch sites are untouched:
`refresh-jira-installation-webhooks` still skips on the two token errors and `create-jira-issue`
still records the link health issue.

**Tests.** `server/trpc/domain-error-mapping.test.ts` gains one case: a real
`JiraReauthRequiredError` thrown from a procedure comes out as `PRECONDITION_FAILED` with its copy
and the original as `cause`, proving the middleware maps on the inherited code rather than on the
class. No test was written for "the subclass extends the base class": `token-access.test.ts` already
pins the two token errors through `instanceof`, and a third assertion would only restate the
`extends` clause.

**Checks at this commit.**

| Check                                       | Result                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Expected Jira errors outside the vocabulary | three `PreconditionFailedError`, `JiraRequestError` the only `Error`      |
| Per-service catch in the five Jira services | only the pre-existing webhook-registration swallow in `link-jira-project` |
| `pnpm typecheck`, `pnpm test`, `pnpm lint`  | pass (172 web tests, zero warnings)                                       |
| `pnpm lint:agent-rules`                     | 0 errors, 88 `no-raw-tailwind-colors` warnings (#104/#105)                |
| `pnpm --filter web build`                   | every route listed                                                        |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Smoke checklist for the maintainer** (a real Jira Installation against a real database):

- [ ] With no Jira Installation on the Organization, open Organization integrations and start the
      Jira site selection: the screen shows "Jira is not connected. Connect a Jira site first."
      rather than a generic failure.
- [ ] With the Installation in **Reconnect required**, open the Project's Jira link settings and
      open the project and issue-type pickers: each shows "The Jira connection needs to be
      re-authorized." and the network response is 412, not 500.
- [ ] Set `tokenExpiresAt` in the past and revoke the grant on the Atlassian side, then open Jira
      site selection: the same re-authorization sentence appears and the Installation is flipped to
      **Reconnect required** once.
- [ ] Delete the linked Jira project on the Atlassian side and trigger an issue creation for a
      Feedback: the run still reports `jira_configuration_rejected`, `ProjectJiraLink.linkHealthIssue`
      is `stale_project`, and the Jira link settings still surface the ill-health badge.
- [ ] With the Installation healthy, link a Jira project and create an issue end to end: nothing in
      the happy path changed.

### A Jira failure that cannot be retried away fails on the first attempt (issue #91)

Decision 11, and the last link of the Jira leg. `src/server/errors/non-retriable.ts` holds
`rethrowDomainErrorsAsNonRetriable(error): never`, the kit's helper verbatim: a `DomainError`
becomes `NonRetriableError(error.message, { cause: error })`, anything else is rethrown untouched
and keeps its retries. It lands with its first callers, as the kit asks.

**The three wrapped functions.** `create-jira-issue`, `sync-feedback-status-to-jira` and
`sync-jira-issue-status` are the three of seventeen Inngest functions that let a Jira `DomainError`
bubble, all through the same call: `getValidJiraAccessToken`, which throws `JiraNotConnectedError`
or `JiraReauthRequiredError`. Each now reads
`getValidJiraAccessToken(...).catch(rethrowDomainErrorsAsNonRetriable)`, one line and one comment
per function, on the call that can throw rather than around the whole body: the bodies have no other
domain-error source today, and a `try` around them would only re-indent three long handlers.
`refresh-jira-installation-webhooks` already catches both errors and reports a `skipped` result, so
it is untouched, and the other thirteen functions cannot receive a `DomainError`. Wrapping them
would be dead code posing as a guarantee.

**The configuration error keeps its own handling.** `JiraIssueConfigurationError` never reaches the
new helper: `create-jira-issue` still catches it around `createIssue`, writes
`ProjectJiraLink.linkHealthIssue` and returns `jira_configuration_rejected`, so a stale Jira project
or issue type stays non-retried and still surfaces in the Project's Jira link settings, exactly as
before.

**Deliberate behaviour change.** A run whose Organization has no Jira Installation, or whose
Installation is in **Reconnect required**, now fails on the first attempt instead of the fourth, and
the run history shows `NonRetriableError` with the user copy of the domain error as its message and
the original error as its `cause`. Nothing else changes: a transient Atlassian failure is an
infrastructure `Error` since issue #89 and still gets its three retries, which is why that fix had to
land first. A Feedback mirror is not lost by an outage.

**Tests.** `server/errors/non-retriable.test.ts` (4 cases) drives the helper directly: a
`NotFoundError` comes out as a `NonRetriableError` with the same message and the original as
`cause`; a second-level subclass of the vocabulary is recognized through the base class; an
infrastructure `Error` comes out as the very same object and is not a `NonRetriableError`; a thrown
non-error value is rethrown as it is. The Inngest function bodies are not tested: the repo has no
Inngest harness, and the wrapper is one line per function.

**Checks at this commit.**

| Check                                      | Result                                                     |
| ------------------------------------------ | ---------------------------------------------------------- |
| Functions wrapped                          | exactly three, the fourteen others untouched               |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (176 web tests, zero warnings)                        |
| `pnpm lint:agent-rules`                    | 0 errors, 88 `no-raw-tailwind-colors` warnings (#104/#105) |
| `pnpm --filter web build`                  | every route listed                                         |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Smoke checklist for the maintainer** (a real Jira Installation against a real database, watched in
the Inngest dev server or dashboard):

- [ ] With the Installation flipped to **Reconnect required**, submit a Feedback on a Project whose
      Jira link auto-creates issues: the `create-jira-issue` run fails once, with no retry, and its
      error reads "The Jira connection needs to be re-authorized."
- [ ] With the same Installation state, change a Feedback's Status in the inbox: the
      `sync-feedback-status-to-jira` run fails once, with no retry, and the Feedback keeps its new
      Status in the app.
- [ ] Delete the Jira Installation row of the Organization while a Project Jira link survives, then
      trigger an export to Jira: the run fails once with "Jira is not connected. Connect a Jira site
      first."
- [ ] Block `auth.atlassian.com` with an expired access token and trigger an issue creation: the run
      still retries three times (the outage path of issue #89) and the Installation stays
      `connected`.
- [ ] With everything healthy, create an issue, mirror a Status to Jira, and move the issue in Jira:
      all three runs succeed as before.

### Sign-in errors move into the service, the login form branches on the code (issue #92)

Decision 6, and the first link of the router leg. `signInUser` now owns both translations Better
Auth reports through its message text, and `signInUser` in `_domains/auth/trpc-router.ts` is one
line: the auth procedure, the schema and the service call.

**Rejected credentials become `BadRequestError`.** The router's `TRPCError UNAUTHORIZED` is gone. A
wrong password is a rejected input, not a missing session, so the vocabulary still has no
`UNAUTHORIZED`. The copy is unchanged, "Invalid email or password", and the form still renders it in
its destructive alert: the transported code moved from 401 to 400, which no client reads.

**The sentinel is gone.** `ForbiddenError("EMAIL_NOT_VERIFIED")` became
`PreconditionFailedError("Verify your email address before signing in.")`, real copy safe to show in
any channel. `PRECONDITION_FAILED` is reserved for that one case in `signInUser`, so
`login-form.client.tsx` branches on `error.data?.code === "PRECONDITION_FAILED"` and keeps rendering
the "Email not verified" alert with the resend button. `EMAIL_NOT_VERIFIED` appears nowhere under
`apps/web/src` any more.

**What this ticket did not touch.** `resetPassword` and `stopImpersonate` keep their router-level
`TRPCError` and their `catch`: they are issue #93. The `DomainError` and `TRPCError` imports of the
router therefore stay until that ticket lands. The router's `console.error` on an unexpected sign-in
failure was dropped rather than moved into the service: central logging of every tRPC failure is
issue #97, which lands before masking (#98), so no window exists where an unexpected failure is both
masked and unlogged.

**Tests.** `_domains/auth/_services/sign-in-user.test.ts` (4 cases), Better Auth mocked at module
level as the existing `send-verification-email.test.ts` does: a rejected password yields a
`BadRequestError` carrying today's copy, an unverified email yields a `PreconditionFailedError`
carrying the new copy, an unrelated failure comes out as the very same object, and a successful
sign-in returns the Better Auth user with the credentials passed through unchanged.

**Checks at this commit.**

| Check                                      | Result                                                     |
| ------------------------------------------ | ---------------------------------------------------------- |
| `EMAIL_NOT_VERIFIED` under `apps/web/src`  | no match                                                   |
| `catch` / `new TRPCError` in `signInUser`  | none, in the service and in the procedure                  |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (180 web tests, zero warnings)                        |
| `pnpm lint:agent-rules`                    | 0 errors, 88 `no-raw-tailwind-colors` warnings (#104/#105) |
| `npx next build`                           | every route listed, `/login` included                      |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Smoke checklist for the maintainer** (a real database, at `/login`):

- [ ] Sign in with a verified account and a wrong password: the destructive alert reads "Invalid
      email or password", and no toast or stack detail appears.
- [ ] Sign in with an unknown email address: the same alert and the same copy, so the form still
      does not reveal whether the address exists.
- [ ] Sign in with an account whose email is not verified: the "Email not verified" alert appears
      with the resend button, not the destructive alert, and the copy never shows a code.
- [ ] Press "Resend verification email" from that alert: the email arrives and the button reports
      success, unchanged from before.
- [ ] Sign in with correct credentials on a verified account: the redirect to the dashboard, or to
      `nextUrl` when present, still happens.

### The reset link, the Organization limit and the stop-impersonation rule move into services (issue #93)

Decision 6, second link of the router leg. `_domains/auth/trpc-router.ts` and
`_domains/organization/trpc-router.ts` are wiring only: no `catch`, no `new TRPCError`, no import of
`DomainError` or `TRPCError` left in either file. Three rules moved down, each keeping today's copy,
so a User sees no change.

**The reset link translation.** `resetPassword` now owns the Better Auth message matching the
`resetPassword` procedure held. A refused token throws
`BadRequestError("The reset link is invalid or has expired.")` instead of the router's
`TRPCError UNAUTHORIZED`, for the same reason sign-in dropped its own: a rejected token is a rejected
input, not a missing session, so the vocabulary still has no `UNAUTHORIZED`. The transported code
moves from 401 to 400, which no client reads: `reset-password-form.client.tsx` renders
`error.message` in its destructive alert. The service's own `BadRequestError("Missing token. Invalid
reset link.")` is thrown before the `try`, so it can no longer be caught and re-translated by its own
matcher, which is why the router's `error instanceof DomainError` rethrow is gone rather than moved.

**The stop-impersonation rule.** `stopImpersonate` reads the session itself, with
`auth.api.getSession({ headers })`, and throws `BadRequestError("User is not currently
impersonating")` when `session.session.impersonatedBy` is empty. The procedure no longer touches
`ctx`. The alternative was to pass `impersonatedBy` in from the procedure, which keeps the extra
session read out of a rare admin action but leaves the service depending on its caller for the fact
it is deciding on. The service reads it, so the rule holds for any transport that calls it later
(an Inngest job, a route handler), which is the point of Option B.

**The Organization limit of the Plan.** `createOrganization` calls `checkOrganizationLimit` itself
and throws `ForbiddenError` with the message the procedure used to build, down to the counters
(`(current/limit)`). It gained the injected `db: typeof prisma = prisma` parameter the other
converted services use, and passes it to the limit check, so the check and the write see the same
client. The `cause: organizationCheck.denial` that the old `TRPCError` carried is dropped: the
`domainErrorMiddleware` overwrites `cause` with the `DomainError` anyway, and no client reads the
denial. The dialog keeps rendering `error.message` as a root form error.

Not the `enforce-limit` and `enforce-feature` middlewares: they are the tRPC boundary, they keep
throwing `TRPCError`, and they are untouched by this ticket.

**Tests.** Three new files, Better Auth and the limit check mocked at module level as
`sign-in-user.test.ts` does:

- `_domains/auth/_services/reset-password.test.ts` (5 cases): a missing token refuses before Better
  Auth is called, an invalid token and an expired token both yield the new copy, an unrelated failure
  comes out as the same object, a successful reset returns Better Auth's answer with the body and
  headers passed through.
- `_domains/auth/_services/stop-impersonate.test.ts` (3 cases): no impersonation and no session at
  all both yield `BadRequestError` without calling `stopImpersonating`, an active impersonation
  returns `{ success: true, session }`.
- `_domains/organization/_services/create-organization.test.ts` (2 cases): a reached limit yields
  `ForbiddenError` with the counters in the copy and writes nothing (not even a slug lookup), an
  allowed owner gets the Organization created with the `owner` membership.

**Checks at this commit.**

| Check                                      | Result                                                     |
| ------------------------------------------ | ---------------------------------------------------------- |
| `catch` in `trpc-router.ts`                | `account/trpc-router.ts` only, which is issue #94          |
| `new TRPCError` in `trpc-router.ts`        | `account/trpc-router.ts` only, which is issue #94          |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (190 web tests, zero warnings)                        |
| `pnpm lint:agent-rules`                    | 0 errors, 88 `no-raw-tailwind-colors` warnings (#104/#105) |
| `npx next build`                           | every route listed, `/reset-password` included             |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Smoke checklist for the maintainer** (a real database):

- [ ] Open a password reset link that was already used, or edit its token, and submit two matching
      passwords: the destructive alert reads "The reset link is invalid or has expired." and no stack
      detail or code appears.
- [ ] Open `/reset-password` with no `token` query parameter and submit: the alert reads "Missing
      token. Invalid reset link."
- [ ] Complete a real password reset from a fresh email link: the form redirects to the success
      screen and the new password signs in.
- [ ] As an admin impersonating a User, press the impersonation button and confirm: the admin
      account is restored and the redirect to `/admin` still happens.
- [ ] On a free Plan with one Organization, create a second one from the sidebar dialog: the form
      shows "You've reached the organizations limit for your plan (1/1). Upgrade to get more."
- [ ] On a paid Plan, create a second Organization: it is created, becomes active, and appears in the
      sidebar.

### The account router error translations move into services (issue #94)

Decision 6, third and last link of the router leg. `(authenticated)/account/trpc-router.ts` is
wiring only, and with it the repo-wide checks are green: no `trpc-router.ts` under `apps/web/src`
holds a `catch` or a `new TRPCError` any more. Both moved translations keep today's copy, so a User
sees no change.

**The two wrong-password translations.** `updatePassword` throws
`BadRequestError("Current password is incorrect.")` and `deleteAccount` throws
`BadRequestError("Password is incorrect.")`, in place of the procedures' `TRPCError UNAUTHORIZED`,
for the reason sign-in and the reset link already dropped theirs: a rejected password is a rejected
input, not a missing session. The transported code moves from 401 to 400, which no client reads.
`password-form.client.tsx` and `account-deletion-button.client.tsx` both set `error.message` as a
root form error and render it in a destructive alert.

**Precedence inside `deleteAccount` is preserved.** Its OAuth branch
("Please contact support to delete your account.") used to be guarded by a negated identity match,
because the router answered a password failure first. The guard is gone: the password branch now
throws before the OAuth branch is reached, so a Better Auth message naming both a password and a
provider still yields "Password is incorrect." A test pins that order.

**The "session expired" branch is dropped as unreachable, not re-coded.** Both procedures held a
second `TRPCError UNAUTHORIZED` branch, matching `session` or `Session` in the Better Auth message
("Your session has expired. Please sign in again." for the deletion, "You must be signed in" for the
password change). Both are `protectedProcedure`, and `createContext` resolves the session from the
very headers the services then pass to Better Auth: a caller with no session is already refused by
the `protectedProcedure` middleware with `UNAUTHORIZED`, before the service runs. The only way to
reach the branch is a revocation landing between the context read and the Better Auth call, in the
same request. Translating that race would mean either inventing an `UNAUTHORIZED` the vocabulary
deliberately does not have, or filing it under a code that does not describe it
(`BadRequestError` on a session that vanished is not a rejected input). So it is dropped: the race
surfaces as an unexpected error, which is a 500 today and the generic masked sentence from #98 on,
and the User's next request is refused at the transport edge and sent back to the login page, which
is the outcome the copy was asking for anyway. The `deleteAccount` service also stops matching
`session` and `Session` to shield its OAuth branch, since there is no longer a session branch to
give precedence to.

**Tests.** Better Auth mocked at module level, as in `sign-in-user.test.ts`:

- `account/settings/_services/update-password.test.ts` (3 cases, new): a rejected current password
  yields `BadRequestError` with today's copy, an unrelated failure comes out as the same object, a
  successful change calls Better Auth with `revokeOtherSessions: true` and returns
  `{ success: true }`.
- `account/settings/_services/delete-account.test.ts` (5 cases, 3 rewritten): a rejected password
  yields `BadRequestError("Password is incorrect.")`, a social-only account still gets the support
  copy, a message naming both answers the password first, an unrelated failure propagates
  untranslated, a successful deletion passes the presented password through. The old "lets an
  identity failure through for the procedure to answer" case is replaced by the precedence case: the
  procedure no longer answers anything.

**Checks at this commit.**

| Check                                      | Result                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| Per-procedure mapping                      | `grep -rn "catch" --include="trpc-router.ts"` returns nothing                          |
| Transport errors in routers                | `grep -rn "new TRPCError" apps/web/src/app --include="trpc-router.ts"` returns nothing |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (194 web tests, zero warnings)                                                    |
| `pnpm lint:agent-rules`                    | 0 errors, 88 `no-raw-tailwind-colors` warnings (#104/#105)                             |
| `npx next build`                           | every route listed, `/settings` included                                               |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Smoke checklist for the maintainer** (a real database):

- [ ] In `/settings`, submit the password form with a wrong current password and a valid new one: the
      destructive alert reads "Current password is incorrect." and nothing else changes.
- [ ] Submit the password form with the right current password: the success toast appears, the form
      resets, and the new password signs in on a fresh browser session.
- [ ] In `/settings`, open the account deletion dialog and confirm with a wrong password: the alert
      inside the dialog reads "Password is incorrect." and the account still exists.
- [ ] Confirm the deletion with the right password on an account created with email and password: the
      success toast appears, the session is signed out and the browser lands on `/`.
- [ ] On an account that only has a social provider, open the deletion dialog and confirm: the alert
      reads "Please contact support to delete your account."

### `no-raw-tailwind-colors` reshaped around a hue-to-token table (issue #104)

Decision 16, first half. The rule now reports a raw palette class only when the theme has a
semantic token for that hue, and its message names the class to write instead. It stays at `warn`;
the 10 remaining sites and the move to `error` are #105. No theme token was added and no product
file was touched.

**The table lives in the rule, the paths in the config.** `DEFAULT_HUE_TOKENS` in
`local-rules/no-raw-tailwind-colors.js` maps `red` to `destructive`, `green` and `emerald` to
`success`, and the five neutral hues (`slate`, `gray`, `zinc`, `neutral`, `stone`) to `muted`,
`border` and `foreground`. A hue absent from the table is not reported, so the rule never asks for a
token that does not exist: adding `warning` and `info` to the theme and a line to the table is what
unlocks yellow, amber and blue. The table is overridable through a `hueTokens` option, which the
tests use in both directions; the shared config passes no table and takes the default, so there is
one source for it. The chart `fill-` allowance and the `.stories.`/`/emails/` ignores are unchanged.

**The message names the replacement.** A hue with a single token yields the utility of the offending
class plus the token ("Avoid raw Tailwind color class `text-red-500`. Use `text-destructive`
instead."). A neutral hue, where the right token depends on what the class is for, names the three
("Use one of the `muted`, `border` or `foreground` token classes instead.").

**The four home page illustration files join `ignorePathPatterns`**, each as its own anchored
pattern in `next.js`: `hero/hero-flow-animation.client.tsx`, `how-it-works/flow-animations.tsx`,
`before-after-section.tsx` and `problem/problem-chat-animation.client.tsx`. They are drawn mock
screens whose fixed colours are the point.

**Correction to the inventory: 10 sites remain, not 11.** The inventory row above splits the 16
product-screen warnings as 7 green or emerald, 4 red and 5 yellow, amber or blue. The real split is
6, 4 and 6: green appears 5 times (`current-plan-card.client.tsx`, `pricing-card.tsx`,
`plan-card.tsx`, and `email-form.client.tsx` twice, once behind a `dark:` variant) and emerald once,
while the unreported group holds 6 classes (`text-amber-500` in `app-navigation.client.tsx`,
`border-yellow-800/20` and `bg-yellow-50` on one line of `subscription-status-banner.client.tsx`,
`border-blue-800/20` and `bg-blue-50` on another, and `text-blue-400` in
`email-information.client.tsx`). So the count after this ticket is 10 warnings, down from 88, and
#105 fixes 10 sites rather than 11. Nothing else in decision 16 changes.

**The 10 sites left for #105**, all in product screens:

| File                                                                         | Class                                   |
| ---------------------------------------------------------------------------- | --------------------------------------- |
| `(authenticated)/account/billing/.../current-plan-card.client.tsx:164`       | `text-green-600`                        |
| `(authenticated)/account/settings/_features/email/email-form.client.tsx:131` | `text-green-600`, `dark:text-green-400` |
| `(public)/pricing/_features/pricing-card.tsx:78`                             | `text-green-600`                        |
| `_domains/subscription/plan-card/plan-card.tsx:86`                           | `text-green-600`                        |
| `admin/(dashboard)/.../users-overview-card.client.tsx:46`                    | `text-emerald-600`                      |
| `admin/_features/sidebar/sidebar-user-dropdown.client.tsx:132`               | `text-red-600`                          |
| `admin/users/[id]/.../user-organization-select.client.tsx:38`                | `text-red-500`                          |
| `admin/users/[id]/.../email-information.client.tsx:40` and `:59`             | `text-red-600` twice                    |

**Tests.** `no-raw-tailwind-colors.test.js` keeps its `RuleTester` shape and swaps the hues its
cases use: a reported hue with the token asserted in the full message, the utility carried into the
suggestion (`border-emerald-400` to `border-success`), a neutral hue naming its three tokens, a
reported hue behind a `dark:` prefix, an unreported hue (blue, and amber behind a variant), the
chart `fill-` allowance and a `fill-gray-500` outside it, and the `hueTokens` option removing a hue
and adding one. `next-config.test.js` gains a block that lints a mock screen holding `bg-zinc-800`
and `text-red-500` through the real config at each of the four illustration paths and expects no
report, with a neighbour file in the same folder reporting both classes so the empty results cannot
come from the rule being off.

**Checks at this commit.**

| Check                                      | Result                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| `pnpm lint:agent-rules`                    | 0 errors, 10 `no-raw-tailwind-colors` warnings, down from 88 |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (194 web tests, 188 eslint-config tests, zero warnings) |
| `npx next build`                           | every route listed                                           |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

No smoke checklist: the ticket changes lint output only, and no rendered pixel moves until #105.

**Debt noticed, not fixed.** `rules/frontend.md` lists `warning` and `info` among the design-system
colour tokens, and neither exists in `packages/ui/src/styles/globals.css`. Out of scope here, since
this step adds no token; worth an aligned sentence when one is added.

### The reset email failure becomes a domain error, `handleTRPCError` retired (issue #95)

Decisions 2 and 13, the fourth link of the chain and the last thing that has to be true before
masking can land. Nothing reachable by a User carries copy inside a bare `Error` any more, and the
tRPC transport has one logging path left to fill in #97.

**The one user-copy site is converted.** `server/auth/config/email-and-password.tsx` caught a mailer
failure and rethrew `new Error("Failed to send the password reset email. Please try again.")`. It
now throws `PreconditionFailedError` with the same sentence and the mailer failure as its `cause`.
`PRECONDITION_FAILED` rather than `BAD_REQUEST`: the request was well formed and permitted, and what
failed is a state of the world outside the User's input, the same reading that puts
`JiraReauthRequiredError` under that code. No second-level subclass: no caller has to tell this case
from another `PreconditionFailedError`, and the ADR asks for the information to sit in the message.
The `console.error` line above the throw stays, since it is the only place the underlying mailer
error is named.

**The copy is not user-visible today, and the conversion does not make it so.** Better Auth 1.5.4
calls `sendResetPassword` through `runInBackgroundOrAwait`, and `server/auth/index.ts` configures
`advanced.backgroundTasks.handler` with Next's `after`. Both branches of that helper swallow the
rejection into `logger.error("Failed to run background task:", e)`; the endpoint has already decided
to answer `{ status: true, message: "If this email exists in our system, check your email for the
reset link" }` whether the send succeeded or not, which is the usual anti-enumeration answer. So
neither `auth.requestPasswordReset` (the forgot-password form) nor `admin.users.requestPasswordReset`
can surface this sentence, before or after this commit. The user story behind the ticket ("the User
still sees that sentence") describes a path that better-auth closed; the conversion is still the
right move, because the sentence would otherwise be masked the moment it did travel, and because a
bare `Error` carrying final copy is the pattern #98 is allowed to assume is absent. Whether the
background hand-off should be reversed so a mailer outage is visible at all is a product question,
not an error-model one: recorded here as debt, not decided.

**Re-count of the bare `Error` sites under `src/server`, for #98.** The inventory at `c1b47bd` read
28 infrastructure sites plus this one. At this commit `grep -rn "throw new Error(" apps/web/src/server`
returns 26, of which one is the assertion helper inside `trpc/domain-error-mapping.test.ts`: 25
infrastructure sites in production code. The drift is #89, which replaced the bare refresh failures
of `jira/token-access.ts` with a status-carrying error. All 25 are missing environment variables,
failed provider calls and protocol violations (`linear-client`, `jira-client`, `jira-rest-client`,
`slack-client`, `webhook-registration`, `verify-webhook`, `build-asset-url`, `create-linear-issue`,
`check-resource-limit`, `auth/plugins/stripe`). None carries user copy, and one bare `throw Error(`
(no `new`) in `auth/config/email-verification.tsx`, "This user does not exist.", is an internal
consistency check on a user Better Auth has just looked up, not a sentence meant for a screen. They
stay bare, so they surface as a 500 and are logged. #98 re-reads this paragraph rather than the
`c1b47bd` count.

**`handleTRPCError` is retired.** `lib/trpc/handle-trpc-error.ts` had no importer and threw a
hand-rolled `INTERNAL_SERVER_ERROR` with its own generic copy, which would have been a second
masking path competing with the `errorFormatter` of #98. It is now
`lib/trpc/_deprecated_handle-trpc-error.ts`, two comment lines and an `export {}`, following the
stub convention of step 3.

**Checks at this commit.**

| Check                                      | Result                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Bare errors in services                    | `grep -rn "throw new Error(" apps/web/src \| grep _services/` returns nothing |
| `handleTRPCError` importers                | `grep -rn "handleTRPCError" apps/web/src packages` returns nothing            |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (194 web tests, zero warnings)                                           |
| `pnpm lint:agent-rules`                    | 0 errors, 10 `no-raw-tailwind-colors` warnings (#105)                         |
| `npx next build`                           | every route listed, `/forgot-password` and `/reset-password` included         |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

No automated test: the changed file is a Better Auth options object, not a service, and the testing
policy covers `_services/` and `_helpers/`. The behaviour it guards is unobservable through the
transport for the reason given above.

**Left for the maintainer.** Delete `apps/web/src/lib/trpc/_deprecated_handle-trpc-error.ts`. It has
no importer and exports no value, so typecheck, tests and the build pass without it.

**Smoke checklist for the maintainer** (a real database):

- [ ] On `/forgot-password`, submit a registered email with the mailer working: the confirmation
      message appears and the reset email arrives.
- [ ] Break the mailer (an invalid `RESEND_API_KEY` or an unreachable SMTP host) and submit the same
      form: the page still shows the neutral confirmation, and the server log holds
      "Error sending reset password email:" followed by "Failed to run background task:". No stack
      and no internal wording reaches the browser.
- [ ] In `/admin/users/<id>`, use "Request password reset" with the mailer working: the success toast
      appears and the email arrives.

### `services-no-bare-error` becomes always-on for services (issue #96)

Decision 3, the fifth link of the chain and the last thing to land before masking. The pre-commit
hook now rejects a bare `Error` in a service: the rule runs at `error` in plain `pnpm lint`, outside
the agent gate, so lint-staged catches it on staged `ts`/`tsx` files rather than only in
`lint:agent-rules`.

**One entry, one glob.** The rule moved out of the agent-gated `**/_services/**` block of
`packages/eslint-config/next.js` into its own always-on block with the same glob and severity
`"error"`. Nothing about the rule implementation changed, and no option was added. The three other
service rules (`services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`) stay
behind the gate: they are convention rules, not a correctness guard on user-visible behaviour.

**The server folder is untouched,** as decision 3 requires. The glob is the rule's whole reach, so the
28 infrastructure `throw new Error(` sites under the server folder keep surfacing as a 500, with no
`eslint-disable` line anywhere. They join the sweep in step 5, when those files move into a domain.

**The tree was already clean.** `grep -rn "throw new Error(" apps/web/src | grep _services/` returned
nothing before the flip and after it, and no suppression was added: the flip cost zero product
edits. `grep -rn "eslint-disable.*services-no-bare-error" apps/web/src packages` returns nothing too.

**Tests.** `next-config.test.js` loses the rule from `STEP_3_RULES` (whose "stays off outside the
agent gate" case is now false for it) and gains a `services-no-bare-error` block: the rule is
declared exactly once for `**/_services/**/*.{ts,tsx}` at `"error"`; with `ESLINT_AGENT_RULES=0` it
still resolves to `2` for a domain service and for `api/v1/agent/_services/require-agent-auth.ts`;
and it resolves to `undefined` for `src/server/auth/email-and-password.tsx` and
`src/server/jira/client.ts`. The last case was checked against a mutant config whose glob is
`**/*.{ts,tsx}`: it resolves to `2` there, so the `undefined` is the glob and not a dead resolver.

**Checks at this commit.**

| Check                                      | Result                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Bare errors in services                    | `grep -rn "throw new Error(" apps/web/src \| grep _services/` returns nothing |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (194 web tests, 191 eslint-config tests, zero warnings)                  |
| `pnpm lint:agent-rules`                    | 0 errors, 10 `no-raw-tailwind-colors` warnings (#105)                         |
| `npx next build`                           | every route listed, both agent routes included                                |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

No smoke checklist: the ticket changes lint configuration only, and no shipped byte moves.

**Debt for the final lock.** ADR 0012's status note still reads that step 4 "makes it unconditional
and sweeps `src/server/**`". The sweep is deferred to step 5 by decision 3, so the sentence is
corrected with the rest of the note in #106.

### Every tRPC failure is logged with its cause chain (issue #97)

Decision 13, first half. Masking the message of an `INTERNAL_SERVER_ERROR` (#98) is only safe once
the original failure is written server-side, so the logging lands first, on its own commit. Nothing
a client observes changes: the hook returns `void` and runs after the response shape is decided.

**One exported function, not an inline arrow.** `src/server/trpc/log-trpc-error.ts` exports
`logTRPCError`, and `app/api/trpc/[trpc]/route.ts` passes it as the `onError` of
`fetchRequestHandler`. The route file is otherwise untouched. Exporting it is what makes the logged
shape verifiable: the test drives the same function tRPC calls in production, rather than asserting
on a copy of it.

**What one failure writes.** A single `console.error` call, with a prefix line naming the procedure
(`tRPC <type> <path> failed with <code>`, `<unknown path>` when tRPC has no path, as on a malformed
request), then the `TRPCError` itself, then every link of its `cause` chain as a separate argument.
The chain matters because the reason is rarely the top error: a service's `DomainError` arrives
wrapped by the base procedure's mapping middleware, and a Jira failure wraps the Atlassian error in
turn. The walk stops on a cause that has already been seen, so a chain pointing back at itself
cannot hang a request.

**No logger, no provider.** `console.error` only, as decision 13 requires. No `instrumentation.ts`,
no monitoring SDK, no log formatting library: `grep -rn "instrumentation" apps/web/src` returns
nothing and `apps/web/package.json` is unchanged. Choosing a provider is a decision the maintainer
makes outside the migration; this step only guarantees there is something to send.

**Every failure is logged, including the expected ones.** A `NOT_FOUND` from a service reaches
`console.error` like a 500 does. Filtering by code was rejected: the volume is low, and an expected
failure the User reports is exactly the one worth finding in the output. If the noise becomes real,
the filter belongs in the provider, not in the hook.

**Tests.** `log-trpc-error.test.ts` (5 cases), with `console.error` spied and restored per test.
Four call the hook directly: the prefix names the procedure, its type and its code; a two-link chain
(`TRPCError` wrapping a `NotFoundError` wrapping an infrastructure `Error`) logs all three objects in
order; an error with no cause logs alone and the `<unknown path>` fallback shows; a self-referencing
chain stops instead of looping. The fifth mounts the hook as the `onError` of a `fetchRequestHandler`
over a test router whose procedure throws, and asserts the hook received the thrown error under the
transport wrapper: that is the case that proves the export is wired to tRPC's real signature and not
only to a hand-built argument.

**Checks at this commit.**

| Check                                      | Result                                                                       |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| No monitoring provider added               | `grep -rn "instrumentation" apps/web/src` returns nothing; no new dependency |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (199 web tests, zero warnings)                                          |
| `pnpm lint:agent-rules`                    | 0 errors, 10 `no-raw-tailwind-colors` warnings (#105)                        |
| `pnpm --filter web build`                  | every route listed, `/api/trpc/[trpc]` included                              |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Smoke checklist for the maintainer** (a real database, `pnpm dev`, server output in view):

- [ ] Trigger an expected failure (open a Project that does not belong to the Organization): the
      server output carries one `tRPC query ... failed with NOT_FOUND` line followed by the
      `TRPCError` and the `NotFoundError`, and the screen still shows the precise message.
- [ ] Trigger an unexpected failure (stop Postgres, then load the inbox): the line reads
      `INTERNAL_SERVER_ERROR` and the Prisma error appears as the cause.
- [ ] Submit a form with invalid input: field errors still render inline, and the logged line names
      the mutation with `BAD_REQUEST`.

**Next in the chain.** #98 masks the `INTERNAL_SERVER_ERROR` message in the `errorFormatter`. The
hook above is what keeps that safe, and its second smoke case is the one to re-walk after masking:
the toast becomes the generic sentence, the logged cause must not.

### Every unexpected failure answers with one sentence (issue #98)

Decision 13, second half, and the last link of the chain. The tRPC `errorFormatter` replaces the
message of any `INTERNAL_SERVER_ERROR` with `Something went wrong. Please try again.` Everything
else in the shape is untouched: the code, the HTTP status, `zodError`, and the message of every
other code.

**Why this could only land last.** Masking is safe exactly when no legitimate message still travels
as a 500. #86 to #95 moved every one of them: the Jira errors (#90), the Better Auth translations
(#92, #94), the Organization limit and stop-impersonation rules (#93), the reset email failure
(#95). Had masking landed first, each of those would have read "Something went wrong" until its own
ticket shipped.

**The inventory re-read, as the ticket required.** `grep -rn "throw new Error(" apps/web/src/server`
returns 27 sites today against 28 at `c1b47bd`: `email-and-password.tsx` became a `DomainError`
(#95), the `Jira token refresh failed` throw became the status-carrying error of #89, and
`log-trpc-error.test.ts` added one (a test fixture, as `domain-error-mapping.test.ts` already had).
All 25 production sites were re-read one by one and all 25 are still infrastructure: 6 unset
environment variables (`STRIPE_WEBHOOK_SIGNING_SECRET`, the Jira, Linear and Slack client
credentials, the Linear webhook signing secret), 3 unresolvable callback or webhook URLs, 14
provider calls that failed (`Jira token exchange failed (<status>)`,
`Slack chat.postMessage failed: <error>`, `Linear createIssue did not return an issue.`), one
programming error (`Use checkOrganizationLimit for organizations`) and one unreachable default
branch (`Unsupported storage provider`). No new user-copy site was found, so nothing was converted
in this ticket and decision 2 stands as written.

**What a User sees change.** The Slack and Linear settings queries let their provider's wording
bubble (`list-slack-channels` returns `listPublicChannels` directly, the three Linear pickers call
their client the same way), so a refused token used to reach the channel picker as
`Slack conversations.list failed: invalid_auth` and now reads the generic sentence. That is the
intent: those strings name an API method, not something a User can act on, and the operator keeps
the original in the server output through #97's hook. The failures worth reading kept their copy,
because they are `DomainError`s and never carried the masked code.

**What is not masked.** `shape.data.stack`, which tRPC adds itself when `config.isDev` is true, so it
is absent from a production build and left alone in development where it is the point. The
`errorFormatter` masks a message, not a shape: the client still branches on `error.data.code`, as
`login-form` does since #92.

**Tests.** `domain-error-mapping.test.ts` gained two cases and two throwing procedures, next to the
two that already covered `zodError` and a mapped `DomainError`, so the four claims of the ticket sit
in one file and are asserted through the fetch adapter rather than a server-side caller (the
formatter never runs in a caller). A bare `Error` carrying a connection string comes back as a 500
whose message is the generic sentence and whose code is still `INTERNAL_SERVER_ERROR`; a
`JiraReauthRequiredError` comes back as a 412 with its own copy. The masking case fails without the
change, with the raw message in the diff.

**Checks at this commit.**

| Check                                      | Result                                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| Masking copy                               | `Something went wrong. Please try again.`, asserted literally |
| Bare `Error` under `src/server`            | 27 sites, 25 production, all still infrastructure             |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (201 web tests, zero warnings)                           |
| `pnpm lint:agent-rules`                    | 0 errors, 10 `no-raw-tailwind-colors` warnings (#105)         |
| `pnpm --filter web build`                  | every route listed                                            |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Smoke checklist for the maintainer** (a real database, `pnpm dev`, server output in view):

- [ ] An expected failure keeps its copy: open a Project of another Organization, the screen still
      reads the precise message and no toast says "Something went wrong".
- [ ] A validation failure keeps its field errors: submit a form with an invalid field, the error
      still renders inline under the field and not as a toast.
- [ ] A forced 500 is masked: stop Postgres, then load the inbox. The screen and any toast read
      `Something went wrong. Please try again.`, and the server output still carries the Prisma
      error as the cause of the logged `INTERNAL_SERVER_ERROR` line.
- [ ] A Jira screen with a disconnected Installation still reads its own copy, not the generic
      sentence.

**The chain is closed.** Steps 1 to 6 of the order are done. What remains of step 4 is independent
of it: the boundary files (#99 to #101), the `matchQueryStatus` sweep (#102, #103), the colour fixes
(#105), then the documentation (#106) and the final lock (#107).

### A render error shows a screen, at the root and inside the dashboard (issue #99)

Decision 14, first half, and the start of the boundary track, which runs beside the closed chain.
`src/app/error.tsx` and `src/app/(authenticated)/error.tsx` exist and both render one
`ErrorScreen`, so a render crash no longer shows the framework default.

**The screen.** `_components/error-screen.tsx` is a presentational component at the root, where
domain-agnostic UI belongs: it takes a `title`, a `description` and its actions as children, and
carries no `"use client"` directive and no handler of its own. That is what lets the three server
boundaries of #101 render it as well as the two client boundaries here. Its copy lives in
`_constants/error-screens.ts`: root `_constants/` is the module home for domain-agnostic constants,
so the copy sits in the folder beside `_components/` rather than inside it, and root `_components/`
stays pure UI as `rules/architecture.md` requires. The three remaining boundaries add their own
consts to the same module.

**Two boundaries, one copy.** `ERROR_BOUNDARY_COPY` is `Something went wrong` /
`An unexpected error occurred. Try again, or contact support if the problem persists.` with a
`Try again` button, shared by both files and reused by `global-error.tsx` in #100. No support
address is rendered: `SUPPORT_EMAIL` in `_constants/app.ts` is still `support@domain.com`, and the
sentence points at support without naming a dead mailbox.

**Why two files rather than one.** `error.tsx` at the app root replaces every nested layout under
it, so a crash in the dashboard would otherwise take the sidebar and the header with it and leave a
user with nothing to click but reload. `(authenticated)/error.tsx` sits inside the authenticated
layout's `<main>`, so the shell survives and navigation is still there. The root file carries the
`<main>` landmark itself, for the same reason: no layout is left to provide one.

**`retry`, not `reset`.** Next 16.3.5 passes `error`, `reset` and `retry` to an error component
(`next/dist/client/components/error-boundary.js`), and its own reference makes `retry()` the
default choice: it re-fetches and re-renders the boundary's children, where `reset()` only clears
the error state. The button calls `retry()`.

**Nothing of the error reaches the screen.** Each boundary logs the error object in a `useEffect`
and renders fixed copy. The props type is `{ error: Error; retry: () => void }`: `digest` is not
declared, so the "raw messages in boundaries" check of the final lock finds no occurrence of
`error.message` or `digest` outside a comment in either file. The two logging lines are prefixed
(`Root render error`, `Authenticated render error`) so the server and browser output says which
boundary caught the throw.

**Tests.** None, as the step 4 plan records: the repo's vitest harness is `environment: node` with
no testing-library, and rendering is verified by hand. The build is the automated evidence that the
files compile and ship: the copy appears in a client chunk and in the SSR chunk of the production
build.

**Checks at this commit.**

| Check                                      | Result                                                           |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `error.message` or `digest` in a boundary  | none, one explanatory comment per file aside                     |
| Boundary files present                     | `error.tsx`, `(authenticated)/error.tsx`, `unauthorized.tsx`     |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (201 web tests, zero warnings)                              |
| `pnpm lint:agent-rules`                    | 0 errors, 10 `no-raw-tailwind-colors` warnings (#105, unchanged) |
| `pnpm --filter web build`                  | every route listed, boundary copy in the client and SSR chunks   |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Smoke checklist for the maintainer** (`pnpm dev`, both themes):

- [ ] Force a render crash in a public page component (`throw new Error("boom")` in the body of a
      `(public)` page): the screen reads `Something went wrong` with the sentence above and a
      `Try again` button, and no stack, message or digest is on screen.
- [ ] `Try again` on that screen re-renders the page: remove the throw, click the button, the page
      comes back without a reload.
- [ ] Force the same crash in an authenticated page (for instance the inbox page component): the
      sidebar and the header are still there, the breadcrumb bar is still usable, and a sidebar link
      navigates away from the error.
- [ ] The browser console carries `Root render error` in the first case and
      `Authenticated render error` in the second, with the raw error after it.
- [ ] Both screens are readable in light and dark mode, and the title, the sentence and the button
      stay centred at a narrow viewport.

### A root layout failure renders a full styled document (issue #100)

Decision 14 again, for the one boundary that cannot rely on anything above it. `src/app/global-error.tsx`
replaces the root layout when the layout itself throws, so the file declares everything the layout
would have provided and renders the same `ErrorScreen` as `error.tsx`.

**What the file declares.** Its own `<html>` and `<body>`, `@workspace/ui/globals.css`, the two
`next/font/google` families with the `--font-sans` and `--font-mono` variables the theme reads, and a
`next-themes` `ThemeProvider` configured exactly as the root layout's. Without the font variables
`font-sans` resolves to an empty custom property, and without the provider the `.dark` class never
reaches the document: `globals.css` drives dark mode off that class (`@custom-variant dark`), not off
`prefers-color-scheme`. Reusing the provider rather than hand-rolling a theme script keeps one
implementation of the resolution.

**No `metadata` export.** A boundary is a Client Component, so Next 16.3.5 supports no `metadata` or
`generateMetadata` here. The title comes from a plain React `<title>` element carrying
`ERROR_BOUNDARY_COPY.title`, as `rules/errors.md` prescribes.

**Copy and logging.** `ERROR_BOUNDARY_COPY` from `_constants/error-screens.ts`, unchanged, with the
`Try again` button calling `retry()`. The props type is `{ error: Error; retry: () => void }`, so
`digest` is not even declared, and the raw error is read once, in the `useEffect` that logs
`Global render error`. The "raw messages in boundaries" check of the final lock still finds nothing
outside the explanatory comment.

**Where the screen appears, and where it does not.** A root layout failure is served as Next's
minimal `__next_error__` document with a 500 status; the boundary is a Client Component, so the
screen paints after hydration rather than in the SSR HTML. `curl` therefore shows the framework
shell, and the check below is that the response ships the chunk holding this boundary. The visible
result is a browser check, which is why the smoke checklist asks for one.

**Tests.** None, for the reason recorded under issue #99: the vitest harness is `environment: node`
with no testing-library. The evidence is the build plus the forced-failure run below.

**Checks at this commit.**

| Check                                         | Result                                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `error.message` or `digest` in the boundary   | none, one explanatory comment aside                                              |
| Boundary files present                        | `error.tsx`, `global-error.tsx`, `(authenticated)/error.tsx`, `unauthorized.tsx` |
| `pnpm typecheck`, `pnpm test`, `pnpm lint`    | pass (201 web tests, zero warnings)                                              |
| `pnpm lint:agent-rules`                       | 0 errors, 10 `no-raw-tailwind-colors` warnings (#105, unchanged)                 |
| `pnpm --filter web build`                     | every route listed, `_global-error` prerendered, copy in the client chunk        |
| Forced root layout failure, production server | `/login` answers 500 and the response ships the global boundary chunk            |

The forced failure was run by guarding a `throw` in `RootLayout` behind an environment variable,
building without it and starting the server with it set: an unconditional throw fails static
generation and the build never completes. The guard was removed before the commit. The build was
again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded under issue
#88.

**Smoke checklist for the maintainer** (a production build, both themes):

- [ ] Add `throw new Error("boom")` to the body of `src/app/layout.tsx`, run `pnpm --filter web dev`
      and open any page: after the dev overlay is dismissed, the page reads `Something went wrong`
      with the root boundary's sentence and a `Try again` button, on the product background and in
      the product font.
- [ ] The same page in dark mode stays dark: the document the boundary renders picks up the theme
      chosen in the app, not the browser default.
- [ ] No stack, error message or digest is on screen; the browser console carries
      `Global render error` followed by the raw error.
- [ ] The tab title reads `Something went wrong`.
- [ ] Remove the throw: the app renders normally again, and no other boundary changed.

### The last raw colour sites use the tokens, and the rule locks at error (issue #105)

Decision 16, second half, and the last convention rule to leave the burn-down. The 10 sites the #104
entry listed now use a semantic token, and `no-raw-tailwind-colors` reports at `error` with nothing
to report.

**The 10 classes, one token each.** Six green or emerald classes became `text-success` and four red
ones `text-destructive`, with no `eslint-disable` anywhere:

| File                                                                         | Was                                     | Now                |
| ---------------------------------------------------------------------------- | --------------------------------------- | ------------------ |
| `(authenticated)/account/billing/.../current-plan-card.client.tsx:164`       | `text-green-600`                        | `text-success`     |
| `(authenticated)/account/settings/_features/email/email-form.client.tsx:131` | `text-green-600`, `dark:text-green-400` | `text-success`     |
| `(public)/pricing/_features/pricing-card.tsx:78`                             | `text-green-600`                        | `text-success`     |
| `_domains/subscription/plan-card/plan-card.tsx:86`                           | `text-green-600`                        | `text-success`     |
| `admin/(dashboard)/.../users-overview-card.client.tsx:46`                    | `text-emerald-600`                      | `text-success`     |
| `admin/_features/sidebar/sidebar-user-dropdown.client.tsx:132`               | `text-red-600`                          | `text-destructive` |
| `admin/users/[id]/.../user-organization-select.client.tsx:38`                | `text-red-500`                          | `text-destructive` |
| `admin/users/[id]/.../email-information.client.tsx:40` and `:59`             | `text-red-600` twice                    | `text-destructive` |

**The `dark:` variant goes away rather than moving to a token.** `email-form.client.tsx` lifted its
check icon to `green-400` in dark mode because `green-600` is too dark on a dark surface. A token
carries its own light and dark values, so the pair collapses to one class. `--success` happens to
hold the same `oklch(0.6 0.19 145)` in both blocks of `globals.css` today, so the dark icon is
marginally darker than it was; that is a theme question, not a class question, and it is the same
green every other `text-success` in the app already renders. The smoke checklist below asks for a
look at it.

**Severity.** `no-raw-tailwind-colors` moved from the `agent` (`warn`) constant to
`migratedSeverity` (`error` inside the gate, `off` outside). `agent` had no other user and is gone,
and the comment above `migratedSeverity` now says the ramp is over. The rule stays behind the agent
gate: decision 16 asks for `error` at zero, not for a new always-on rule, and taking it out of the
gate would put it in the pre-commit hook, which is a step 5 call like the rest of `src/server`.

**Tests.** `next-config.test.js` swaps its "keeps it on the burn-down ramp as a warning" case for the
lock: the single config entry carries `error`, the severity resolved for a real `.tsx` under
`apps/web` is `2`, and the same resolver returns `0` outside the agent gate. The neighbour-of-the-
illustrations case additionally asserts both its reports come out at severity `2`, so the lock is
read through ESLint rather than off the config object alone. The `RuleTester` file is untouched.

**Checks at this commit.**

| Check                                      | Result                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| `pnpm lint:agent-rules`                    | **0 problems**, down from 10 warnings and from 88 at step 3  |
| Raw palette classes left outside `(home)`  | none for a hue the table maps                                |
| `eslint-disable` for the rule              | none                                                         |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (201 web tests, 191 eslint-config tests, zero warnings) |
| `pnpm --filter web build`                  | every route listed                                           |

`--max-warnings 0` on `lint:agent-rules` is deliberately not added here: it is the final lock, #107.
The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Smoke checklist for the maintainer** (each screen in light and dark mode):

- [ ] `/pricing`, signed out: every feature check mark is green and legible on both backgrounds.
- [ ] `/account/billing`, current plan card: the same green check marks, matching `/pricing`.
- [ ] Any screen rendering the shared plan card (upgrade dialogs, onboarding): green check marks,
      unchanged layout.
- [ ] `/account/settings`, email field with a verified address: the trailing check icon is green in
      both themes and still readable on the dark surface, where it used to be a lighter green.
- [ ] `/admin`, users overview card: a positive growth figure is green, a negative one red, zero and
      unknown stay muted.
- [ ] `/admin` sidebar, account dropdown: the `Sign out` item reads red and still turns to the
      hover/focus style on the way in.
- [ ] `/admin/users/<id>`: an unverified email shows a red badge beside the address, a verified one
      the unchanged blue badge.
- [ ] `/admin/users/<id>` with the organizations query forced to fail (offline tab): the message is
      red rather than plain text; same for the email block's `Failed to retrieve email`.

### Page not found, access denied and sign in required (issue #101)

Decision 14, last third, and the close of the boundary track. `not-found.tsx`, `forbidden.tsx` and
`unauthorized.tsx` sit at the app root beside the three error boundaries, all six render one
`ErrorScreen`, and the six-file check of the final lock passes.

**The three screens.** Each is a Server Component with no props, as Next 16.3.5 requires for these
conventions, and each reads its copy from `_constants/error-screens.ts`:
`NOT_FOUND_BOUNDARY_COPY` (`Page not found` / `The page you are looking for does not exist or has
been moved.`), `FORBIDDEN_BOUNDARY_COPY` (`Access denied` / `You do not have permission to view this
page.`) and `UNAUTHORIZED_BOUNDARY_COPY` (`Sign in required` / `Sign in to access this page.`, plus
its `Sign in` label). The constants module is unchanged otherwise, so the six boundaries share one
home for every word a user reads about a failure.

**Only the unauthorized screen carries an action.** A `Button asChild` wrapping a `next/link` to
`loginUrl` from `_constants/routes.ts`, the pattern the signup page already uses, so a signed-out
visitor has one click to the recovery path. The table of decision 14 gives an action to `error.tsx`
(`Try again`) and to `unauthorized.tsx` only; not found and access denied stay copy-only rather than
inventing a "Return home" link the decision did not ask for.

**No `<main>` landmark in these three, unlike the error boundaries.** An error boundary replaces
every nested layout below it, so root `error.tsx` has to carry the landmark itself. These three
render _inside_ the nearest layout instead, and two layouts already own a `<main>` (`admin` and
`(authenticated)`), and `notFound()` is called from `admin/users/[id]` today, so a `<main>` here would
nest inside theirs. They return the `ErrorScreen` directly, which is already a full-width flex
column. The one case left without a landmark is an unmatched URL under the root layout, which the
framework default did not provide either.

**`unauthorized.tsx` replaced, not extended.** The old file was the Next example markup (`401 -
Unauthorized` / `You are not authorized to access this page.`), the last framework-flavoured copy in
the app. `forbidden()` and `unauthorized()` are still never called (`authInterrupts` has been on
since before step 4); these two files are the destinations step 5 needs before it can start calling
them.

**Checks at this commit.**

| Check                                                       | Result                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Missing boundaries (`ls` of the six files)                  | six files listed                                                                |
| Raw messages in boundaries (`grep "error.message\|digest"`) | three hits, all the `digest` comment in the three error boundaries; no render   |
| `pnpm typecheck`, `pnpm test`, `pnpm lint`                  | pass (201 web tests, zero warnings)                                             |
| `pnpm lint:agent-rules`                                     | **0 problems**, unchanged since #105                                            |
| `pnpm --filter web build`                                   | every route listed, `/_not-found` prerendered                                   |
| Copy in the build output                                    | the three titles and bodies and the `/login` href are in `_not-found.html/.rsc` |

The two boundary checks of the final lock therefore both pass now: #100 had already landed the
global boundary, so the six-file list was complete the moment these three files existed. The build
was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded under
issue #88.

**Tests.** None, for the reason recorded under #99: the vitest harness is `environment: node` with
no testing-library, so these are verified by the build output above and by the smoke checklist. The
copy constants are not worth a test of their own.

**Smoke checklist for the maintainer** (each screen in light and dark mode):

- [ ] An unknown URL while signed out (`/does-not-exist`): `Page not found` with the product's
      fonts and colours, not the framework default, and the response is a 404.
- [ ] The same URL while signed in: same screen; the public layout, not the dashboard shell.
- [ ] An unknown URL under the dashboard (`/inbox/does-not-exist`) and under admin
      (`/admin/users/<unknown-id>`): the screen renders inside the shell, the sidebar and the header
      are still there, and there is exactly one `<main>` in the document.
- [ ] Temporarily call `unauthorized()` from a page: `Sign in required`, and the `Sign in` button
      lands on `/login`.
- [ ] Temporarily call `forbidden()` from a page: `Access denied`, no action button.
- [ ] Keyboard only: on the unauthorized screen the `Sign in` button takes focus and shows its focus
      ring in both themes.
- [ ] No regression on the error boundaries of #99 and #100: throwing from a dashboard page still
      shows `Something went wrong` with a working `Try again`.

### The Project scope queries render their failure (issue #102)

Decision 15, first half. Of the 14 querying files that had no `matchQueryStatus`, seven sit in the
Project scope and all seven are in Project settings: the inbox and the reviewers tab already matched
every query they own. Five of the seven now render an error state, two are left as they are, and two
sibling files that already used `matchQueryStatus` gained the branch their picker list was missing.

**The five conversions.**

| File                                               | Query                        | What a failure showed before                          | What it shows now                                          |
| -------------------------------------------------- | ---------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `update/update-project-form.client.tsx`            | `projects.get`               | Empty name and domain fields, `...` as the Project ID | `Failed to load the project` with the message              |
| `api-key-migration-notice.client.tsx`              | `projects.get`               | A copyable snippet carrying `proj_...`                | `Failed to load the migration snippet` with the message    |
| `github/github-section.client.tsx`                 | `getInstallation`, `getLink` | "Connect GitHub in organization settings", wrongly    | The failure of the installation or of the link, separately |
| `jira/link-project/jira-project-picker.client.tsx` | `jira.listIssueTypes`        | An issue type select with no option                   | `Failed to load the issue types` with the message          |
| `linear/link-team/team-picker.client.tsx`          | `linear.listTeamStates`      | A default state select with no option                 | `Failed to load the team states` with the message          |

**The two siblings.** `jira-section.client.tsx` and `linear-section.client.tsx` already matched their
installation and link queries but passed `jiraProjectsQuery.data ?? []` and `teamsQuery.data ?? []`
into their picker, so a failed list read rendered "No Jira projects available" or "No teams
available": an empty state standing in for an error. Both now nest a `matchQueryStatus` around the
picker, the way `slack-section.client.tsx` already did for its channels. The same nesting is what
`github-section.client.tsx` gained for `listRepos`. That is decision 15's "a picker is never silently
empty", and it is the reason two files outside the seven were touched.

**The two left as they are.**

- `delete/delete-project-button.client.tsx` reads `projects.get` for the Project name that the
  confirmation input must match. It is a value read only to enable a control, the case decision 15
  names: on a failure the name is empty, the string can never match, and the `Delete` action stays
  disabled, which is the safe outcome. The card around it still renders its warning, and the same
  query's failure is already on screen at the top of the page through the Project information card.
- `regenerate-api-key/regenerate-api-key-section.client.tsx` reads `projects.get` for the last four
  characters of the API key. No file imports this component: the API key surface was replaced by the
  Project ID and the section is not mounted anywhere, so the failure has no viewer. Converting it
  would be writing UI for a screen that does not exist.

**One helper for the message.** `matchQueryStatus` hands its `Errored` branch an `unknown`, so every
converted site needed the same narrowing to read a message. `src/utils/error/get-error-message.ts`
does it once: an `Error` with a non-blank message yields that message, anything else yields
`Something went wrong. Please try again.`, the same sentence the `errorFormatter` of #98 puts on an
unexpected failure. It is covered by three unit tests. The masking of #98 is what makes rendering
the message safe: a `DomainError` arrives as final copy, and anything unexpected has already been
replaced by that sentence server-side.

**`Alert`, not `Empty`.** `rules/frontend.md` asks for an `<Empty>` in the `Errored` branch. Every
section of this folder renders `<Alert variant="destructive">` instead, from before step 4, so the
conversions follow the folder rather than the rule file: a settings card whose failures look like
two different products is worse than a rule file that describes the rest of the app. The pickers'
inner fields use a `text-muted-foreground` line for their `Empty`, matching the fields around them.

**Two `Empty` branches that never render.** `projects.get` throws `NotFoundError` when the Project is
missing, so its query never resolves to nothing. The two files that read it still declare an `Empty`
branch, because the overload of `matchQueryStatus` that narrows `data` to a non-nullable type is the
one that takes it, and a comment on each says so.

**Checks at this commit.**

| Check                                               | Result                                   |
| --------------------------------------------------- | ---------------------------------------- |
| Project scope querying files without a status match | two, both listed above with their reason |
| Queries outside the Project scope touched           | none                                     |
| `pnpm typecheck`, `pnpm test`, `pnpm lint`          | pass (204 web tests, zero warnings)      |
| `pnpm lint:agent-rules`                             | **0 problems**, unchanged since #105     |
| `pnpm --filter web build`                           | every route listed                       |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Tests.** Only `get-error-message.test.ts`. The rendering is verified by hand: the vitest harness is
`environment: node` with no testing-library, as recorded under #99.

**Smoke checklist for the maintainer** (`pnpm dev`, a real database, the Project settings page).
Force a failure per region by throwing at the top of the matching `_services/` function, or by
blocking `/api/trpc` in the browser devtools:

- [ ] `getProject` throwing: the Project information card reads `Failed to load the project` with the
      thrown message, and the API key card reads `Failed to load the migration snippet`. No field is
      empty, and no snippet showing `proj_...` can be copied.
- [ ] The same failure leaves the Danger zone card usable: the warning and the `Delete project`
      button are there, and the confirmation input cannot enable `Delete`.
- [ ] `listAccessibleRepos` throwing with GitHub connected and no repository linked: the GitHub card
      reads `Failed to load your repositories`, not an empty repository select.
- [ ] `getInstallation` for GitHub throwing: the GitHub card reads
      `Failed to load the GitHub integration`, not "Connect GitHub in organization settings".
- [ ] GitHub connected and loading: the card shows a skeleton before the "Connect GitHub" wording,
      which used to flash on every load.
- [ ] `listAccessibleJiraProjects` throwing: the Jira card reads `Failed to load your Jira projects`.
      With it healthy, pick a Jira project and make `listJiraIssueTypesForProject` throw: the issue
      type region reads `Failed to load the issue types` and the form cannot be submitted.
- [ ] `listAccessibleLinearTeams` and `listLinearTeamStates` the same way, on the Linear card.
- [ ] Nothing regressed on the happy path: update the Project name and domain, toggle the widget
      switch, link and unlink a GitHub repository, a Jira project and a Linear team.
- [ ] The Jira issue type still defaults to `Bug` when the chosen Jira project has one.
- [ ] No regression in the inbox or the reviewers tab, which this ticket did not touch.

### The queries outside the Project scope render their failure (issue #103)

Decision 15, second half. The other seven of the 14 querying files without `matchQueryStatus` sit
outside the Project scope: two in account settings, two in the Organization scope, two in admin and
one in the active Project provider. Six now render an error state, one keeps the error state it
already had with a real message, and two shell files that consume the provider gained the branch
their list was missing.

**The six conversions.**

| File                                                         | Query                    | What a failure showed before                                     | What it shows now                                                    |
| ------------------------------------------------------------ | ------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| `account/settings/_features/email/email-form.client.tsx`     | `account.email.get`      | An empty email field and a submit button ready to send it        | `Failed to load your email address` with the message                 |
| `account/settings/_features/profile/profile-form.client.tsx` | `account.profile.get`    | Empty first and last name fields, ready to be saved as blanks    | `Failed to load your profile` with the message                       |
| `organization/_features/general/delete-organization-section` | `organization.get`       | The irreversible-deletion warning and an enabled `Delete` button | `Failed to load the organization` with the message, and no button    |
| `organization/_features/members/organization-members-tab`    | `invitation.list`        | The member rows alone: pending invitations silently disappeared  | A row reading `Failed to load the pending invitations` plus the copy |
| `admin/users/[id]/_features/subscription/subscription-card`  | `users.subscription.get` | `Not subscribed` and an offer to create a Subscription           | `Failed to load the subscription` with the message                   |
| `_domains/project/active-project/active-project-provider`    | `projects.list`          | `No projects yet` in the sidebar and an empty switcher list      | The failure, in both places (see below)                              |

The two riskiest of those are behaviour changes worth naming. A failed `organization.get` no longer
offers a `Delete organization` button at all: the button used to appear enabled because `isDefault`
fell back to `false`, so a failed read pointed the destructive path at a default Organization. And a
failed `users.subscription.get` no longer reads `Not subscribed`, which invited an admin to create a
second Subscription for a User who may already have one.

**The provider, and the two shell files.** `ActiveProjectProvider` wraps the whole authenticated
shell and must render its children whatever the query does, so it cannot itself return an error
state. It now publishes the read as `projectsQuery`, a four-field `ProjectsQueryState` shaped like
what `matchQueryStatus` consumes, next to the `projects`, `activeProject` and `isPending` values it
already published. Its `isLoading` follows the query's `isPending` rather than react-query's
`isLoading`, because the read is disabled until the active Organization is known and an idle read
must count as loading, not as empty.

Two consumers outside the Project scope match on it:

- `sidebar/project/project-navigation.client.tsx` rendered `NoProjectsCard` ("No projects yet.
  Create your first project.") whenever the list was not a non-empty array, so a failed read told a
  User with Projects that they had none. `Empty` keeps that card, `Errored` states the failure with
  its message, and `Loading` now renders skeleton rows where the component used to render `null`.
- `header/header-project-switcher.client.tsx` rendered its dropdown with no Project item and no
  explanation. `Errored` names the failure inside the dropdown, so the `Create project` item stays
  reachable. Its `Loading` branch is unreachable while the component keeps its own `isPending`
  early return for the trigger; a comment says so.

The four Project scope consumers of the provider (`inbox-content`, `inbox-tabs`, `reviewers-page`,
`settings-page`) were deliberately left untouched: the ticket forbids touching the scope, and they
read `activeProject` and `isPending`, which did not change.

**The one left with its own error state.** `admin/users/_features/users-table/users-table.client.tsx`
already passed `isError` to `DataTable`, which renders an error row inside the table while keeping
the search field and the pagination. Replacing that with `matchQueryStatus` would have removed the
search field on a failure, so the table keeps its own branch and only its copy changed: the fixed
`"An error occurred"` became `getErrorMessage(error)`, the same sentence every converted site shows.

**The queries left as they are, with their reason.**

- `admin.users.listForExport` in the same file feeds the CSV export button. Its failure exports an
  empty file rather than filling a region, and the list read beside it already reports a failure of
  the same router.
- The two Project scope files recorded under #102 (`delete-project-button`,
  `regenerate-api-key-section`) are unchanged, as is every other Project scope query.

**Conventions followed.** `Alert variant="destructive"` in account settings and in the Organization
general tab, where every neighbouring card already uses it; a destructive table row in the members
table; the `Card` shell in the admin subscription card; and the sidebar's dashed-border card shape
for the sidebar failure. As under #102, this follows the folder rather than `rules/frontend.md`'s
`<Empty>`, which no file in these folders uses. Each `Errored` branch reads its message through
`getErrorMessage`, the helper added by #102.

**Two forms split.** The email and profile forms fetched their values and then pushed them into
`react-hook-form` from a `useEffect`, which `rules/frontend.md` forbids. Both are now a fetching
wrapper plus a fields component taking the loaded values as props and passing them to `values`, the
shape `update-project-form.client.tsx` took under #102. The effects are gone.

**Checks at this commit.**

| Check                                            | Result                                    |
| ------------------------------------------------ | ----------------------------------------- |
| Querying files without a status match, whole app | three, all listed above with their reason |
| Queries inside the Project scope touched         | none                                      |
| `pnpm typecheck`, `pnpm test`, `pnpm lint`       | pass (204 web tests, zero warnings)       |
| `pnpm lint:agent-rules`                          | **0 problems**, unchanged since #105      |
| `pnpm --filter web build`                        | every route listed                        |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Tests.** None added. The rendering is verified by hand: the vitest harness is `environment: node`
with no testing-library, as recorded under #99. `getErrorMessage` keeps its three unit tests.

**Smoke checklist for the maintainer** (`pnpm dev`, a real database). Force a failure per region by
throwing at the top of the matching `_services/` function, or by blocking `/api/trpc` in the browser
devtools:

- [ ] `getCurrentEmail` throwing, on `/account/settings`: the email card reads `Failed to load your
email address` with the message. No empty email field and no `Change email` button are shown.
- [ ] `getProfile` throwing: the profile card reads `Failed to load your profile`, and no blank name
      can be saved over the stored one.
- [ ] `getOrganizationDetails` throwing, on `/organization`: the general tab reads `Failed to load
the organization` and offers no `Delete organization` button.
- [ ] `listInvitations` throwing, as an owner or an admin on the members tab: a row reads `Failed to
load the pending invitations` and the member rows are still listed above it.
- [ ] As a plain member, the same tab lists the members with no invitation row, no skeleton and no
      error: the read is not run for a member who cannot manage invitations.
- [ ] `getSubscription` throwing, on `/admin/users/<id>`: the subscription card reads `Failed to
load the subscription` and offers neither `Create` nor `Edit`.
- [ ] A User with no Subscription still sees `Not subscribed`, `No active subscription` and the
      create dialog; a User with one still sees the plan, the status badge and the edit dialog.
- [ ] `listUsers` throwing, on `/admin/users`: the table body shows the thrown message instead of
      `An error occurred`, and the search field and pagination are still usable.
- [ ] `listProjects` throwing: the sidebar reads `Failed to load your projects` with the message
      instead of `No projects yet`, and the header switcher says the same inside its dropdown, where
      `Create project` still works.
- [ ] An Organization with no Project still shows `No projects yet` in the sidebar and a switcher
      with only `Create project`.
- [ ] On a slow connection, the sidebar shows skeleton rows while the Project list loads, where it
      used to show nothing, and no `No projects yet` card flashes before the list arrives.
- [ ] Nothing regressed on the happy path: change the email address, update the profile, invite and
      revoke a member, switch Projects from the header, and create, edit and delete a Subscription
      from the admin user page.
- [ ] No regression inside the Project scope, which this ticket did not touch.

### ADR 0012 and the two rule files describe what is live (issue #106)

Written after the chain closed, so every sentence added was checked against the code at this commit
rather than against the plan.

**ADR 0012.** The "Added by step 4" status note is gone. `## Status in this repo` now reads as three
lists: what step 3 made live, what step 4 made live (the HTTP mapping helper and its two agent API
callers, the six boundary files, the three wrapped Inngest functions, the masking sentence with
`logTRPCError` as the handler's `onError`, `services-no-bare-error` at `error` for `**/_services/**`,
the three re-parented Jira classes) and what was deliberately not built (`interruptOnDomainError`,
the server actions branch). A new `### Amendments` subsection states the three amendments, and each
is repeated inline on the decision it changes, so a reader of the decision list is never left with
the pre-step-4 wording:

| Amendment                                                              | Decision it annotates                                                                        |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A second-level subclass is allowed when a caller must tell cases apart | "Services throw `DomainError` subclasses", whose "no per-case subclasses" clause is replaced |
| RSC interrupts are deferred to their first caller                      | "React Server Components: Next.js interrupts"                                                |
| The agent API keeps its transport codes at its boundary                | "Route handlers: a `DomainError` to `Response` helper"                                       |

Four further statements were corrected because step 4 made them false, none of them an amendment to
the model: "The set is closed at five" became "The set of codes is closed at five", since the codes
are closed and the classes are not; legacy absorption now says an infrastructure class stays a plain
`Error` (`JiraRequestError`, `EmailError`), which is why nothing was deprecated; the boundary
hierarchy lists a per-shell `error.tsx` alongside the five root files; and the legacy-import ban and
the `services-no-bare-error` glob are marked with what actually landed. `Consequences` drops "three
lint rules" for the two that exist.

**`rules/backend.md`.** One bullet in "Transport-agnostic services", after the `DomainError` bullet
it depends on: an Inngest function body calling code able to throw a `DomainError` routes the
failure through `rethrowDomainErrorsAsNonRetriable`, infrastructure failures keep their retries, and
wrapping a function that reaches no throwing service is dead code posing as a guarantee. The snippet
is the live call from `create-jira-issue.ts`, not an invented one.

**`rules/errors.md`.** The "What exists today" blockquote no longer describes step 4 as pending: it
names the three modules that exist and the one that does not, with the reason. The masking sentence
is quoted verbatim, the second-level subclass allowance gets a paragraph naming the three Jira
classes and the code they transport, the mutation-toast bullet drops its "carries the raw message
until then" tail, the boundary bullet names `ErrorScreen`, the `_constants/error-screens` module and
the six files, and a new bullet states the route handler convention (map with `domainErrorResponse`,
rethrow on `null`, transport codes stay at the boundary).

**`CONTEXT.md`.** Unchanged, as decision 7 expected: **Reconnect required** carries the refusal rule
and **Tracker** already covers Jira.

**Verified before writing, at this commit.**

| Statement                                            | How it was checked                                                                                                   |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Three modules in `src/server/errors/`, no interrupts | `ls src/server/errors/`: `domain-errors`, `http-response`, `non-retriable`, plus two test files                      |
| Two agent API route handlers map domain errors       | `domainErrorResponse` in `feedbacks/route.ts` and `feedbacks/[id]/status/route.ts` only                              |
| Three wrapped Inngest functions                      | `rethrowDomainErrorsAsNonRetriable` in `create-jira-issue`, `sync-feedback-status-to-jira`, `sync-jira-issue-status` |
| Three Jira classes extend `PreconditionFailedError`  | `src/server/jira/errors.ts`; `JiraRequestError` still `extends Error` in `jira-rest-client.ts`                       |
| Six boundary files, one screen, one copy module      | All six import `ErrorScreen` and a constant from `@/app/_constants/error-screens`                                    |
| Masking sentence and `onError`                       | `UNEXPECTED_FAILURE_MESSAGE` in `server/trpc/trpc.ts`; `onError: logTRPCError` in the tRPC route                     |
| `services-no-bare-error` outside the agent gate      | `packages/eslint-config/next.js`, `**/_services/**` block                                                            |
| `handleTRPCError` retired                            | `src/lib/trpc/_deprecated_handle-trpc-error.ts`                                                                      |

**Checks at this commit.**

| Check                                      | Result                               |
| ------------------------------------------ | ------------------------------------ |
| `pnpm typecheck`, `pnpm test`, `pnpm lint` | pass (204 web tests, zero warnings)  |
| `pnpm lint:agent-rules`                    | **0 problems**, unchanged since #105 |
| `pnpm --filter web build`                  | every route listed                   |

The build was again run with a placeholder `GITHUB_PRIVATE_KEY`, for the environment reason recorded
under issue #88.

**Tests.** None: documentation only. No source file was touched.

**Left for #107.** The coding-standards skill's own status block still reads "Step 4 has not
started" in `SKILL.md`. That line is the final lock's to flip, so it was left alone rather than
edited twice.

**Smoke checklist for the maintainer.** Reading only, no runtime behaviour changed:

- [ ] ADR 0012's status section matches `ls apps/web/src/server/errors/` and the six boundary files.
- [ ] The three amendments read as decisions, and each is findable from the decision it changes.
- [ ] `rules/backend.md`'s Inngest snippet is the call that is in `create-jira-issue.ts`.
- [ ] `rules/errors.md` quotes the masking sentence that `server/trpc/trpc.ts` sends.

## Amendments to the kit made during step 1

The kit is the source project's playbook. Where this repo diverged, `docs/architecture/migration-kit/01-tooling.md` was amended to match reality:

1. **`lint:agent-rules` drops `--max-warnings 0` for the duration of the migration.** The kit's script fails on any warning, which would make the command red from the first day of the migration to the last. A command that is always red is never read. Errors fail it, warnings are the metric, and `--max-warnings 0` returns at the end of step 4. `lint` keeps `--max-warnings 0`.
2. **Transition globs.** `no-default-export` runs on `_features/**` as well as `_domains/**`, and `require-use-client-suffix` runs on all of `src/**` rather than `_domains/**`. The first keeps the rule reporting while the target folder does not exist; the second matches the `.client.tsx` naming the repo already uses outside `_domains/`. Both are marked in the config with the step that removes them. The widened `require-use-client-suffix` scope is recorded in the target architecture document by issue #35.
3. **Test harness.** The kit prescribes jsdom, `@testing-library/jest-dom` and a `vitest.config.mts`. This repo keeps `vitest.config.ts` with `environment: node`, no testing-library, and aliases resolved by Vite's native tsconfig path resolution, because the testing policy covers pure helpers and dependency-injected services only. `TZ` is pinned to `UTC`. jsdom is added the day a component test exists.
4. **Rule inventory.** `no-deprecated-error-imports` is not registered: it is about modules the source project retired and this repo never had. `no-raw-tailwind-colors` is kept with its existing allow and ignore patterns.
5. **lint-staged runs plain ESLint, not the gated set.** A hotfix in a scope that has not been migrated would otherwise have to migrate the whole file before it could be committed.

## Amendments to the kit made during step 2

1. **`no-cross-domain-deep-import` hardened before the first domain moved.** The kit's rule only looked at `ImportDeclaration` nodes carrying the `@/app/_domains/<x>/<deep>` alias, so two bypasses were legal: a relative specifier escaping into another domain (`../organization/_utils/x`), and a re-export (`export { x } from`, `export * from`) of another domain's internals. The rule now resolves a relative specifier against the importing file and reports it when it lands in another domain at any depth, the barrel included, since a barrel must be addressed by its alias; `ExportNamedDeclaration` and `ExportAllDeclaration` with a source are checked like imports. Same-domain imports stay valid through the alias or a relative path, and importers outside `_domains/` stay exempt. The amended rule and its test file are mirrored into `docs/architecture/migration-kit/local-rules/` so the next project adopting the kit does not inherit the hole.

2. **`search-params.ts` is a known non-component inside `_components/`.** The period selector's nuqs parsers (`periodSelectorParsers`, built with `createSearchParamsCache` from `nuqs/server`) moved with the selector into `app/_components/dashboard/`. It is not UI, but it is the selector's URL contract and its only other consumer is the admin subscriptions chart, so splitting it off would leave a one-symbol module with no better home. The target architecture has no bucket for a route-agnostic search-params module; step 3 decides whether one is needed.

3. **The two `faq` files were renamed when the MDX library was flattened.** `mdx/faq.tsx` and `mdx/ui/faq.tsx` both exported a component called `FAQ` and collided once `ui/` was lifted into `app/_components/mdx/`. They render different things, so each was renamed after what it renders: `faq-list.tsx` (`FaqList`, an always-expanded `<dl>` of questions and answers that also emits the `FAQPage` JSON-LD) and `faq-accordion.tsx` (`FaqAccordion`, a collapsible accordion taking `ReactNode` answers). The MDX registry key stays `FAQ`, so authored `.mdx` content is untouched. This is the only non-client-suffix rename of step 2. Recorded here because the kit forbids renames during the move.

4. **The public layout chrome was placed at the route tier, not in root `_components/`.** The header, its mobile navigation, the footer, the launch banner and the "manage consent" button render only inside the `(public)` route group, and the footer imports the marketing GitHub stars button, so keeping them at the app root would have left a root component importing from a route. They moved flat into `(public)/_components/`, and the group layout addresses them relatively. Root `_components/` keeps only chrome-free primitives.

5. **Agnostic files moved to their final home were renamed with the `.client.tsx` suffix.** Every file carrying a `'use client'` directive that landed in `app/_components/`, `app/_providers/` or `(public)/_components/` took the suffix during its `git mv`: the theme toggle, the three data table files, the upload button, the dashboard breadcrumbs and period selector, the consent provider and the manage-consent button. The kit forbids renames during a move, but the suffix is the target convention for the destination folder and renaming later would move the same files twice. `require-use-client-suffix` is down from 14 warnings at the baseline to 3. Files moved inside a domain or into `(public)/_features/github-stars/` are not renamed: they are reshaped in step 3.

6. **The domain barrels are empty.** Every `_domains/<domain>/index.ts` created in step 2 is `export {}` with a one-line comment. The kit expects the barrel to export what other domains currently import, found by fixing `no-cross-domain-deep-import` errors one by one. Here that discovery returns nothing: once the four non-domains (`core`, `mdx`, `seo`, `c15t`) and the marketing GitHub stars feature were moved out of root `_features/`, no file under `_domains/` imported another domain at all. The only importers left are routes, `app/api/` and `src/server/`, and the rule exempts them by design. Inventing exports to fill the barrels would be guessing at a surface no caller asked for, so each barrel stays empty and grows on the first real cross-domain import. The file exists anyway, because "every domain has an `index.ts`" is the check that makes the public surface findable.

7. **`feedback-status.ts` moved out of `src/types/` into the `feedback` domain.** The Feedback lifecycle vocabulary (`FeedbackStatusEnum`, `FeedbackStatus`) sat in a generic `src/types/` folder with ten importers across the admin dashboard, the agent API and five `src/server/` integration modules. It is the Status glossary term of the Feedback entity, so it now lives at the root of `_domains/feedback/` next to the markdown formatter. Which bucket it ends up in is a step 3 decision. `src/types/` keeps only `next.ts`.

8. **No dead-code file survived into a destination folder.** The spec lists eleven files under root `_features/` with no importer, six of them in `subscription`, and instructs the agent to move any survivor as-is rather than delete it. The maintainer removed all eleven in commit `d3449a2` before the first folder moved, so the survivor rule never fired: nothing was carried into `_domains/` or into an agnostic destination only to sit there unreferenced. Recorded here because the rule was part of the plan and its outcome is otherwise invisible.

9. **The `_components/` flatten pass was a no-op.** The kit's step 2 prescribes a separate commit per scope that flattens an existing `_components/` folder into the flat destination, and warns that it rewrites imports across the repo. No `_components/` folder existed anywhere under `src/app/` at the start of step 2: the tree held `(auth)`, `(authenticated)`, `(public)`, `_constants`, `_features`, `admin`, `api`, `llms.txt` and `onboarding`, and the shared UI lived in `_features/core/`. Root `app/_components/` and `(public)/_components/` were therefore created by step 2, not flattened by it, and the three sub-libraries (`dashboard/`, `mdx/`, `seo/`) were flattened on the way in rather than in a pass of their own. Recorded because a skipped step of the kit is otherwise indistinguishable from a forgotten one.

## Deferred to step 3

Step 2 moved domain-bound code out of `src/app/_features/`. It did not touch `src/server/`, because step 3 turns that code into `_services/` inside the scopes that own it and moving it now would move it twice. "All domain-bound code lives under `_domains/`" is therefore not true yet, and this is what is left.

### `src/server/**` folders holding domain logic

| Folder                              | Holds                                                                                 | Presumed domain                         |
| ----------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------- |
| `server/github`                     | GitHub App client, webhook signature check, issue body formatting                     | Tracker (see the open question below)   |
| `server/linear`                     | Linear client, OAuth state cookie, token crypto, team/state resolution                | Tracker                                 |
| `server/jira`                       | Jira clients, ADF formatting, transition resolution, webhook registration             | Tracker                                 |
| `server/slack`                      | Slack client, block building, dashboard and screenshot URLs, token crypto             | Notification channel                    |
| `server/oauth`                      | The shared OAuth state cookie                                                         | Installation, shared by the trackers    |
| `server/auth/subscription`          | Feature access, organization and resource limits, plan resolution, denial             | `subscription`                          |
| `server/auth/plugins/organization`  | The Better Auth organization plugin and its roles                                     | `organization`                          |
| `server/api`                        | Project resolution, allowed-origin validation, agent scope and token, reviewer        | `project`, with an agent-surface slice  |
| `server/storage`                    | Asset records, signed URLs, S3/R2 URL resolution                                      | Undecided: Asset is not a glossary term |
| `server/stripe`                     | The Stripe client                                                                     | `subscription`                          |
| `server/inngest` (domain-bound fns) | The issue-mirroring, status-sync, webhook-refresh, welcome-mail and segment functions | Tracker, Notification channel, `user`   |

`server/inngest/index.ts` (the client) and `server/trpc/**` (the tRPC setup and the root router) are infrastructure and stay. `server/auth/config` is Better Auth wiring with one domain leak, listed below.

### Open question: one domain per external system, or one `tracker` domain

`CONTEXT.md` defines **Tracker** as "an external issue-tracking system Faster Fixes can mirror Feedback into", with GitHub Issues, Linear and Jira as instances, and **Notification channel** as the one-way announce category whose first instance is Slack. **Installation** is the org-level connection to either. Domain folder names come from the glossary, so both readings are legal:

- one domain per external system (`github`, `linear`, `jira`, `slack`), which matches the code as written, where each folder has its own client, its own token crypto and its own webhook verification, but puts no folder behind the glossary terms;
- one `tracker` domain holding the three mirroring systems plus a `notification-channel` domain for Slack, which matches the glossary and the Installation and Issue link entities, but forces a per-provider sub-structure inside it.

Decide before any of this code moves, because the answer also decides where Installation, Project link and Issue link live. The `github` folder name is free: the marketing GitHub stars feature was moved to `(public)/_features/github-stars/` and its tRPC router key renamed to `githubStars` in step 2.

### `src/server/` imports of domain internals

These are inverted dependencies: infrastructure reaching into a domain. They resolve on their own when the importing file joins its domain in step 3. Until then they are legal, because `no-cross-domain-deep-import` only constrains importers that live inside `_domains/`.

| Importer                               | Imports                      | From                                                |
| -------------------------------------- | ---------------------------- | --------------------------------------------------- |
| `server/auth/config/database-hooks.ts` | `generateUniqueSlug`         | `_domains/organization/_utils/generate-unique-slug` |
| `server/auth/plugins/organization.tsx` | `ORGANIZATION_ROLES`         | `_domains/organization/_utils/organization-roles`   |
| `server/api/validate-origin.ts`        | `normalizeDomain`            | `_domains/project/normalize-domain`                 |
| `server/github/format-issue-body.ts`   | `formatDiagnosticTrailLines` | `_domains/feedback/format-feedback-markdown`        |

Step 2 added eight more, all on the same module, by moving `feedback-status.ts` out of `src/types/` and into the `feedback` domain (amendment 7). They were not inverted dependencies before the move, only imports of a generic types folder, and they are listed here so step 3 sees the real count:

`FeedbackStatus` / `FeedbackStatusEnum` from `_domains/feedback/feedback-status` is imported by `server/inngest/create-linear-issue.ts`, `server/inngest/sync-feedback-status-to-jira.ts`, `server/inngest/sync-feedback-status-to-linear.ts`, `server/inngest/update-slack-feedback-message.ts`, `server/jira/resolve-transition.ts`, `server/linear/resolve-team-state.ts`, `server/linear/state-mapping.ts` and `server/slack/build-feedback-blocks.ts`.

Twelve inverted imports in total. The three remaining `src/server/` references to `_domains/` are the root tRPC router (`server/trpc/routers/_app.ts`) mounting the `auth`, `organization` and `subscription` domain routers by deep import. Those are by design: the composition layer assembles the API surface and the barrels never export a router.

## Anomalies recorded, not fixed

Found while moving the folders. None is caused by the move and none is fixed here, because step 2 changes placement and import paths only. They are written down so they are not rediscovered.

1. **A client hook imports a `@/server/` config module.** `_domains/subscription/use-plan-gate.ts` is `'use client'` and imports `FeatureGate`, `PLAN_LIMITS`, `PlanLimits` and `SubscriptionPlanName` from `@/server/auth/config/subscription-plans`. It works because the module is a plain constants file with no server-only import, but the boundary is wrong: plan limits are the Plan vocabulary of the `subscription` domain, not Better Auth configuration. Resolves when `server/auth/subscription` moves into the domain in step 3.

2. **A client chart component imports a `nuqs/server` parsers module.** `admin/(dashboard)/_features/subscriptions-chart/subscriptions-chart.client.tsx` imports `periodSelectorParsers` from `@/app/_components/dashboard/search-params`, which builds its cache with `createSearchParamsCache` from `nuqs/server`. Same shape as the anomaly above: it survives bundling, but a client file should not reach a `/server` entrypoint. Related to amendment 2, which records why the module stayed in `_components/`.

3. **`getUserActiveSubscription` is named after a User.** `_domains/subscription/get-user-active-subscription.ts` reads the active Subscription, but `CONTEXT.md` attaches a Subscription to an Organization, not to a User. Its single caller is the account billing page. The name should follow the glossary once step 3 turns it into a service.

4. **`_constants/app.ts` holds a French user-facing string and placeholder emails.** `ANONYMOUS_USER_NAME` is `"Utilisateur anonyme"`, which breaks the English-only rule for UI copy, and `SUPPORT_EMAIL` and `CONTACT_EMAIL` are both `@domain.com` placeholders. Not a placement problem, so out of scope for the migration entirely; it needs its own ticket.

5. **The Jira reconnect mail template is the one domain-bound file in `src/lib/`.** `src/lib/mailer/templates/jira-reconnect-required.tsx` knows that a Jira Installation can lose its token and what the user must do about it, while every other template in that folder is generic plumbing. It belongs with the Jira code, wherever the open question above lands it.

## Prerequisites for step 3

Step 3 turns every scope's data and IO code into verb-prefixed functions in `_services/`, dissolves `_utils/`, and makes the routers thin. Before the first procedure is extracted:

1. ~~**Create the domain-error vocabulary and the tRPC mapping middleware first.**~~ Done in `f2c8d60`. `src/server/errors/domain-errors.ts` (five subclasses, zero imports) and the `domainErrorMiddleware` on the base procedure in `src/server/trpc/trpc.ts`. Extracting a procedure that throws `TRPCError({ code: "CONFLICT" })` into a service that throws a bare `Error` silently turns a 409 into a 500. Creating that folder is also what enabled `no-client-import-of-server-errors`. The vocabulary came from `docs/architecture/target-architecture.md` and ADR-0012, not from the kit, which ships no runtime file for it; `03-services.md` was corrected to say so.
2. **Answer the open question on the integration domains** recorded above. Carried forward to step 5 by the close-out: step 3 never moved a file out of `src/server/`. It decides the home of `server/github`, `server/linear`, `server/jira`, `server/slack`, `server/oauth`, the domain-bound Inngest functions and the Jira mail template, which together are most of what step 3 has to move.
3. **Decide the domain of `server/storage`.** Carried forward to step 5 for the same reason. Asset is not a glossary term. Either add it to `CONTEXT.md` with the `domain-modeling` skill, or place the folder under the domain that owns the files it stores.
4. ~~**Add the per-scope allowlist to the ESLint config.**~~ Done, see the `migratedScopes` section below.
5. ~~**Plan the removal of the `require-server-action-suffix` exemption.**~~ Done at the final lock. The exemption for `*.trpc.query.ts` and `*.trpc.mutation.ts` came out once the last role-suffixed file was gone, and it was the last transition glob in the config.
6. ~~**Decide the two placements step 2 deliberately left open:**~~ Answered by the close-out (issue #54): `feedback-status.ts` goes to `_domains/feedback/_types/` and `_components/dashboard/search-params.ts` stays where it is (amendment 2). Reasoning in the close-out entry.

## Step 3 prerequisite: the four defective ESLint rules (issue #57)

The rules that gate step 3 came from the kit and carried four defects against this repo. Fixed on 2026-09-18, each with a test in the existing rule harness (`packages/eslint-config/local-rules/*.test.js`, run by `pnpm test`).

| Defect                                                                                                                                         | Fix                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schema-must-be-pure-zod` banned the source project's database alias (`@repo/db`), which does not exist here, so a schema could import Prisma. | It now bans `@workspace/db`, `@workspace/db/index` and `@workspace/db/generated/prisma/client`, and keeps `@workspace/db/generated/prisma/enums` allowed. Prisma 7 does emit `generated/prisma/enums.ts` here, so the `z.nativeEnum(...)` source stays reachable. |
| `require-trpc-output-type` omitted `count-` from its read verbs, although the server file conventions list it in the closed read set.          | `count-` added to `READ_VERB_RE`, with a valid and an invalid case. Mirrored into `docs/architecture/migration-kit/local-rules/require-trpc-output-type.js`: this one is a kit defect, not a repo mismatch.                                                       |
| `require-schema-conventions` was wired with no options, so its PascalCase and singular-`Input` checks never ran.                               | Wired as `[agent, { requirePascalCaseSchema: true, requireSingularInput: true }]` in `packages/eslint-config/next.js`. The rule already had option tests; the wiring itself is now tested by `next-config.test.js`.                                               |
| Rule comments and the `services-no-bare-error` message cited the source project's ADR numbers (`ADR-0009`, and `ADR-0010` for domain errors).  | Re-cited against this repo's numbering, guarded by `local-rules/adr-citations.test.js`, which fails on any ADR number that is neither committed under `docs/adr/` nor reserved below.                                                                             |

`packages/eslint-config/vitest.config.js` now also collects `*.test.js` at the package root, which is where the config-wiring test lives: it asserts the wiring of `next.js`, not the behaviour of a rule.

### ADR numbers reserved for the two kit ADRs

The rules cite two ADRs that the "commit the two kit ADRs" prerequisite still has to write. Their numbers are reserved here so that prerequisite uses the same ones and the citation test keeps passing:

| Number     | ADR                                 | Cited by                                                                                                                                 |
| ---------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ADR-0011` | Server file conventions             | `require-trpc-output-type`, `services-verb-prefix`, `services-no-trpc-import`, `schema-must-be-pure-zod`, `no-client-import-of-services` |
| `ADR-0012` | Domain errors and transport mapping | `services-no-bare-error` (in its user-facing message), `no-client-import-of-server-errors`                                               |

`ADR-0010` (app folder architecture) is already committed and keeps the bucket-set and feature-nesting citations (`no-feature-nesting`, `require-use-client-suffix`).

### Warning baseline re-counted after the fixes

Counted on 2026-09-18 with the system `grep` binary, since the agent shell wraps `grep`:

```sh
pnpm lint:agent-rules --force 2>&1 | /usr/bin/grep -o 'local/[a-z-]*' | sort | uniq -c
```

| Rule                         | After step 2 | After the rule fixes | Note                                                                                                                                                                                                |
| ---------------------------- | -----------: | -------------------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-raw-tailwind-colors`     |           88 |                   88 | Unaffected.                                                                                                                                                                                         |
| `require-schema-conventions` |           28 |                   58 | +30 plural `XInputs` type aliases, surfaced by `requireSingularInput`. PascalCase adds 0.                                                                                                           |
| `require-use-client-suffix`  |            3 |                    3 | Unaffected.                                                                                                                                                                                         |
| `schema-must-be-pure-zod`    |            1 |                    1 | The admin Subscription schema, which imports `@/server/...` and was already reported. No schema imports `@workspace/db` today, so retargeting the alias closes a hole rather than burning one down. |

**150 problems, 0 errors, 150 warnings**, up from 120. The 30 new warnings are the plural-`Inputs` renames step 3 performs; they are burn-down items, not regressions.

Verified at the same commit: `pnpm typecheck` clean (4 tasks), `pnpm lint` 0 warnings (5 tasks), `pnpm test` 173 ESLint rule and config tests plus the 4 app tests, `pnpm lint:agent-rules` 0 errors.

A fresh clone needs `pnpm build:packages`, `pnpm --filter @workspace/db db:gen` and, in `apps/web`, `npx next typegen` before `pnpm typecheck` passes: the generated Prisma client, the widget package builds and the Next.js route types are all untracked. Without them `tsc` reports errors that have nothing to do with the change under test.

## Step 3 prerequisite: the `migratedScopes` lock mechanism (issue #58)

Added on 2026-09-18 in `packages/eslint-config/next.js`. The kit's strategy is to migrate one scope at a time and lock it as it lands; without a per-scope severity the step's rules could only go to `error` once every scope was done, which is the opposite of a burn-down.

### How it works

`migratedScopes` is an array of glob fragments relative to `src/app`, written the way the folder is spelled on disk: `"(public)"`, `"(authenticated)/account"`, `"admin/users"`, `"_domains/auth"`. It starts empty. Each listed scope generates two config blocks through `migratedScopeConfigs(scope, severity)`, appended last in `nextJsConfig` so they override the `warn` ramp above them:

| Block                                           | Rules raised to `error`                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `**/src/app/<scope>/**/_services/**/*.{ts,tsx}` | `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `services-no-bare-error`                                    |
| `**/src/app/<scope>/**/*.{ts,tsx}`              | `no-client-import-of-services`, `no-feature-nesting`, `require-schema-conventions`, `schema-must-be-pure-zod`, `require-use-client-suffix` |

Two blocks, not three: every rule in the second block already self-guards on the file name it targets, so the wide glob costs nothing. `require-schema-conventions` and `schema-must-be-pure-zod` only look at `*.schema.ts`, `no-feature-nesting` only at a nested `_features/`. The rule options are hoisted into `schemaConventionOptions` and `useClientSuffixOptions` so the locked block and the unlocked ramp cannot drift apart.

`no-default-export` is not in the list: it is scoped to `_domains/**` by design and was already locked there in step 2. A route scope holds `page.tsx` and `layout.tsx`, which must default-export. `no-raw-tailwind-colors` is not in the list either: the spec puts its 88 warnings outside this step's definition of done.

The locked severity reuses the same gate as `_domains/**` (`error` with `ESLINT_AGENT_RULES=1`, `off` without), so a lock never affects `pnpm lint`; only `pnpm lint:agent-rules` enforces it.

`no-client-import-of-server-errors` moved from `off` to always-on `error`, outside the agent gate, as ADR-0012 prescribes. `src/server/errors/` exists since `f2c8d60` and only two files import it (`src/server/trpc/trpc.ts` and its test), neither of them a client module, so zero violations were possible and the rule lands straight at `error` rather than in the burn-down.

### Demonstration

`admin/users` was listed temporarily, then reverted. It is a scope with known warnings, so the flip is visible without writing a violation:

```sh
pnpm lint:agent-rules --force 2>&1 | /usr/bin/grep -E "admin/users|problems"
```

**150 problems (10 errors, 140 warnings)**: the 10 warnings inside `admin/users` became errors and the total did not move, which is what "raises severity for this scope alone" means. The 10 are 7 plural `XInputs` aliases, 1 impure schema (the admin Subscription schema) and 2 missing `.client.tsx` suffixes. The `[id]` segment matched: a Next.js dynamic segment is a bracket in the path, not in the pattern, so `**` walks it normally.

The `_services/` block has no files to match yet, so it was verified through the effective config instead, from `apps/web`:

```sh
ESLINT_AGENT_RULES=1 npx eslint --print-config "src/app/admin/users/_services/get-user.ts"
```

which reported `2` (error) for all four services rules, while with the array empty `src/app/(authenticated)/organization/_services/get-organization.ts` reported `1` (warn). Route-group parentheses are literal in a glob, confirmed the same way and pinned by a test.

Reverted, the run is back to **150 problems, 0 errors, 150 warnings**, split 88 `no-raw-tailwind-colors`, 58 `require-schema-conventions`, 3 `require-use-client-suffix`, 1 `schema-must-be-pure-zod`: unchanged from the count recorded after the rule fixes.

### Tests

`packages/eslint-config/next-config.test.js` gained six cases, taking the package to 180 tests:

- no scope is locked while the array is empty, and the services rules still live only in the unlocked `**/_services/**` ramp;
- the `_services/` block carries the four services rules at `error` on the scope's `_services/` glob;
- the whole-scope block carries the five general rules at `error`, options included;
- every rule falls back to `off` when the agent gate is off;
- the globs match through ESLint's own matcher rather than by eye: a file under `admin/users/[id]/` and one under `(public)/blog/[slug]/` resolve to `error`, while `admin/dashboard/` and `(auth)/login/` resolve to no config at all;
- `no-client-import-of-server-errors` is `error` in a config built with `ESLINT_AGENT_RULES=0`.

The glob test builds an `ESLint` instance over `apps/web` and reads `calculateConfigForFile`, so it exercises the real matcher without a new dependency. A direct `minimatch` devDependency was tried first and reverted: `pnpm install` rewrites `pnpm-lock.yaml` from the committed Prettier quoting into pnpm's own, a 20,000-line diff unrelated to the change.

### Deleted at the final lock

The array, `migratedScopeConfigs`, the `lockedSeverity` constant and the `lockedScopeConfigs` spread all come out in issue #82, when the step's rules go to `error` unconditionally. The hoisted option constants stay.

## Step 3 prerequisite: the two kit ADRs (issue #56)

Committed on 2026-09-18, at the numbers the rule citations already reserved above, so `local-rules/adr-citations.test.js` now checks committed files rather than the reservation table:

| ADR                                                    | Source                                                                | Local addition                                                                                                               |
| ------------------------------------------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `docs/adr/0011-server-file-conventions.md`             | `migration-kit/adrs/server-file-conventions.md`, verbatim             | A "Deviations in this repo" section: the derived read type is `<Service>Output`, and the ADRs this one relates to by number. |
| `docs/adr/0012-domain-errors-and-transport-mapping.md` | `migration-kit/adrs/domain-errors-and-transport-mapping.md`, verbatim | A "Status in this repo" section: what is live since step 3 (commit `f2c8d60`) and what step 4 adds.                          |

The kit body of each file is copied unchanged, following the precedent of ADR-0010, which is byte-identical to its kit source. The local sections are additive, so a later diff against the kit stays readable.

### Why 0012 lands in step 3 rather than step 4

The kit commits the domain errors ADR with step 4. Here the vocabulary and the tRPC middleware ship in step 3 as a prerequisite, so the document that justifies them has to be local before the first service is extracted. The ADR carries a status note separating what is live from what step 4 adds (route handler responses, Next.js interrupts, non-retriable Inngest failures, the server action branch, 500 masking and logging, always-on `services-no-bare-error`, retiring the six legacy error classes). `04-domain-errors.md` now updates that note instead of creating a second ADR.

### `<Service>Output`, the one naming deviation

The kit names a read service's derived type after the function (`export type ListUsers = ...`). This repo keeps the `Output` suffix all 95 existing `inferProcedureOutput` aliases already use (190 occurrences counting their imports, which is the number the spec quotes) (`GetMrrOutput`, `GetPaginatedUsersOutput`), so a consumer changes an import path and nothing else when step 3 moves the type onto the service. `require-trpc-output-type` inspects the right-hand side, not the name, so both spellings lint clean; the convention is a review concern. Recorded in ADR-0011 and in `rules/backend.md`.

### Documents aligned with the vocabulary landing in step 3

- `docs/architecture/target-architecture.md`: the core-files table points at the two committed ADRs, the status paragraph says `src/server/errors/domain-errors.ts` and the tRPC mapping are live, the services layer spells the derived type `<Service>Output`, and the authorization note stops promising `ForbiddenError` "in step 4".
- `.agents/skills/coding-standards/SKILL.md`: the migration status section says step 3 is running, its prerequisites have landed, and any service written now throws domain errors.
- `rules/errors.md`: the "lands in step 4" banner becomes "what exists today", separating the vocabulary and the tRPC mapping from the boundary helpers, the masking and the boundary files.
- `rules/backend.md` and `rules/architecture.md`: authority links point at `docs/adr/0011-...` and `docs/adr/0012-...`, and the backend example now shows a service throwing `NotFoundError` and exporting `GetAnimalOutput`, with the note that identity, rate limiting and plan limits stay in the procedure.

`CONTEXT.md` is unchanged: Service, Helper and Scope are architecture vocabulary, not glossary terms.

## Step 3 prerequisite: the corrected step 3 kit document (issue #59)

Corrected in place on 2026-09-18 in `docs/architecture/migration-kit/03-services.md`. The document is the authority the final lock (issue #82) runs its "must be gone" checks from, so a check that cannot fail is worse than no check at all: it closes the step on a false green.

### What was wrong

| Check                           | Defect                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role suffixes                   | Grepped file **contents** for `"\.(trpc\|server)\.(query\|mutation)\.ts$"`, which no source line can match. It returned nothing while 112 role-suffixed files sat on disk. The unescaped pipes had also split the cell, so Prettier reformatted the leftover `*` of the companion `find` into `_`: the fallback read `-name "_.trpc._.ts"`. |
| Routers inside buckets          | `find -path "*/_*/trpc-router.ts"`: `*` crosses `/` in `find -path`, so the pattern also matches `_domains/<domain>/trpc-router.ts`, the one place a router is supposed to live from step 3 on.                                                                                                                                             |
| Every check                     | Keyed on `.ts` only. `(authenticated)/_features/feedback/send-feedback.trpc.mutation.tsx` is a procedure module in a `.tsx` file and slipped through all of them.                                                                                                                                                                           |
| tRPC and `TRPCError` in service | `grep ... -l \| grep _services/` piped one grep into another inside a table cell, which is what broke the row formatting in the first place.                                                                                                                                                                                                |

Two statements in the prose were also stale: the prerequisite told the agent to copy `domain-errors.ts` "verbatim from the kit README's runtime files list" (the kit ships no runtime file for it; the list covers skills, lint rules and agent instructions, and the pointer refers to the other project's tree), and the strategy described a `migratedScopes` allowlist in the abstract, without the shape the repo actually built in issue #58.

### The repaired table and its pre-migration output

Ten checks, each a single command that returns nothing when the step is done. Commands are pipe-free wherever possible (repeated `grep -e` instead of `|` alternation, `find -exec grep -l {} +` instead of `find | xargs grep`); the one unavoidable pipe is written `\|` in the cell. Every command below was run from the repo root exactly as the document renders it, at commit `0cf1c04`:

| Check                                   | Lines returned | Note                                                                                                                                              |
| --------------------------------------- | -------------: | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role suffixes                           |            112 | 43 `*.trpc.query.ts`, 67 `*.trpc.mutation.ts`, 1 `*.trpc.mutation.tsx`, 1 `*.server.query.ts`                                                     |
| Old buckets                             |             19 | All 19 are `_utils/`; no `_trpc/`, `_queries/`, `_mutations/`, `_server/`, `_hooks/`, `_schemas/`, `_lib/` exists                                 |
| `_constants/` inside a scope            |              1 | `_domains/subscription/_constants`; the app-root `_constants/` is excluded by `-mindepth 2`                                                       |
| `*.types.ts` files                      |              0 | Already clean; step 2 left no `*.types.ts` under `src/app`                                                                                        |
| Routers inside a bucket or a feature    |             14 | All 14 sit in a `_utils/`, one of them nested inside the `(public)` GitHub stars feature                                                          |
| tRPC imported by a service              |              0 | Vacuous: no `_services/` folder exists yet                                                                                                        |
| `TRPCError` in a service                |              0 | Vacuous, same reason. 209 `new TRPCError` sites exist outside `_services/` (the spec's 208, plus the mapping middleware the prerequisite added)   |
| `'use server'` in a service or a router |              0 | Vacuous for services; the 14 existing routers carry no directive. 81 files under `src/app` carry one, all of them role-suffixed procedure modules |
| Prisma queried outside a service        |            103 | Excludes `route.ts`, see below                                                                                                                    |
| Procedure output as the type source     |             95 | The 95 files holding the 190 `inferProcedureOutput` aliases, `src/lib/trpc/` excluded                                                             |

The three checks added by this ticket are the `'use server'` one, the Prisma one and the `_constants/` one. The first two are vacuous today and become meaningful from the first extraction on; the third already has its one target.

### Debt: route handlers excluded from the Prisma check

The Prisma check excludes `route.ts` on purpose. Twelve route handlers under `src/app/api/**` query Prisma inline and no step 3 ticket touches them: the step promises that pages, layouts and server components stop querying Prisma (issue #54, user story 24) and that the agent API's `_utils/` buckets are renamed (issue #80), not that route handlers grow a service layer.

`api/github/setup/route.ts`, `api/jira/install/route.ts`, `api/jira/callback/route.ts`, `api/linear/callback/route.ts`, `api/slack/callback/route.ts`, `api/upload/route.ts`, `api/v1/feedback/route.ts`, `api/v1/feedback/[id]/route.ts`, `api/v1/feedback/[id]/screenshot/route.ts`, `api/webhooks/github/route.ts`, `api/webhooks/jira/[token]/route.ts`, `api/webhooks/linear/route.ts`.

Without the exclusion the check returns 115 lines instead of 103. Recording the twelve here rather than widening the check keeps the final lock honest: "all IO is in `_services/`" holds for the tiers step 3 migrates, and the route handler tier is step 4 and step 5 work, alongside their HTTP error mapping.

### Prettier

`npx prettier --check docs/architecture/migration-kit/03-services.md` passes, and a `--write` pass changes nothing: the escaped pipe, the escaped `find` parentheses and the `*` globs all survive a reformat, and no row is split. The commands were re-extracted from the formatted file and re-run to produce the counts above, so the table is verified as rendered, not as authored.

## Step 3 scope log

One entry per scope, in the order the scopes were migrated. Each entry records the commit, the
renamed procedure keys, the reclassified errors, the deprecated stubs left for the maintainer and
the manual smoke checklist that was walked. Later entries follow the shape of the first.

### `(public)`, the pilot scope (issue #60)

Commit `fb076dd`. One operation, chosen as the pilot because a single procedure is enough to
prove the recipe, the lock and this log format before anything larger moves.

| Item             | Before                                                             | After                                    |
| ---------------- | ------------------------------------------------------------------ | ---------------------------------------- |
| Operation        | `(public)/_features/github-stars/fetch-github-stars.trpc.query.ts` | `(public)/_services/get-github-stars.ts` |
| Router           | `(public)/_features/github-stars/_utils/trpc-router.ts`            | `(public)/trpc-router.ts`                |
| Router export    | `githubStarsFeatureRouter`                                         | `publicRouter`                           |
| App router mount | `githubStars: githubStarsFeatureRouter`                            | `public: publicRouter`                   |
| Output type      | `FetchGithubStarsOutput` from `inferProcedureOutput`               | `GetGithubStarsOutput` from the service  |

**Renamed procedure key.** `trpc.githubStars.fetchStars` became `trpc.public.getGithubStars`. The
single call site, `github-stars-button.client.tsx`, was updated in the same commit. `fetch-` is not
in the read vocabulary, and the `(public)` router does not carry the entity in its key, so the
procedure key is the full service name.

**Reclassified errors.** None. The operation throws nothing: a non-`ok` GitHub response returns
`{ stars: null }`, which is unchanged. No `TRPCError`, no `DomainError`, no database client
parameter, since the service holds no authorization check and no domain-error branch.

**Deprecated stubs.** `(public)/_features/github-stars/_utils/_deprecated_trpc-router.ts`. The
folder it sits in is the last `_utils/` of the scope, so the old-bucket check stays red for
`(public)` until the maintainer deletes the stub (issue #81).

**Smoke checklist, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                       | Result                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `GET /api/trpc/public.getGithubStars?batch=1&input=%7B%7D`  | `200`, `[{"result":{"data":{"json":{"stars":34}}}}]`                     |
| `GET /api/trpc/githubStars.fetchStars?batch=1&input=%7B%7D` | `404 No procedure found on path`, so no call site is left on the old key |
| `GET /open-source`                                          | `200`, the public header renders with the "Star us on GitHub" button     |

`/` and `/pricing` answer `307` to `/login` under the dummy environment used here, because
`NEXT_PUBLIC_IS_CLOUD` is unset; `/open-source` is the public page that renders the same header, so
it stands in for the home page. Rendering the button on the cloud home page is left to the
maintainer's pass.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 180
ESLint rule and config tests plus the 12 app tests; `pnpm lint:agent-rules` 150 problems, 0 errors,
150 warnings, identical per rule to the re-counted baseline above (88 / 58 / 3 / 1), so the pilot
added no warning and cleared none: the scope had no violation of this step's rules to begin with.
`npx next build` passes with dummy environment values.

**Per-scope "must be gone" checks**, each command from the kit document restricted to
`apps/web/src/app/(public)`: role suffixes, routers inside a bucket or a feature, tRPC imported by a
service, `TRPCError` in a service, `'use server'` in a service or a router, Prisma queried outside a
service, `_constants/` inside a scope and `inferProcedureOutput` all return nothing. Old buckets
returns the one `_utils/` folder holding the deprecated stub, as expected until the maintainer's
deletion pass.

### `_domains/organization` (issue #61)

Commit `a9ba3a3`. One operation, one IO helper and one pure helper. First domain of the step, and
the first scope whose `_utils/` folder disappears entirely rather than surviving as a stub holder.

| Item             | Before                                                 | After                                                     |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Operation        | `organization/create-organization.trpc.mutation.ts`    | `organization/_services/create-organization.ts`           |
| Schema           | `organization/create-organization.schema.ts`           | `organization/_services/create-organization.schema.ts`    |
| Slug lookup      | `organization/_utils/generate-unique-slug.ts`          | `organization/_services/get-unique-organization-slug.ts`  |
| Role labels      | `organization/_utils/organization-roles.ts`            | `organization/_helpers/organization-roles.ts`             |
| Router           | `organization/_utils/trpc-router.ts`                   | `organization/trpc-router.ts`                             |
| Router export    | `organizationFeatureRouter`                            | `organizationRouter`                                      |
| App router mount | `organization: organizationFeatureRouter`              | `organization: organizationRouter`                        |
| Output type      | `CreateOrganizationOutput` from `inferProcedureOutput` | `CreateOrganizationOutput` from the service's return type |
| Input type       | `CreateOrganizationInputs`                             | `CreateOrganizationInput`                                 |

**Renamed procedure keys.** None. The service is `createOrganization` and the router already carries
the entity, so the key stays `create` and no client call site changes. `trpc.organization.create` is
the same path before and after.

**Renamed functions.** `generateUniqueSlug` became `getUniqueOrganizationSlug`. The function queries
Prisma, so it is IO and belongs in `_services/`, and inside `_services/` the closed read vocabulary
applies: it performs no write, so it is a computed read and must carry a read verb naming its
result. The spec's agreed rename list (issue #54) only covered the 111 operation files, so this one
is decided here. Its three call sites were updated in the same commit:
`server/auth/config/database-hooks.ts`, the not yet migrated
`(authenticated)/organization/_features/general/update-organization.trpc.mutation.ts`, and the new
`create-organization` service. `CreateOrganizationInputs` became `CreateOrganizationInput`, which
clears one `require-schema-conventions` warning (58 to 57).

**Reclassified errors.** None. The operation's single throw is the plan limit denial from
`checkOrganizationLimit`, and a plan limit denial is transport policy, not a domain failure, so its
`FORBIDDEN` `TRPCError` stays in the procedure with its message and its `cause` untouched. No
`DomainError` enters this domain, and the service holds no authorization check and no domain error
branch, so it takes no database client parameter.

**Placement calls.** `organization-roles.ts` holds a label record and three predicates that read an
already-loaded role string, so it is pure behaviour and goes to `_helpers/`, not to a per-domain
`_constants/` (ADR-0010). `index.ts` stays `export {}`: the barrel exports capabilities, never
services or routers, and the app router keeps mounting the domain router by deep import, which is
the composition layer doing its job.

**Deprecated stubs.** None. Both retired files survived as `git mv` moves, the operation file to its
service name and the router to the domain root, so nothing dissolved and the domain's `_utils/`
folder is gone rather than left holding a stub.

### `_domains/user` (issue #61)

Commit `ac5a4bb`. No tRPC operation: the work is the bucket fan-out plus the one service that
removes the last inline Prisma query from the two layouts.

| Item              | Before                                         | After                                        |
| ----------------- | ---------------------------------------------- | -------------------------------------------- |
| Display name      | `user/_utils/get-user-display-name.ts`         | `user/_helpers/get-user-display-name.ts`     |
| Onboarding lookup | inline `prisma.user.findUnique` in two layouts | `user/_services/has-completed-onboarding.ts` |
| Router            | none                                           | none                                         |

**Renamed procedure keys.** None: the domain exposes no procedure and has no router.

**Reclassified errors.** None. The service is a pass-through read with no authorization check and no
domain error branch, so it takes no database client parameter and throws nothing.

**The shared lookup.** `(authenticated)/layout.tsx` and `onboarding/layout.tsx` each ran the same
`prisma.user.findUnique({ where: { id }, select: { onboardingCompleted: true } })` and each tested
`user?.onboardingCompleted`. The service returns exactly that expression,
`user?.onboardingCompleted ?? false`, so both branches keep their truth table, including the case
where the row is missing. `has-` is the read vocabulary's IO-predicate verb: the function queries to
answer, so it is a service and not a `_helpers/` predicate. Both layouts deep-import it; routes may
reach into a domain's internals, so the barrel is not involved and stays `export {}`. Neither layout
imports Prisma any more. The comment explaining why the flag is read from the database rather than
the session (Better Auth caches the session cookie for five minutes) moved into the service, where
it is the reason the function exists.

**Deprecated stubs.** None. The one retired file survived as a `git mv` move, and the domain's
`_utils/` folder is gone.

### Verification of both domains

Walked once over the two commits, since the second is a strict superset of the first for every
whole-repo command.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 180 ESLint
rule and config tests plus the 12 app tests; `pnpm lint:agent-rules` 149 problems, 0 errors, 149
warnings (`no-raw-tailwind-colors` 88, `require-schema-conventions` 57,
`require-use-client-suffix` 3, `schema-must-be-pure-zod` 1). That is one warning fewer than the
pilot's 150: the `CreateOrganizationInputs` rename cleared it and nothing new was added.
`npx next build` passes with dummy environment values.

**Per-scope "must be gone" checks.** All ten commands of the kit document, each restricted to
`apps/web/src/app/_domains/organization` and then to `apps/web/src/app/_domains/user`, return
nothing, the old-bucket check included: unlike the pilot, neither domain leaves a stub behind, so
neither has a `_utils/` folder left and neither is waiting on the maintainer's deletion pass
(issue #81).

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                  | Result                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `POST /api/trpc/organization.create?batch=1`           | `401 UNAUTHORIZED`, so the relocated router still serves the unchanged key     |
| `GET /api/trpc/organization.nope?batch=1&input=%7B%7D` | `404 No procedure found on path`, the control for the check above              |
| `GET /inbox` signed out                                | `307` to `/login`, the `(authenticated)` layout still guards before the lookup |
| `GET /onboarding` signed out                           | `307` to `/login`, same for the onboarding layout                              |
| `GET /open-source`                                     | `200`, the pilot scope is unaffected                                           |

**Not smoked here, and why.** No database is reachable in this environment, so every authenticated
path stops at the session check. Creating an Organization end to end, the plan limit denial on a
second Organization, the onboarding redirect actually driven by `hasCompletedOnboarding`, the role
labels on the members and invitations tabs, and the admin user information card are listed as a QA
checklist on issue #61 for the maintainer to walk against a real database. Each of them is a pure
call-site repoint or a same-expression extraction, which is what typecheck covers, but none is
observed running.

**Debt noted, not fixed.** `CreateOrganizationSchema` carries a French validation message,
`"Le nom est requis"`, which the migration preserves verbatim because error and form copy must not
change in this step. It is the same family as anomaly 4 above (`ANONYMOUS_USER_NAME`) and needs its
own ticket rather than a line in a refactor.

### `_domains/auth` and the `(auth)` route group (issue #62)

Commit `dc7a8db`. Six operations: the four mutations the `(auth)` route group owned plus the
domain's own two. The largest entry of the step so far, and the first to face identity failures,
generic 500 wrappers and a router key owned by two scopes at once.

| Item               | Before                                                           | After                                                     |
| ------------------ | ---------------------------------------------------------------- | --------------------------------------------------------- |
| Sign in            | `(auth)/login/_features/login-form/login.trpc.mutation.ts`       | `auth/_services/sign-in-user.ts`                          |
| Registration       | `(auth)/signup/_features/signup-form/signup.trpc.mutation.ts`    | `auth/_services/register-user.ts`                         |
| Reset request      | `(auth)/forgot-password/.../forgot-password.trpc.mutation.ts`    | `auth/_services/request-password-reset.ts`                |
| Reset completion   | `(auth)/reset-password/.../reset-password.trpc.mutation.ts`      | `auth/_services/reset-password.ts`                        |
| Verification mail  | `auth/send-verification-email-button/*.trpc.mutation.ts`         | `auth/_services/send-verification-email.ts`               |
| Stop impersonating | `auth/stop-impersonate-button/stop-impersonate.trpc.mutation.ts` | `auth/_services/stop-impersonate.ts`                      |
| Password rule      | `auth/_utils/password.schema.ts`                                 | `auth/_services/password.schema.ts`, plus `PasswordInput` |
| Domain router      | `auth/_utils/trpc-router.ts` (`authenticationFeatureRouter`)     | `auth/trpc-router.ts` (`authRouter`)                      |
| Group router       | `(auth)/_utils/trpc-router.ts` (`authRouter`)                    | dissolved into a `_deprecated_` stub                      |
| App router mount   | `auth: mergeRouters(authRouter, authenticationFeatureRouter)`    | `auth: authRouter`                                        |
| Output types       | four unused `inferProcedureOutput` aliases                       | dropped: no consumer imported them                        |

**Renamed procedure keys.** `trpc.auth.login` became `trpc.auth.signInUser`, `trpc.auth.signup`
became `trpc.auth.registerUser`, `trpc.auth.forgotPassword` became
`trpc.auth.requestPasswordReset`. `resetPassword`, `sendVerificationEmail` and `stopImpersonate`
already mirrored their service verb and are unchanged. The `auth` router does not carry the `User`
entity in its key, so the two `-user` services keep the full name as their key. The four form
clients were updated in the same commit, and the four `Inputs` aliases became the singular `Input`
their schema convention asks for.

**The key collision.** The route group and the domain both mounted a router under `auth`, which is
why `mergeRouters` existed. The four mutations now live in the domain that owns them, so the app
router mounts one `authRouter`, `mergeRouters` has no caller left, and its re-export was removed
from `server/trpc/trpc.ts` in the same commit rather than left as a retired pattern to copy.

**Identity failures, the case the recipe did not cover.** Two operations translate a Better Auth
message into `UNAUTHORIZED`: invalid credentials on sign-in, and a rejected token on reset. The
vocabulary has no `UNAUTHORIZED` member on purpose (identity is answered at the transport edge), so
this translation cannot move into a service without changing the code a client sees. Both stay in
their procedure, as the step's invariant prescribes, which is why those two procedures carry a
`try`/`catch` instead of a single service call. The matching is the original code, moved rather
than redesigned. Everything else in the router is the thin shape: auth procedure, input schema, one
service call.

**Reclassified errors.**

| Operation                 | Before                                           | After                                 |
| ------------------------- | ------------------------------------------------ | ------------------------------------- |
| `send-verification-email` | bare `Error("This user does not exist.")`, a 500 | `NotFoundError`, same message, a 404  |
| `stop-impersonate`        | `BAD_REQUEST` swallowed into a 500 by the catch  | `BAD_REQUEST` raised in the procedure |

The first is the one service whose error code changed, so it carries the unit test the step asks
for: `send-verification-email.test.ts` pins both shapes Better Auth uses for an unknown account
(message and `statusCode`), the untranslated propagation of an unexpected failure, and the address
normalisation. The second is a precondition on the session, answerable from the context alone, so
it belongs in the procedure and has no service to test: the old code threw it inside a `try` whose
`catch` rewrapped everything as an `INTERNAL_SERVER_ERROR`, so the message reached the client with
the wrong code.

**Generic 500 wrappers removed.** Four of them: `"Sign in failed. Please try again."`,
`"Account creation failed. Please try again."`, `"Unable to send reset email. Please try again."`
and `"Error sending email. Please try again."`. A service cannot express a 500 with custom copy
(the vocabulary has no member for it and `services-no-bare-error` forbids a bare `Error`), so the
choice the kit describes is also the only one available: the infrastructure error propagates with
its own message. Observed against a dev server with no reachable database, the reset request now
answers `500` with the raw Prisma message where it used to answer `500` with
`"Unable to send reset email. Please try again."`. Step 4's masking is what closes this, and the
four form clients already fall back to their own copy when the message is empty.

**Preserved deliberately.** `EMAIL_NOT_VERIFIED` is still a `FORBIDDEN` carrying that exact
sentinel, thrown by `sign-in-user` as a `ForbiddenError`, so the sign-in form keeps showing the
verification prompt and its resend button. Sign-in against an unreachable database answers
`401 Invalid email or password` both before and after, because the Prisma error message contains
`Invalid` and the matching order is unchanged.

**Placement calls.** `password.schema.ts` is pure Zod shared by two schemas, so it goes to
`_services/` next to them, and it gained the `PasswordInput` type the schema rule requires (it was
one of the three schema files missing one). The account settings password schema, in a scope this
step has not reached, only changed its import path. The two capability folders of the domain
(`send-verification-email-button/`, `stop-impersonate-button/`) keep the flat shape step 2 gave
them; only their operation files moved.

**Deprecated stubs.** `(auth)/_utils/_deprecated_trpc-router.ts`. As with the pilot, the folder it
sits in is the scope's last `_utils/`, so the old-bucket check stays red for `(auth)` until the
maintainer's deletion pass (issue #81). The domain's own `_utils/` is empty and untracked: `git mv`
moved both of its files out, and git records no directory, so a fresh clone has no
`_domains/auth/_utils/` at all. The sandbox refused the `rmdir`, so the working copy that produced
this entry still shows the empty folder.

**Both scopes are locked.** `migratedScopes` gains `"(auth)"` as well as `"_domains/auth"`: after
this commit the route group holds only UI features and the deprecated stub, no other ticket
revisits it, and leaving it unlocked would mean it is never enforced before the final lock.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 180
ESLint rule and config tests plus 16 app tests (12 before, 4 added here); `pnpm lint:agent-rules`
143 problems, 0 errors, 143 warnings (`no-raw-tailwind-colors` 88, `require-schema-conventions` 51,
`require-use-client-suffix` 3, `schema-must-be-pure-zod` 1). Six warnings cleared against the 149
of the previous entry: the four `Inputs` aliases of the route group, `SendVerificationEmailInputs`
and the missing input type of `password.schema.ts`. `npx next build` passes with dummy environment
values.

**Per-scope "must be gone" checks.** All ten commands, run against `apps/web/src/app/_domains/auth`
and then `apps/web/src/app/(auth)`, return nothing, except the old-bucket check on `(auth)`, which
returns the `_utils/` folder holding the deprecated stub, as expected until issue #81.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                             | Result                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `GET /login`, `/signup`, `/forgot-password`, `/reset-password`    | `200`, all four forms render on their moved schemas                       |
| `POST /api/trpc/auth.login`, `auth.signup`, `auth.forgotPassword` | `404 No procedure found on path`, so no call site is left on an old key   |
| `POST` the six new keys with an empty body                        | `400` with the per-field `zodError` each schema produces                  |
| `POST /api/trpc/auth.stopImpersonate` signed out                  | `401 UNAUTHORIZED`, the protected procedure still guards before the check |
| `POST /api/trpc/auth.signInUser` with credentials, no database    | `401 Invalid email or password`, identical to the pre-migration answer    |
| `POST /api/trpc/auth.requestPasswordReset`, no database           | `500` with the raw infrastructure message, the wrapper removal above      |

**Not smoked here, and why.** No database and no mail provider are reachable in this environment, so
no operation completes. Signing in with a verified and with an unverified account, registering with
a fresh and with a taken address, receiving and consuming a reset link, resending a verification
email to a known and to an unknown address, and stopping an impersonation are listed as a QA
checklist on issue #62 for the maintainer to walk against a real database.

### `_domains/subscription` (issue #63)

Commit `71a0b0c`. Three operations plus the domain's own active-Subscription read. The first scope
whose non-operation code carries the entry: a shared client hook, a constants bucket and a root-level
IO file all had to find their final bucket before the domain could be locked.

| Item                | Before                                                       | After                                                      |
| ------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Plan prices         | `subscription/stripe/get-plans-prices.trpc.query.ts`         | `subscription/_services/get-plans-prices.ts`               |
| Stripe subscription | `subscription/stripe/get-stripe-subscription.trpc.query.ts`  | `subscription/_services/get-stripe-subscription.ts`        |
| Upgrade             | `subscription/upgrade-subscription/*.trpc.mutation.ts`       | `subscription/_services/upgrade-subscription.ts`           |
| Active Subscription | `subscription/get-user-active-subscription.ts` (domain root) | `subscription/_services/get-active-subscription.ts`        |
| Status labels       | `subscription/_constants/translations.ts`                    | `subscription/_helpers/get-subscription-status-label.ts`   |
| Plan gate hook      | `subscription/use-plan-gate.ts` (domain root)                | `subscription/plan-gate/use-plan-gate.ts`, barrel-exported |
| Router              | `subscription/_utils/trpc-router.ts`                         | `subscription/trpc-router.ts`                              |
| Router export       | `subscriptionFeatureRouter`                                  | `subscriptionRouter`                                       |
| App router mount    | `subscription: subscriptionFeatureRouter`                    | `subscription: subscriptionRouter`                         |
| Output type         | `GetPlansPricesOutput` from `inferProcedureOutput`           | `GetPlansPricesOutput` from the service's return type      |
| Schemas             | inline `z.object` in the three procedures                    | three `*.schema.ts` files next to their service            |

**Renamed procedure keys.** None. `upgradeSubscription` drops the entity the router already carries,
so its key stays `upgrade`; `getPlansPrices` and `getStripeSubscription` name something other than
the router's entity, so they keep the full service name as their key. `trpc.subscription.upgrade`,
`.getPlansPrices` and `.getStripeSubscription` are the same paths before and after, and no client
call site changed.

**Renamed functions.** `getUserActiveSubscription` became `getActiveSubscription`, which closes
anomaly 3 above: the function reads the Subscription of the session's active **Organization**, and
`CONTEXT.md` attaches a Subscription to an Organization, never to a User. Its single caller, the not
yet migrated `account/billing/_features/current-plan/get-active-subscription.trpc.query.ts`, imports
it under an alias because that file's own procedure already holds the name; issue #68 dissolves the
wrapper. The service now takes `headers` explicitly instead of calling `next/headers` twice itself,
so the Better-Auth IO follows the step's invariant.

**Reclassified errors.**

| Operation                 | Before                                             | After                                               |
| ------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| `get-stripe-subscription` | any Stripe failure, `INTERNAL_SERVER_ERROR`, a 500 | `resource_missing` becomes a `NotFoundError`, a 404 |
| `get-plans-prices`        | generic `"Failed to fetch Stripe prices"` wrapper  | removed, the infrastructure error propagates        |

Stripe answers an identifier it does not know with `resource_missing`, which means the subscription
record pointing at it is stale: that is a not found, not a server fault, and it was the one expected
failure of this domain dressed as a 500. It is the service that carries the reclassification, so it
is the service that carries the unit test the step asks for
(`get-stripe-subscription.test.ts`, four cases: the reclassified code, an unexpected Stripe failure
propagating untranslated, the returned shape, and a subscription with no item). To make that test
possible without reaching for the singleton, the service takes the Stripe client as a trailing
parameter with a default, which is the recipe's dependency-injection rule applied to an SDK client
rather than to the database client. Its new message, `"Subscription not found."`, reaches no user
today: the only consumer, `billing-details-card.client.tsx`, renders its error state from the prices
query and ignores this one's.

The prices wrapper is the generic kind the recipe removes: every per-plan Stripe failure is already
caught one level down and reported as a plan without a price, so the outer `catch` could only fire on
a bug, and it answered with copy no user could act on. Observed on a dev server with a dummy Stripe
key, the operation still answers `200` with `{"monthly":null,"annual":null}` per plan, so the removal
changes nothing a client sees.

**Authorization placement.** `upgrade-subscription` keeps its `FORBIDDEN`
(`"You do not have an active organization"`) as a `ForbiddenError` inside the service. The check needs
the loaded Organization, which the service is what loads, so the placement rule puts it there rather
than in the procedure. It is the only `DomainError` this domain throws on a write path.

**Placement calls.** The status translation record became `getSubscriptionStatusLabel`, a pure
function in `_helpers/`, so the domain has no `_constants/` bucket (ADR-0010). The lookup keeps
returning nothing for a status this app does not model, which is what the admin subscription card
rendered before. The plan gate hook became a capability folder of its own, `plan-gate/`, exported
from the barrel: it is shared by six features across four scopes, and the barrel is now the single
path its consumers use. The two existing capability folders (`plan-card/`, `upgrade-subscription/`)
keep the flat shape step 2 gave them, as the auth domain's did; only the operation file moved out of
`upgrade-subscription/`.

**The barrel stops being empty.** `_domains/subscription/index.ts` is the first domain barrel with a
real export. It exports `usePlanGate` and nothing else: a hook is a capability, which is what a
barrel is for, while the services and the router stay internal and the app router keeps mounting the
router by deep import. Every consumer of the hook now imports `@/app/_domains/subscription`.

**Deprecated stubs.** None. All seven retired files survived as `git mv` moves. Three now-empty
folders (`_utils/`, `_constants/`, `stripe/`) are left in the working copy because the sandbox
refuses `rmdir` and git records no directory: `git ls-files` on the domain lists twelve files and
none of those paths, so a fresh clone has none of the three. Nothing here waits on issue #81.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 180 ESLint
rule and config tests plus 20 app tests (16 before, 4 added here); `pnpm lint:agent-rules` 143
problems, 0 errors, 143 warnings (`no-raw-tailwind-colors` 88, `require-schema-conventions` 51,
`require-use-client-suffix` 3, `schema-must-be-pure-zod` 1), identical per rule to the previous
entry: the three schemas extracted here already follow the convention, so the burn-down neither
grew nor shrank. `npx next build` passes with dummy environment values. The lock was verified with
`ESLINT_AGENT_RULES=1 npx eslint --print-config` on a service file, which reports the four services
rules and the five general rules at `error`.

**Per-scope "must be gone" checks.** All ten commands, restricted to
`apps/web/src/app/_domains/subscription`, return nothing except the old-bucket and `_constants/`
checks, which return the two empty untracked folders described above.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                           | Result                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `GET /api/trpc/subscription.getPlansPrices` with two plan names | `200`, `{"monthly":null,"annual":null}` per plan, the dummy Stripe key   |
| `GET /api/trpc/subscription.getPlansPrices` with an empty input | `400` with the per-field `zodError` the extracted schema produces        |
| `GET /api/trpc/subscription.getStripeSubscription` signed out   | `401 UNAUTHORIZED`, the protected procedure guards before the service    |
| `POST /api/trpc/subscription.upgrade` signed out                | `401 UNAUTHORIZED`, same                                                 |
| `GET /api/trpc/subscription.nope`                               | `404 No procedure found on path`, the control for the three checks above |
| `GET /account/billing`, `/pricing`, `/inbox` signed out         | `307` to `/login`                                                        |
| `GET /open-source`                                              | `200`, the pilot scope is unaffected                                     |

**Not smoked here, and why.** No database and no real Stripe account are reachable, so no operation
completes end to end. Upgrading to a plan and landing on Stripe checkout, the plan gate on a gated
integration section, the free-plan banner in the sidebar, the billing page on a paid plan (which is
the only caller of `getStripeSubscription`) and the admin subscription card's status label are listed
as a QA checklist on issue #63 for the maintainer to walk against a real database.

**Debt noted, not fixed.** The plan gate hook and the status label helper both import
`@/server/auth/config/subscription-plans`, so a client module still reaches a `@/server/` path
(anomaly 1 above). It is the plan configuration relocation that step 5 owns, not something this step
can close: moving the Plan vocabulary into the domain touches billing, the admin subscription schema
and the Better Auth wiring at once.

### `onboarding` (issue #64)

Commit `0f67c6a`. Two operations, no key rename and no client call site touched. The smallest scope
of the step after the pilot, and the first whose `_utils/` held nothing but the router.

| Item           | Before                                                               | After                                                      |
| -------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| Complete       | `_features/complete-onboarding/complete-onboarding.trpc.mutation.ts` | `onboarding/_services/complete-onboarding.ts`              |
| Create Project | `_features/create-project/create-project.trpc.mutation.ts`           | `onboarding/_services/create-onboarding-project.ts`        |
| Schema         | `_features/create-project/create-project.schema.ts`                  | `onboarding/_services/create-onboarding-project.schema.ts` |
| Router         | `onboarding/_utils/trpc-router.ts`                                   | `onboarding/trpc-router.ts`                                |
| Output types   | `CompleteOnboardingOutput`, `CreateOnboardingProjectOutput`          | dropped: no consumer imported either                       |

**Renamed procedure keys.** None. `createOnboardingProject` and `completeOnboarding` both drop the
entity the router already carries, which lands on the keys the router already used, so
`trpc.onboarding.createProject` and `trpc.onboarding.complete` are the same paths before and after
and `onboarding-wizard.client.tsx` did not change.

**File named after the operation, not the entity.** The service keeps the existing
`createOnboardingProject` name rather than becoming `create-project`. It is not the sidebar
operation of the same entity: it finds the owner membership itself, takes no `organizationId`, and
returns the existing Project with `rawApiKey: null` when the wizard is refreshed. Two services named
`create-project` in two scopes with different contracts would be a name collision waiting to be
mistaken for a duplicate.

**Reclassified errors.** None. The one `TRPCError` of the scope, `FORBIDDEN`
"No organization found.", becomes a `ForbiddenError` with the same code and message. The check needs
the loaded membership, so the placement rule keeps it in the service that reads it, and that service
takes the trailing database client with a default. `complete-onboarding` holds no check and no domain
error branch, so it takes none.

**Deprecated stubs.** None: both operations, the schema and the router survived as `git mv` moves.
The now-empty `onboarding/_utils/` folder is left in the working copy because the sandbox refuses
`rmdir`; `git ls-files` on the scope lists twelve files and no such path, so a fresh clone has no
`onboarding/_utils/` at all. Nothing here waits on issue #81.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 180 ESLint
rule and config tests plus 20 app tests; `pnpm lint:agent-rules` 143 problems, 0 errors, 143 warnings
(88 / 51 / 3 / 1), identical per rule to the Subscription entry: the scope had no violation of this
step's rules before the move and added none. `npx next build` passes with dummy environment values.
The lock was verified with `ESLINT_AGENT_RULES=1 npx eslint --print-config` on the create service,
which reports the four services rules and the five general rules at `error`.

**Per-scope "must be gone" checks.** All ten commands, restricted to `apps/web/src/app/onboarding`,
return nothing except the old-bucket check, which returns the empty untracked `_utils/` folder
described above.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                | Result                                                                |
| ---------------------------------------------------- | --------------------------------------------------------------------- |
| `POST /api/trpc/onboarding.createProject` signed out | `401 UNAUTHORIZED`, the protected procedure guards before the service |
| `POST /api/trpc/onboarding.complete` signed out      | `401 UNAUTHORIZED`, same                                              |
| `GET /api/trpc/onboarding.nope`                      | `404 No procedure found on path`, the control for the two above       |
| `GET /onboarding` signed out                         | `307` to `/login`, the layout's session guard is unaffected           |

**Not smoked here, and why.** No database is reachable, so the wizard cannot be walked end to end.
The four-step run (name, URL, snippet, finish), the refresh in the middle of it that must return the
already-created Project, and the redirect to `/inbox` once the flag is set are on the QA checklist of
issue #64.

### The `(authenticated)` shell (issue #64)

Commit `8b945ba`. Two operations, two renamed procedure keys, one reclassified error. The first scope
migrated at one tier only: the route group holds four child segments that are scopes of their own,
and none of them is migrated yet.

| Item           | Before                                                             | After                                                                     |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Send feedback  | `_features/feedback/send-feedback.trpc.mutation.tsx`               | `(authenticated)/_services/send-feedback.tsx`                             |
| Create Project | `_features/sidebar/project/create/create-project.trpc.mutation.ts` | `(authenticated)/_services/create-project.ts`                             |
| Schemas        | the two `*.schema.ts` next to those files                          | `_services/send-feedback.schema.ts`, `_services/create-project.schema.ts` |
| Router         | `(authenticated)/_utils/trpc-router.ts`                            | `(authenticated)/trpc-router.ts`                                          |
| Output type    | `CreateProjectOutput` from `inferProcedureOutput`                  | dropped: no consumer imported it                                          |
| Input types    | `SendFeedbackInputs`, `CreateProjectInputs`                        | `SendFeedbackInput`, `CreateProjectInput`                                 |

**Renamed procedure keys.** `trpc.authenticated.feedback.send` became
`trpc.authenticated.sendFeedback`, and `trpc.authenticated.projects.create` became
`trpc.authenticated.createProject`. The router export already had no `Feature` infix, so only its
path moved. The two shell operations now sit at the root of the scope's router, beside the four child
segment routers it mounts, and the one-key `feedback` sub-router is gone. Both call sites
(`feedback-button.client.tsx`, `create-project-dialog.client.tsx`) were updated in the same commit.

**Why `projects.create` moved out of the `projects` key.** The create-project dialog is a sidebar
feature, so the shell owns the operation, and no Project-scope ticket of this step lists it. Leaving
the key where it was would have meant either a service of the shell mounted by the not-yet-migrated
`(project)` router, or a procedure defined outside the router of the scope that owns it. Both
contradict the recipe, so the key follows the operation. The old key answers
`404 No procedure found on path`, which is the proof no call site was missed.

**Reclassified errors.**

| Operation       | Before                                                                       | After                                          |
| --------------- | ---------------------------------------------------------------------------- | ---------------------------------------------- |
| `send-feedback` | `INTERNAL_SERVER_ERROR` "No administrator found to receive feedback.", a 500 | `PreconditionFailedError`, same message, a 412 |

An instance with no administrator account cannot deliver in-app feedback: that is a precondition on
the instance, not a server fault, and it is the one expected failure of this scope dressed as a 500.
The message is unchanged, and the feedback popover renders `error.message` in a toast either way, so
the only observable difference is the status code. Being the reclassified service, it carries the
unit test the step asks for (`send-feedback.test.tsx`, four cases: the reclassified code, an
administrator row with no address counting as no administrator, one mail per administrator with the
sender named in the subject, and the two-step fallback when the session carries no name).

**Authorization placement.** `create-project` keeps its `FORBIDDEN`
("You do not have permission to create a project.") as a `ForbiddenError` inside the service: the
check needs the loaded membership of the target Organization, which the service is what loads. The
plan limit on projects stays on the procedure, in the `enforceLimit("projects")` middleware it
already used, because a plan denial is transport policy. Both services take the trailing database
client with a default.

**The service that renders JSX.** `send-feedback` is the `.tsx` procedure module the corrected kit
table warns about, and it stays `.tsx` as a service: it renders a React Email template to build the
mail body. Writing its test exposed a gap in the test harness, recorded as a correction below.

**Deprecated stubs.** None: all four files and the router survived as `git mv` moves. The now-empty
`(authenticated)/_utils/` folder is untracked, as in the scopes before it, so nothing here waits on
issue #81.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 182 ESLint
rule and config tests (two added for the lock's new form) plus 24 app tests (20 before, 4 added
here); `pnpm lint:agent-rules` 141 problems, 0 errors, 141 warnings (`no-raw-tailwind-colors` 88,
`require-schema-conventions` 49, `require-use-client-suffix` 3, `schema-must-be-pure-zod` 1). The
burn-down drops by two: the two plural `Inputs` aliases became the singular `Input` the schema
convention asks for. `npx next build` passes with dummy environment values.

**Per-scope "must be gone" checks.** All ten commands, restricted to the shell tier of
`apps/web/src/app/(authenticated)` (its root files, `_features/` and `_services/`), return nothing
except the old-bucket check, which returns the empty untracked `_utils/` folder. Run over the whole
route group, the router check also returns the four `_utils/trpc-router.ts` files of the child
segments, which are the subject of issues #68 to #79.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                     | Result                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------- |
| `POST /api/trpc/authenticated.sendFeedback` signed out                    | `401 UNAUTHORIZED`, so the new key resolves             |
| `POST /api/trpc/authenticated.createProject` signed out                   | `401 UNAUTHORIZED`, same                                |
| `POST /api/trpc/authenticated.feedback.send`                              | `404 No procedure found on path`, the old key is gone   |
| `POST /api/trpc/authenticated.projects.create`                            | `404 No procedure found on path`, same                  |
| `GET /api/trpc/authenticated.projects.list` signed out                    | `401 UNAUTHORIZED`, the child routers are still mounted |
| `GET /api/trpc/authenticated.organization.get` signed out                 | `401 UNAUTHORIZED`, same                                |
| `GET /inbox`, `/settings`, `/account/billing`, `/organization` signed out | `307` to `/login`, the shell layout is unaffected       |
| `GET /login`                                                              | `200`                                                   |

**Not smoked here, and why.** No database and no mail provider are reachable, so neither operation
completes end to end. Sending feedback as a signed-in user (and the toast it raises), creating a
Project from the sidebar and from the header switcher, the project limit denial on the free plan and
the invalidation of the project list are on the QA checklist of issue #64.

### `admin` and `admin/(dashboard)` (issue #65)

Commit `a7fe9e3`. Five operations, five renamed procedure keys, no reclassified error. The admin
root is migrated at its router tier only: `admin/users` is a scope of its own that issues #66 and #67
finish.

| Item                 | Before                                                                                   | After                                               |
| -------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Users overview       | `(dashboard)/_features/users-overview-card/get-users-overview.trpc.query.ts`             | `(dashboard)/_services/get-users-overview.ts`       |
| Active Subscriptions | `(dashboard)/_features/active-subscriptions-card/get-active-subscriptions.trpc.query.ts` | `(dashboard)/_services/get-active-subscriptions.ts` |
| MRR                  | `(dashboard)/_features/mrr-card/get-mrr.trpc.query.ts`                                   | `(dashboard)/_services/get-mrr.ts`                  |
| Feedback overview    | `(dashboard)/_features/feedback-overview-card/get-feedback-overview.trpc.query.ts`       | `(dashboard)/_services/get-feedback-overview.ts`    |
| Monthly stats        | `(dashboard)/_features/subscriptions-chart/get-monthly-stats.trpc.query.ts`              | `(dashboard)/_services/get-monthly-stats.ts`        |
| Monthly stats schema | `(dashboard)/_features/subscriptions-chart/get-monthly-stats.schema.ts`                  | `(dashboard)/_services/get-monthly-stats.schema.ts` |
| Churn rate           | `(dashboard)/_utils/get-churn-rate.ts`                                                   | `(dashboard)/_services/get-monthly-churn-rate.ts`   |
| Dashboard router     | `(dashboard)/_utils/trpc-router.ts`                                                      | `(dashboard)/trpc-router.ts`                        |
| Admin root router    | `admin/_utils/trpc-router.ts`                                                            | `admin/trpc-router.ts`                              |

**Renamed procedure keys.** All five. The old router wrapped each operation in a one-key sub-router
(`dashboard.users.get`, `dashboard.subscriptions.get`, `dashboard.mrr.get`, `dashboard.feedback.get`,
`dashboard.stats.get`), which read as five entities of a "dashboard" that owns none of them. The keys
now mirror the service verbs: `dashboard.getUsersOverview`, `dashboard.getActiveSubscriptions`,
`dashboard.getMrr`, `dashboard.getFeedbackOverview`, `dashboard.getMonthlyStats`. The entity is not
dropped, because the router carries `dashboard`, not `users` or `mrr`. The five card clients are the
only call sites and were updated in this commit.

**Churn rate moved to `_services/`, not `_helpers/`.** It counts Subscription rows, so it is IO, and
the file is renamed to its export (`getMonthlyChurnRate`). It is the one service here consumed by
another service rather than by a procedure, which is exactly the callability the step is after.

**Reclassified errors.** None. The three `INTERNAL_SERVER_ERROR` throws of this scope
("Failed to get feedback overview", "Failed to get active subscriptions", "Failed to get monthly
stats") were generic try/catch wrappers around Prisma and Stripe calls, so the step's triage removes
them and lets the infrastructure error propagate as a 500 with the same status. No expected failure
was hiding behind them and no message was reachable by a user, so no `DomainError` is introduced and
no unit test is owed. `get-mrr` keeps its two `console.error` catches unchanged: they are a
deliberate degradation (a Stripe outage yields a zero figure, not a failed page), not an error
wrapper.

**No service takes a database client.** All five are pass-through reads with no authorization check
and no domain error branch, so the trailing client parameter would be unused.

**Authorization.** The admin role check stays on `adminProcedure`: it is answerable from the context
alone. No dashboard service repeats it, and none of them receives a session.

**Output types.** The five `inferProcedureOutput` aliases became `Awaited<ReturnType<typeof …>>`
exports on their services, plus a sixth on `get-monthly-churn-rate` that the read-service rule
requires. `subscriptions-chart.client.tsx` is the one consumer and only changed its import path.
`get-monthly-stats.schema.ts` gained the `GetMonthlyStatsInput` type it lacked, which burns down one
`require-schema-conventions` warning.

**Deprecated stubs.** None: every file survived as a `git mv`. The now-empty `admin/_utils/` and
`admin/(dashboard)/_utils/` folders are left in the working copy because the sandbox refuses `rmdir`;
`git ls-files apps/web/src/app/admin` lists no path under either, so nothing here waits on issue #81.

**Lock.** `migratedScopes` gains `{ scope: "admin", ignores: ["**/src/app/admin/users/**"] }`, the
second entry to use the ignore form after `(authenticated)`. Verified with
`ESLINT_AGENT_RULES=1 npx eslint --print-config`: `admin/(dashboard)/_services/get-mrr.ts` reports the
services rules at `error` (severity `2`), `admin/trpc-router.ts` reports the general rules at `error`,
and `admin/users/_features/users-table/users-table.tsx` still reports `require-use-client-suffix` at
`warn` (severity `1`).

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 182 ESLint
rule and config tests plus 24 app tests; `pnpm lint:agent-rules` 140 problems, 0 errors, 140 warnings
(88 `no-raw-tailwind-colors` / 48 `require-schema-conventions` / 3 `require-use-client-suffix` / 1
`schema-must-be-pure-zod`), one below the 141 of the `(authenticated)` entry, from the added input
type. `npx next build` compiles successfully with dummy environment values and still lists `/admin`,
`/admin/users` and `/admin/users/[id]`.

**Per-scope "must be gone" checks.** All ten commands, restricted to `apps/web/src/app/admin`, return
either nothing or `admin/users` paths, which issues #66 and #67 own. The only non-`users` lines are
the two empty untracked `_utils/` folders described above. Restricted to `admin/(dashboard)` and
`admin/trpc-router.ts`, the ten checks return nothing but those folders.

**No admin page outside the users scope queries Prisma inline.** The acceptance criterion has no
target here: `admin/layout.tsx` reads the session through Better-Auth, `admin/(dashboard)/page.tsx`
composes five client cards, and `_features/sidebar/admin-sidebar.server.tsx` renders static links.
The four inline-Prisma files under `admin/` all sit in `admin/users`, where issue #67 lists them.
For the same reason no `count-` service exists in this scope: the five reads are all `get-`.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                             | Result                                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `GET /api/trpc/admin.dashboard.getUsersOverview` signed out       | `401 UNAUTHORIZED`, so the new key resolves and `adminProcedure` guards |
| `GET /api/trpc/admin.dashboard.getActiveSubscriptions` signed out | `401 UNAUTHORIZED`, same                                                |
| `GET /api/trpc/admin.dashboard.getMrr` signed out                 | `401 UNAUTHORIZED`, same                                                |
| `GET /api/trpc/admin.dashboard.getFeedbackOverview` signed out    | `401 UNAUTHORIZED`, same                                                |
| `GET /api/trpc/admin.dashboard.getMonthlyStats` signed out        | `401 UNAUTHORIZED`, same, with an empty input                           |
| `GET /api/trpc/admin.dashboard.users.get`                         | `404 No procedure found on path`, the old key is gone                   |
| `GET /admin` signed out                                           | `307` to `/login`, the admin layout guard is unaffected                 |
| `GET /login`                                                      | `200`                                                                   |

**Not smoked here, and why.** The `.env.local` of the sandbox holds placeholder Postgres credentials
and `sk_test_dummy`, so no card can render a real figure. Signing in as an administrator and reading
the five cards and the chart, the month-range picker on the chart, and the "—" states the null
branches produce (no churn base, no signups last month) are on the QA checklist of issue #65.

### `admin/users`, part 1 (issue #66)

Commit: `860de52`. The scope router leaves `_utils/` for the scope root and the five account
operations become services. The scope is **not** locked: issue #67 migrates the remaining
operations and adds the `migratedScopes` entry.

**Files moved.** Every one with `git mv`, so no stub is owed.

| Operation              | Before                                                                                  | After                                 |
| ---------------------- | --------------------------------------------------------------------------------------- | ------------------------------------- |
| Create User            | `_features/create-user/create-user.trpc.mutation.ts`                                    | `_services/create-user.ts`            |
| Delete User            | `[id]/_features/account/delete-user/delete-user.trpc.mutation.ts`                       | `_services/delete-user.ts`            |
| Impersonate User       | `[id]/_features/account/impersonate-user/impersonate-user.trpc.mutation.ts`             | `_services/impersonate-user.ts`       |
| Request password reset | `[id]/_features/account/request-password-reset/request-password-reset.trpc.mutation.ts` | `_services/request-password-reset.ts` |
| Revoke User sessions   | `[id]/_features/account/revoke-user-sessions/revoke-user-sessions.trpc.mutation.ts`     | `_services/revoke-user-sessions.ts`   |
| Scope router           | `admin/users/_utils/trpc-router.ts`                                                     | `admin/users/trpc-router.ts`          |

Each schema moved next to its service under the same name. The five button and dialog clients stay in
their features: only `create-user-dialog.client.tsx` changed, for the schema import path, which the
`*.schema.ts` exception of `no-client-import-of-services` allows.

**Renamed procedure keys.** None. `create`, `delete`, `impersonate`, `sessions.revoke` and
`password.requestReset` already mirror the service verbs under a router that carries the User entity,
and the acceptance criteria ask for the precise write verbs (`impersonate`, `revoke`) to be kept. No
call site changed its key, so the twelve `trpc.admin.users.*` usages are untouched.
`admin/trpc-router.ts` only changed the import path of `usersRouter`.

**Reclassified errors.** None to a different code. The seven `TRPCError` throws of these five
operations map one to one: `BAD_REQUEST "Failed to create account"` and
`BAD_REQUEST "User does not have a credential-based account"` to `BadRequestError`,
`CONFLICT "This email is already registered"` to `ConflictError`, `NOT_FOUND "User not found"` (twice)
to `NotFoundError`. Messages are unchanged, so every toast reads as before.

**Removed generic wrappers, the one deliberate behaviour change.** Five `INTERNAL_SERVER_ERROR` throws
are gone and the infrastructure error now propagates as a 500 with no rewritten message:

| Removed                                                           | Why                                                                                                                                                  |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createUser` catch-all "Failed to create user. Please try again." | Generic wrapper. The duplicate-email translation it guarded survives as `ConflictError`.                                                             |
| `impersonateUser` catch-all re-throwing `error.message`           | Generic wrapper that only re-labelled the Better Auth message as a 500.                                                                              |
| `requestPasswordReset` catch-all re-throwing `error.message`      | Same.                                                                                                                                                |
| `requestPasswordReset` `if (!response)` guard                     | Better Auth signals a failed request by throwing, so the guard was unreachable; it cannot be restated as a domain error without inventing a meaning. |
| `revokeUserSessions` `if (!result)` guard and catch-all           | Same.                                                                                                                                                |

Each of the four clients already falls back to its own copy when the message is empty ("Failed to
revoke user sessions", "Failed to impersonate this user", and so on), so the visible text of an
unexpected failure is the same or the raw infrastructure message, which step 4 masks.

**One redundant identity check removed.** `revokeUserSessions` opened with `auth.api.getSession()` and
threw `UNAUTHORIZED "Session not found"` when it came back empty. `adminProcedure` already establishes
the session and the admin role before the procedure body runs, so the check could not fire; identity
stays at the transport edge per the step's invariant. The service no longer fetches a session, which
also drops one round trip per revoke.

**Services holding a database client.** `createUser`, `deleteUser` and `requestPasswordReset` take the
trailing `db: typeof prisma = prisma` parameter: each has a domain error branch. `impersonateUser` and
`revokeUserSessions` do not query Prisma at all. All three Better-Auth services take `headers` as an
explicit parameter, resolved by the router with `await headers()`.

**Authorization.** The admin role check stays on `adminProcedure`. `deleteUser` and
`requestPasswordReset` throw their `NOT_FOUND` from the service, because the answer needs the loaded
User.

**Output types.** None owed: all five operations are mutations, and no `inferProcedureOutput` alias
pointed at them. The five aliases that remain in the scope belong to issue #67.

**Schemas.** The five plural `XInputs` aliases became singular `XInput`, burning down five
`require-schema-conventions` warnings (48 to 43). `create-user-dialog.client.tsx` is the only consumer
of one of them.

**Tests.** `create-user.test.ts` (3 cases) pins the duplicate-email translation, the propagation of an
unexpected failure now that the wrapper is gone, and the returned shape when no profile name is given.
`delete-user.test.ts` (2 cases) pins `NotFoundError` on an unknown User and the deleted identifiers.
Both drive the service through its injected client, with no tRPC context.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 29 app tests
(5 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **135 problems, 0 errors, 135
warnings** (88 `no-raw-tailwind-colors` / 43 `require-schema-conventions` / 3
`require-use-client-suffix` / 1 `schema-must-be-pure-zod`), five below the 140 of the `admin` entry;
`npx next build` compiles and still lists `/admin`, `/admin/users` and `/admin/users/[id]`. `pnpm build`
itself is refused by the sandbox, so the build was run as `npx next build` from `apps/web`, as the
`admin` entry did.

**Per-scope "must be gone" checks.** Restricted to `admin/users`, the ten commands return only paths
issue #67 owns (the seven role-suffixed modules of the `[id]` segment and the users table, their inline
Prisma and their five `inferProcedureOutput` aliases) plus the now-empty untracked
`admin/users/_utils/` folder, which the sandbox refuses to `rmdir` and which `git ls-files` shows as
holding nothing. Checks 3, 4, 5, 6, 7 and 8 return nothing at all: no service imports tRPC, none holds
a `TRPCError`, and none carries `'use server'`.

**Left for issue #67, beyond its own list.** The users table's two operations, `list`
(`get-paginated-users.ts`) and `export` (`get-all-users-for-export.ts`), are procedure modules in
`_features/users-table/` with an `inferProcedureOutput` alias each. Neither appears in the seven
operations #67 enumerates, but the scope cannot be locked while they sit there, so #67 has to take
them: nine operations, not seven.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                         | Result                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `POST /api/trpc/admin.users.create` signed out                | `401 UNAUTHORIZED`, the key resolves and `adminProcedure` guards |
| `POST /api/trpc/admin.users.delete` signed out                | `401 UNAUTHORIZED`, same                                         |
| `POST /api/trpc/admin.users.impersonate` signed out           | `401 UNAUTHORIZED`, same                                         |
| `POST /api/trpc/admin.users.sessions.revoke` signed out       | `401 UNAUTHORIZED`, same                                         |
| `POST /api/trpc/admin.users.password.requestReset` signed out | `401 UNAUTHORIZED`, same                                         |
| `GET /api/trpc/admin.users.list`, `admin.users.email.get`     | `401`, the operations issue #67 owns still resolve               |
| `POST /api/trpc/admin.users.passwordReset`                    | `404 No procedure found on path`, a key that does not exist      |
| `GET /admin/users`, `GET /admin/users/abc` signed out         | `307` to `/login`, the admin layout guard is unaffected          |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials, so no
administrator can sign in and no Better Auth call can reach a real user. Creating a user, impersonating
and stopping, revoking sessions, sending a reset link and deleting a user are on the QA checklist of
issue #66.

### `admin/users`, part 2, and the scope lock (issue #67)

Commit: `fb4a72f`. The nine operations left in the scope become services, three modules stop querying
Prisma inline, and `admin/users` is locked, which lets the `admin` entry of `migratedScopes` drop its
ignore and cover the whole tier.

**Nine operations, not seven.** Issue #67 enumerates seven. The two the users table owns, `list` and
`export`, were procedure modules in `_features/users-table/` and had to come along, exactly as the
part 1 entry predicted: the scope cannot be locked while a procedure module sits in a feature.

**Files moved.** Every one with `git mv`, so no stub is owed.

| Operation                  | Before                                                                         | After                                     |
| -------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------- |
| List Users (table)         | `_features/users-table/get-paginated-users.ts`                                 | `_services/list-users.ts`                 |
| List Users for export      | `_features/users-table/get-all-users-for-export.ts`                            | `_services/list-users-for-export.ts`      |
| Create Subscription        | `[id]/_features/subscription/create-subscription.trpc.mutation.ts`             | `_services/create-subscription.ts`        |
| Get Subscription           | `[id]/_features/subscription/get-subscription.trpc.query.ts`                   | `_services/get-subscription.ts`           |
| Update Subscription        | `[id]/_features/subscription/update-subscription.trpc.mutation.ts`             | `_services/update-subscription.ts`        |
| Subscription schema        | `[id]/_features/subscription/subscription.schema.ts`                           | `_services/create-subscription.schema.ts` |
| List User Organizations    | `[id]/_features/organization-select/get-user-organizations.trpc.query.ts`      | `_services/list-user-organizations.ts`    |
| Get User email             | `[id]/_features/user-information/email/get-user-email.trpc.query.ts`           | `_services/get-user-email.ts`             |
| Toggle email verified      | `[id]/_features/user-information/email/toggle-email-verified.trpc.mutation.ts` | `_services/toggle-email-verified.ts`      |
| Get User information (RSC) | `[id]/_features/user-information/get-user-information.server.query.ts`         | `_services/get-user-information.ts`       |

The two client-marked table modules took the `.client.tsx` suffix in the same pass
(`users-table.tsx`, `users-table-action-dropdown.tsx`), burning down two
`require-use-client-suffix` warnings. `page.tsx` follows the renamed import.

**Renamed procedure keys.** One: `export` became `listForExport`, so the key mirrors its service verb.
`users-table.client.tsx` is its only call site. Everything else keeps its key (`list`, `email.get`,
`email.toggleVerified`, `organizations.list`, `subscription.get`, `subscription.create`,
`subscription.update`), so the seven other `trpc.admin.users.*` usages are untouched.

**Renamed services.** The read vocabulary is a closed set and bans `getAllX` / `getPaginatedX`, with
`list-` as the single collection entrypoint taking an options object:

| Before                 | After                   | Why                                                     |
| ---------------------- | ----------------------- | ------------------------------------------------------- |
| `getPaginatedUsers`    | `listUsers`             | Collection read; the options object already existed     |
| `getAllUsersForExport` | `listUsersForExport`    | Same; `export-` is a write verb and this function reads |
| `getUserOrganizations` | `listUserOrganizations` | Collection read                                         |

`toggleEmailVerified` keeps its precise write verb, as the step allows for `disconnect`, `unlink`,
`revoke` and `impersonate`.

**Reclassified errors.** None. The two `TRPCError` throws of these operations map one to one:
`NOT_FOUND "Subscription not found"` and `NOT_FOUND "User not found"` become `NotFoundError` with the
same message, so both toasts read as before. No operation of this part threw `INTERNAL_SERVER_ERROR`,
so nothing was triaged and no generic wrapper was removed.

**Services holding a database client.** `updateSubscription` and `toggleEmailVerified` take the
trailing `db: typeof prisma = prisma` parameter: each loads its resource to decide whether to throw
`NotFoundError`. The seven pass-through reads and `createSubscription` do not.

**Authorization.** Unchanged: the admin role check stays on `adminProcedure`, and the two not-found
denials live in the services because they need the loaded resource.

**Output types.** The five `inferProcedureOutput` aliases of the scope are gone, replaced by
`<Service>Output` exported from the service (`ListUsersOutput`, `ListUsersForExportOutput`,
`GetSubscriptionOutput`, `GetUserEmailOutput`, `ListUserOrganizationsOutput`). The two client consumers
(`users-table.client.tsx`, `subscription-edit-dialog.client.tsx`) import them as `import type`, which is
what `no-client-import-of-services` allows. `GetUserInformationOutput` already derived from its
function and only changed path.

**Schemas.** `subscription.schema.ts` split in two: `create-subscription.schema.ts` keeps
`CreateSubscriptionSchema`, and `update-subscription.schema.ts` derives `UpdateSubscriptionSchema` from
it with `.omit()` + `.extend()`, the create-to-update composition the convention prescribes. The two
plural `XInputs` aliases became singular `XInput`, and the six inline procedure inputs became their own
`*.schema.ts` next to their service. `list-users.schema.ts` also exports `ListUsersValues`, since `page`
and `pageSize` carry a `.default()`.

**The one impure schema.** `create-subscription.schema.ts` still imports `SubscriptionPlanName` and
`SubscriptionStatus` from `@/server/auth/config/subscription-plans`, behind a file-level
`eslint-disable local/schema-must-be-pure-zod` whose justification points at step 5, which relocates the
plan configuration. The disable needs a companion: `schema-must-be-pure-zod` is agent-gated, so outside
`ESLINT_AGENT_RULES=1` the directive reads as unused and `pnpm lint` fails on it at `--max-warnings 0`.
The shared config therefore carries a one-file block setting `linterOptions.reportUnusedDisableDirectives`
to `off` for that path. **Both the suppression and that block are deleted when the enums move in step 5.**

**Inline Prisma removed, three modules.** The ticket lists one (the `[id]` page). Two more sat in the
scope and blocked the lock, since check 9 covers every `.ts`/`.tsx` outside `_services/`:

| Module                                                             | Now calls                      |
| ------------------------------------------------------------------ | ------------------------------ |
| `[id]/page.tsx` (page title)                                       | `findUserName`                 |
| `[id]/_features/account/account-card.server.tsx`                   | `getUserAccount`               |
| `[id]/_features/user-information/user-information-card.server.tsx` | the moved `getUserInformation` |

`getUserAccount` returns the email and a `hasCredentialProvider` flag rather than the raw account rows,
so the card keeps its "only credential accounts can reset a password" rule without knowing the schema.

**Tests.** `update-subscription.test.ts` and `toggle-email-verified.test.ts`, two cases each, pin the
`NotFoundError` and the returned shape through the injected client, with no tRPC context. The step only
requires a test for a reclassified error and there is none here; these are cheap insurance on the two
services that grew a client parameter.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 33 app tests
(4 new) plus the ESLint rule and config tests (182, including the 11 `migratedScopes` ones);
`pnpm lint:agent-rules` **130 problems, 0 errors, 130 warnings** (88 `no-raw-tailwind-colors` / 41
`require-schema-conventions` / 1 `require-use-client-suffix`), five below the 135 of part 1;
`npx next build` compiles and still lists `/admin`, `/admin/users` and `/admin/users/[id]`. `pnpm build`
is refused by the sandbox, so the build ran as `npx next build` from `apps/web`.

The burn-down of this entry: two `require-use-client-suffix` (the table modules), two
`require-schema-conventions` (the plural aliases) and the single `schema-must-be-pure-zod` warning,
which the suppression retires rather than fixes.

**Per-scope "must be gone" checks.** Restricted to `admin/users`, the ten commands return nothing, with
one exception: check 2 still lists the empty, untracked `admin/users/_utils/` folder, which the sandbox
refuses to `rmdir` and in which `git ls-files` shows no file. Deleting the folder is on the maintainer's
side, like the `_deprecated_` stubs of issue #81.

**Scope lock.** `migratedScopes` no longer needs a separate `admin/users` entry: the `admin` entry drops
its `ignores` and covers the tier. The nine rules are at `error` for everything under `admin`, and the
agent-rules run reports zero errors.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                   | Result                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `GET /api/trpc/admin.users.list` signed out                             | `401 UNAUTHORIZED`, the key resolves                    |
| `GET /api/trpc/admin.users.listForExport` signed out                    | `401 UNAUTHORIZED`, the renamed key resolves            |
| `GET /api/trpc/admin.users.export` signed out                           | `404 No procedure found on path`, the old key is gone   |
| `GET /api/trpc/admin.users.email.get`, `admin.users.organizations.list` | `401 UNAUTHORIZED`, both keys resolve                   |
| `GET /api/trpc/admin.users.subscription.get`                            | `401 UNAUTHORIZED`, same                                |
| `POST /api/trpc/admin.users.subscription.create`, `.update`             | `401 UNAUTHORIZED`, same                                |
| `POST /api/trpc/admin.users.email.toggleVerified`                       | `401 UNAUTHORIZED`, same                                |
| `POST /api/trpc/admin.users.create` (part 1 operation)                  | `401 UNAUTHORIZED`, the locked scope did not regress    |
| `GET /admin/users`, `GET /admin/users/abc` signed out                   | `307` to `/login`, the admin layout guard is unaffected |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials, so no
administrator can sign in and no screen can render its data. Reading the users table with its search,
sorting and CSV export, opening a user detail, creating and editing a Subscription, toggling the email
verified flag and reading the account card are on the QA checklist of issue #67.

**Anomaly, not fixed.** The scope's UI copy is partly French ("Utilisateurs" as the page title, "Compte
utilisateur" as the account card title), against the English-only rule. No step 3 ticket owns user-facing
copy and the step is behaviour-preserving, so the strings are left as they are.

### `(authenticated)/account`, part 1: billing (issue #68)

Commit: `2b14b18`. The scope router leaves `_utils/` for the scope root and the four billing
operations become services.
The scope is **not** locked: issue #69 migrates the six settings operations and adds the
`migratedScopes` entry.

**Files moved.**

| Operation           | Before                                                                         | After                                               |
| ------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| Billing portal      | `billing/_features/manage-subscription/create-billing-portal.trpc.mutation.ts` | `billing/_services/create-billing-portal.ts`        |
| Past invoices       | `billing/_features/past-invoices/get-past-invoices.trpc.query.ts`              | `billing/_services/list-past-invoices.ts`           |
| Subscription status | `billing/_features/subscription-status/get-subscription-status.trpc.query.ts`  | `billing/_services/get-subscription-status.ts`      |
| Scope router        | `account/_utils/trpc-router.ts`                                                | `account/trpc-router.ts`                            |
| Active Subscription | `billing/_features/current-plan/get-active-subscription.trpc.query.ts`         | dissolved, `_deprecated_get-active-subscription.ts` |

Every surviving file moved with `git mv`. Services live in `billing/_services/`, next to the segment's
UI, while the procedures are inlined in the scope-root `account/trpc-router.ts`: the account scope has
ten operations in total, so its API surface stays readable in one file and no segment router is
introduced.

**The one dissolved file.** `get-active-subscription.trpc.query.ts` held a procedure and a generic
`INTERNAL_SERVER_ERROR` wrapper around a single call to the Subscription domain's
`getActiveSubscription({ headers })` service. With the wrapper gone nothing was left to move, so the
procedure calls the domain service directly and the file is a `_deprecated_get-active-subscription.ts`
stub for the maintainer to delete (issue #81's pass). A route reaching into a domain's internals is the
established pattern here, as `(authenticated)/layout.tsx` does with `hasCompletedOnboarding`. Writing a
second `getActiveSubscription` in the billing segment would have duplicated the domain's own read: the
billing segment displays the active Subscription, it does not own it.

**Renamed procedure keys.** One: `billing.subscription.status` to `billing.subscription.getStatus`, so
the key mirrors `getSubscriptionStatus` instead of naming a noun. Its single call site,
`subscription-status-banner.client.tsx`, follows. `billing.subscription.get`, `billing.invoices.list`
and `billing.portal.create` are unchanged: each is already the verb of its service under a router that
carries the noun, so `current-plan-card.client.tsx`, `past-invoices-card.client.tsx` and
`manage-subscription-button.client.tsx` keep their paths.

**Renamed service.** `getPastInvoices` to `listPastInvoices`: it returns a collection, and `list-` is
the read verb the closed vocabulary forces. The procedure key `invoices.list` already said so.

**Reclassified errors.** None to a different code. The one `FORBIDDEN` of the segment,
`createBillingPortal`'s "You do not have an active organization", became a `ForbiddenError` with the
same message. It sits in the service because the answer needs the loaded Organization: the session
alone does not carry it, the Better Auth `getFullOrganization` call does.

**Removed generic wrappers, the deliberate behaviour change.** Four wrappers are gone and the
infrastructure error now propagates as a 500 with no rewritten message:

| Removed                                                                                                                | Why                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `getActiveSubscription` catch-all "Failed to fetch active subscription"                                                | Generic wrapper. The domain service catches its own failure and returns `null`, so the wrapper was close to unreachable. |
| `getSubscriptionStatus` catch-all "Failed to fetch subscription status"                                                | Generic wrapper around two Better Auth calls.                                                                            |
| `listPastInvoices` catch-all "Failed to retrieve invoices."                                                            | Generic wrapper. The `tryCatch` and immediate re-throw around the Stripe list call went with it: it only re-threw.       |
| `createBillingPortal` catch-all `new Error("An error occurred while accessing the billing portal. Please try again.")` | Generic wrapper, and a bare `Error` that `services-no-bare-error` forbids in a service.                                  |

The three query wrappers are invisible to the user: the two cards render their own copy on an error
("An error occurred while loading your plan", "An error occurred while loading your invoices") and the
status banner renders nothing at all. The fourth is the one visible change of this ticket: the "Manage
subscription" toast shows `error.message`, so a portal failure now reads as the raw infrastructure
message instead of "An error occurred while accessing the billing portal. Please try again."
Reclassifying it was rejected: the catch-all covers any Better Auth or Stripe failure, so no domain
code is accurate for it. Step 4 masks 500 messages behind a generic copy, which restores a stable
sentence; until then this is exactly the "meaningful copy still thrown as a 500" the step 4 debt note
is about.

**Services holding a database client.** None. `listPastInvoices` is the only service of the segment
that queries Prisma and it is a pass-through read with no authorization check and no domain error
branch, so it takes no trailing client. `createBillingPortal` has a domain error branch but never
touches Prisma, like `impersonateUser` in `admin/users`. All three services take `headers` explicitly,
resolved by the router with `await headers()`; none receives the tRPC context, and `listPastInvoices`
imports `prisma` directly instead of reading it from `ctx`.

**Authorization.** Identity stays on `protectedProcedure`. The `ForbiddenError` above is the only
authorization fact in the segment and it lives in the service that loads the Organization.

**Output types.** The three `inferProcedureOutput` aliases of the segment are gone.
`GetSubscriptionStatusOutput` and `ListPastInvoicesOutput` are now derived from their services,
`CreateBillingPortalOutput` is not owed (a write), and `GetActiveSubscriptionOutput` already exists on
the domain service. No file imported any of the three, so no consumer changed.

**Schemas.** None: the four operations take no input.

**Tests.** `create-billing-portal.test.ts` (3 cases) pins the `ForbiddenError` when the session has no
active Organization, the portal call's `referenceId`, `returnUrl` and `customerType`, and the
propagation of an unexpected portal failure now that the wrapper is gone. Better Auth is mocked and no
tRPC context is built.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 36 app tests
(3 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **130 problems, 0 errors, 130
warnings** (88 `no-raw-tailwind-colors` / 41 `require-schema-conventions` / 1
`require-use-client-suffix`), flat against the 130 of `admin/users` part 2 because the billing segment
holds no schema and no mis-suffixed client file. `npx next build` compiles and still lists `/account`,
`/account/billing` and `/account/settings`. `pnpm build` itself is refused by the sandbox, so the build
was run as `npx next build` from `apps/web`, as the earlier entries did.

**Per-scope "must be gone" checks.** Restricted to `(authenticated)/account`, checks 3, 4, 5, 6, 7 and
8 return nothing: no service imports tRPC, none holds a `TRPCError`, none carries `'use server'`, and
no router sits in a bucket or a feature. Checks 1, 9 and 10 return only the six settings modules issue
#69 owns, with their inline Prisma and their `inferProcedureOutput` aliases. Check 2 returns the
now-empty untracked `account/_utils/` folder: `git ls-files` shows it holding nothing and the sandbox
refuses `rmdir`, so it is the maintainer's to remove, like the `admin/users/_utils/` one.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                  | Result                                                               |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `GET /api/trpc/authenticated.account.billing.subscription.get`         | `401 UNAUTHORIZED`, the key resolves and `protectedProcedure` guards |
| `GET /api/trpc/authenticated.account.billing.subscription.getStatus`   | `401 UNAUTHORIZED`, the renamed key resolves                         |
| `GET /api/trpc/authenticated.account.billing.invoices.list`            | `401 UNAUTHORIZED`, same                                             |
| `POST /api/trpc/authenticated.account.billing.portal.create`           | `401 UNAUTHORIZED`, same                                             |
| `GET /api/trpc/authenticated.account.billing.subscription.status`      | `404 No procedure found on path`, the old key is gone                |
| `GET /api/trpc/authenticated.account.profile.get`, `account.email.get` | `401`, the settings operations issue #69 owns still resolve          |
| `GET /account/billing` signed out                                      | `307` to `/login`, the page guard is unaffected                      |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials and no
Stripe account, so no user can sign in and no billing screen can render its data. Reading the billing
page on a free and on a paid plan, opening the billing portal, listing invoices and seeing the trial or
cancellation banner are on the QA checklist of issue #68.

### `(authenticated)/account`, part 2: settings, and the scope lock (issue #69)

Commit: `6012c44`. The six settings operations become services and the scope is **locked**:
`migratedScopes` gains `"(authenticated)/account"`, so the step's nine rules report at `error` for
the whole scope, billing included.

**Files moved.** Ten modules, all with `git mv`, from `settings/_features/*` to
`settings/_services/`. No file dissolved, so this segment leaves no `_deprecated_` stub.

| Operation       | Before                                                                | After                                |
| --------------- | --------------------------------------------------------------------- | ------------------------------------ |
| Account removal | `_features/account-deletion/delete-account.trpc.mutation.ts`          | `_services/delete-account.ts`        |
| Current email   | `_features/email/get-current-email.trpc.query.ts`                     | `_services/get-current-email.ts`     |
| Password        | `_features/password/change-password.trpc.mutation.ts`                 | `_services/update-password.ts`       |
| Profile read    | `_features/profile/get-profile.trpc.query.ts`                         | `_services/get-profile.ts`           |
| Profile write   | `_features/profile/update-profile.trpc.mutation.ts`                   | `_services/update-profile.ts`        |
| Avatar          | `_features/profile/update-avatar.trpc.mutation.ts`                    | `_services/update-avatar.ts`         |
| Schemas         | `delete-account`, `change-email`, `change-password`, `update-profile` | the same four, next to their service |

The four feature folders keep their client components; only the operations and their schemas left.

**Renamed service and procedure key.** One of each, and they are the same operation:
`changePassword` becomes `updatePassword`, because `change-` is one of the four banned `update`
synonyms that `services-verb-prefix` rejects, and the key `password.change` follows as
`password.update`. Its single call site is `password-form.client.tsx`. The other five keys are
unchanged: `delete`, `profile.get`, `profile.update`, `profile.updateAvatar` and `email.get` each
already mirror their service verb under a router that carries the noun. `email.get` reads
`getCurrentEmail`: "current" qualifies the address, it is not a second entity, so the key stays the
plain verb rather than becoming `email.getCurrent`.

**Schemas.** The four plural `*Inputs` aliases become singular `*Input`, which is what
`require-schema-conventions` demands once the scope is locked, and `ChangePasswordSchema` follows
its service to `UpdatePasswordSchema`. `change-email.schema.ts` moves to `_services/` with the
others even though it has no service: the email change itself is a Better Auth call made from the
client, and the bucket set puts every `*.schema.ts` in `_services/`. `send-feedback.schema.ts` in
the `(authenticated)` shell is the same case and the same placement. A client file importing a
schema from `_services/` is the documented exception to `no-client-import-of-services`, so the four
forms lint clean.

**Better Auth translation, split by who can answer.** Two services call Better Auth
(`deleteAccount`, `updatePassword`) and both had a message-matching chain ending in a generic 500.
The chain is not centralised in this step; it is placed by who can answer the failure:

| Branch                                                            | Where it lives now                                        |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| `deleteAccount` OAuth / provider, "Please contact support…"       | `BadRequestError` in the service, same code, same message |
| `deleteAccount` wrong password, "Password is incorrect."          | `UNAUTHORIZED` in the procedure                           |
| `deleteAccount` lost session, "Your session has expired…"         | `UNAUTHORIZED` in the procedure                           |
| `updatePassword` wrong password, "Current password is incorrect." | `UNAUTHORIZED` in the procedure                           |
| `updatePassword` lost session, "You must be signed in"            | `UNAUTHORIZED` in the procedure                           |

`UNAUTHORIZED` is absent from the vocabulary on purpose (identity is answered at the transport
edge), which is the same split `_domains/auth` made for sign-in and password reset. The two
procedures keep their own copies of the matching because the messages differ per operation, and
`deleteAccount` matches "password" while `updatePassword` does not.

`deleteAccount` re-tests the identity terms itself before its OAuth branch. That is not a
duplicated rule: the original chain answered the password and the session **before** the provider,
so a message mentioning both had to keep resolving to the identity answer. The guard preserves that
precedence now that the two halves live in different files, and a unit test pins it.

**Removed generic wrappers, the deliberate behaviour change.** Two, both of them user-visible:

| Removed                                                            | What a user sees instead                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `deleteAccount` 500 "An error occurred while deleting the account" | The raw infrastructure message in the confirmation dialog's alert |
| `updatePassword` 500 "An error occurred while changing password"   | The raw infrastructure message in the password form's alert       |

Both forms render `error.message` in their root alert, so an unexpected Better Auth or database
failure now reads as its own message. This is the same "meaningful copy still thrown as a 500" the
step 4 debt note covers: the masking of step 4 restores a stable generic sentence. Neither was
reclassified, because a catch-all over every Better Auth failure has no accurate domain code.

**Reclassified errors.** None. `deleteAccount`'s `BAD_REQUEST` and `getCurrentEmail`'s `NOT_FOUND`
became the domain subclass of the same code with the same message.

**Three vestigial identity checks dropped.** `getCurrentEmail`, `getProfile` and `updateProfile`
each opened with `if (!userId) throw UNAUTHORIZED "You must be signed in"` against
`ctx.session.user.id`. `protectedProcedure` establishes the session before the body runs and a
service now receives `userId` as a plain value, so the check could not fire. Same call as
`revokeUserSessions` in `admin/users`. `updatePassword`'s session branch keeps the same sentence for
the case that can still happen: Better Auth rejecting the session mid-request.

**Services holding a database client.** One: `getCurrentEmail`, which holds the `NotFoundError`
branch. `getProfile`, `updateProfile` and `updateAvatar` are pass-throughs with no authorization
check and no domain error branch, so they take no trailing client; they import `prisma` directly
instead of reading it from `ctx`. `deleteAccount` and `updatePassword` never touch Prisma and take
`headers` explicitly, resolved by the router with `await headers()`. No service receives the tRPC
context or the session.

**Authorization.** Nothing beyond identity. Every operation acts on the caller's own User, so
`protectedProcedure` answers the whole question and no `ForbiddenError` is needed.

**Output types.** The six `inferProcedureOutput` aliases of the segment are gone. The two reads
export `GetCurrentEmailOutput` and `GetProfileOutput` derived from their services; the four writes
owe none. No file imported any of the six, so no consumer changed.

**Tests.** `delete-account.test.ts` (4 cases) pins the `BadRequestError` for a provider account, the
preserved precedence of an identity failure that also mentions a provider, the propagation of an
unexpected failure now that the wrapper is gone, and the body passed to Better Auth.
`get-current-email.test.ts` (2 cases) pins the `NotFoundError` and the returned shape through the
trailing client. Better Auth is mocked and no tRPC context is built.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 42 app
tests (6 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **126 problems, 0
errors, 126 warnings** (88 `no-raw-tailwind-colors` / 37 `require-schema-conventions` / 1
`require-use-client-suffix`), down 4 from the 130 of part 1, the four being the plural `Inputs`
aliases this ticket renamed. Zero errors with the scope locked is what makes the lock real.
`npx next build` compiles and still lists `/account`, `/account/billing` and `/account/settings`;
`pnpm build` is refused by the sandbox, as the earlier entries record.

**Per-scope "must be gone" checks.** Restricted to `(authenticated)/account`, checks 1 and 3 to 10
all return nothing: no role-suffixed file, no router in a bucket or a feature, no service importing
tRPC or holding a `TRPCError`, no `'use server'`, no `prisma.` outside `_services/` and no
`inferProcedureOutput` left in the scope. Check 2 still returns the empty untracked
`account/_utils/` folder: `git ls-files` shows it holding nothing and the sandbox refuses `rmdir`,
so it stays the maintainer's to remove, like the `admin/users/_utils/` one.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                          | Result                                                               |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| `POST /api/trpc/authenticated.account.password.update`         | `401 UNAUTHORIZED`, the renamed key resolves                         |
| `POST /api/trpc/authenticated.account.password.change`         | `404 No procedure found on path`, the old key is gone                |
| `POST /api/trpc/authenticated.account.delete`                  | `401 UNAUTHORIZED`, the key resolves and `protectedProcedure` guards |
| `POST /api/trpc/authenticated.account.profile.update`          | `401 UNAUTHORIZED`, same                                             |
| `POST /api/trpc/authenticated.account.profile.updateAvatar`    | `401 UNAUTHORIZED`, same                                             |
| `GET /api/trpc/authenticated.account.profile.get`, `email.get` | `401 UNAUTHORIZED`, both reads resolve                               |
| `GET /api/trpc/authenticated.account.billing.invoices.list`    | `401 UNAUTHORIZED`, part 1 is unaffected by the lock                 |
| `GET /account/settings` signed out                             | `307` to `/login`, the page guard is unchanged                       |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials and no
mail or storage provider, so no user can sign in and none of the four forms can be rendered with
data. Updating the profile, uploading an avatar, changing the password with a wrong current
password, requesting an email change and deleting an account are on the QA checklist of issue #69.

### `(authenticated)/organization`, part 1: general, leave, received invitations (issue #70)

Commit: `723c7c1`. The scope router leaves `_utils/` for the scope root and the seven operations of
the general tab, the leave action and the received-invitations segment become services. The scope is
**not** locked: issue #71 owns the five member operations and the `migratedScopes` entry.

**Files moved.** Twelve modules, all with `git mv`. No file dissolved, so this segment leaves no
`_deprecated_` stub.

| Operation            | Before                                                             | After                                                |
| -------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Scope router         | `_utils/trpc-router.ts`                                            | `trpc-router.ts`                                     |
| Organization details | `_features/general/get-organization-details.trpc.query.ts`         | `_services/get-organization-details.ts`              |
| Organization update  | `_features/general/update-organization.trpc.mutation.ts`           | `_services/update-organization.ts`                   |
| Logo update          | `_features/general/update-organization-logo.trpc.mutation.ts`      | `_services/update-organization-logo.ts`              |
| Leave                | `_features/leave-organization/leave-organization.trpc.mutation.ts` | `_services/leave-organization.ts`                    |
| Received invitations | `invitations/_features/get-received-invitations.trpc.query.ts`     | `invitations/_services/list-received-invitations.ts` |
| Accept invitation    | `invitations/_features/accept-invitation/*.trpc.mutation.ts`       | `invitations/_services/accept-invitation.ts`         |
| Reject invitation    | `invitations/_features/reject-invitation/*.trpc.mutation.ts`       | `invitations/_services/reject-invitation.ts`         |
| Schemas              | `update-organization`, `leave-organization`, accept, reject        | the same four, next to their service                 |

The three feature folders keep their client components; only the operations and their schemas left.
Services follow the route tree: the four scope-level operations sit in `organization/_services/`, the
three received-invitation ones in `organization/invitations/_services/`, while every procedure stays
inlined in the single scope-root router, as the account scope did for its two segments.

**Renamed service and procedure key.** One of each, and they are the same operation:
`getReceivedInvitations` becomes `listReceivedInvitations`, because it returns a collection and
`list-` is the read verb the closed vocabulary forces, the same call as `listPastInvoices` in the
billing segment. The key `invitation.getReceived` follows as `invitation.listReceived`, and its three
call sites are `received-invitations-list.client.tsx` plus the accept and reject buttons, which
invalidate it. The other six keys are unchanged: `get`, `update`, `updateLogo`, `leave`,
`invitation.accept` and `invitation.reject` each already mirror their service verb under a router
that carries the noun.

**`updateOrganizationLogo` keeps its name.** The service only purges the replaced object from
storage: the Better Auth `organization.update` call that writes the new key runs in
`organization-logo-upload.client.tsx`, after the upload. `update-` is therefore accurate for the
server-side half of a logo update, the verb rule accepts it, and renaming it would move a key for no
gain. The client still calls the mutation `deleteOldLogo` locally, which is what it does from there.

**Authorization, all of it in the services.** Every denial of this segment needs a loaded membership,
so none of them could stay at the transport edge:

| Denial                                                  | Where it lives now                           |
| ------------------------------------------------------- | -------------------------------------------- |
| "You do not have access to this organization."          | `ForbiddenError` in `getOrganizationDetails` |
| "You do not have permission to edit this organization." | `ForbiddenError` in `updateOrganization`     |
| The same sentence on the logo                           | `ForbiddenError` in `updateOrganizationLogo` |
| "Organization not found."                               | `NotFoundError` in `getOrganizationDetails`  |
| "You are not a member of this organization."            | `NotFoundError` in `leaveOrganization`       |
| "The owner cannot leave the organization. Transfer …"   | `ForbiddenError` in `leaveOrganization`      |

Same codes, same messages. No `UNAUTHORIZED`, no rate limit and no plan limit is involved, so nothing
moved into a procedure and `protectedProcedure` answers the identity question alone. The owner denial
is the one business rule of the segment: it reads the role of the membership the service has just
loaded, which is why it is a service branch rather than a middleware.

**Better Auth translation, moved unchanged.** `acceptInvitation` and `rejectInvitation` are pure
Better Auth calls. Their `BAD_REQUEST` branch becomes a `BadRequestError` carrying Better Auth's own
message, which is the copy the toast already showed for an expired, already answered or foreign
invitation. The chain is not centralised in this step. Both take `headers` explicitly, resolved by
the router with `await headers()`, so neither reads the tRPC context.

**Removed generic wrappers.** Two, one per invitation service: the
`INTERNAL_SERVER_ERROR "Error accepting invitation."` and its rejecting twin only fired when Better
Auth threw a non-`Error` value. That branch is gone and the thrown value propagates, so an
infrastructure surprise reads as itself rather than as a sentence about invitations. Neither was
user-visible in practice: every Better Auth failure arrives as an `Error` and takes the
`BadRequestError` path.

**Reclassified errors.** None. Every `TRPCError` of the segment became the domain subclass of the
same code with the same message, so no toast and no form error changes wording.

**Services holding a database client.** Four: `getOrganizationDetails`, `updateOrganization`,
`updateOrganizationLogo` and `leaveOrganization`, each of which holds an authorization check or a
domain error branch. `listReceivedInvitations` is a pass-through read and takes none; it imports
`prisma` directly instead of reading it from `ctx`. `acceptInvitation` and `rejectInvitation` never
touch Prisma. No service receives the tRPC context or the session: the router passes `userId`,
`email`, `organizationId` and `headers` as plain values.

**Output types.** The seven `inferProcedureOutput` aliases of the segment are gone. The two reads
export `GetOrganizationDetailsOutput` and `ListReceivedInvitationsOutput` derived from their
services; the five writes owe none. No file imported any of the seven, so no consumer changed beyond
the renamed key.

**Schemas.** The four plural `*Inputs` aliases become singular `*Input`, which is what
`require-schema-conventions` demands once issue #71 locks the scope. The two procedures that declared
their input inline gain a schema file next to their service, `get-organization-details.schema.ts` and
`update-organization-logo.schema.ts`. `update-organization-form.client.tsx` follows the schema to
`_services/` with a type-name change, which is the documented exception to
`no-client-import-of-services`.

**Debt noted, not fixed.** `UpdateOrganizationSchema` keeps the French validation message "Le nom est
requis", exactly as `CreateOrganizationSchema` does in `_domains/organization`. It is UI copy, not
placement, and it belongs to the same ticket as the other French strings recorded in the anomalies
section.

**Tests.** `leave-organization.test.ts` (3 cases) pins the `NotFoundError` for a non-member, the
`ForbiddenError` for the owner and the membership deletion for a plain member, through the trailing
client. No tRPC context is built. The other six services are behaviour-preserving moves with no
reclassified error, so the step's policy leaves them untested.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 45 app tests
(3 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **122 problems, 0 errors, 122
warnings** (88 `no-raw-tailwind-colors` / 33 `require-schema-conventions` / 1
`require-use-client-suffix`), down 4 from the 126 of the account scope, the four being the plural
`Inputs` aliases this ticket renamed. `npx next build` compiles and still lists `/organization` and
`/organization/invitations`; `pnpm build` is refused by the sandbox, as the earlier entries record.

**Per-scope "must be gone" checks.** Restricted to `(authenticated)/organization`, checks 3 to 8
return nothing: no service imports tRPC, none holds a `TRPCError`, none carries `'use server'`, and
no router sits in a bucket or a feature. Checks 1, 9 and 10 return only the five member modules issue
#71 owns, with their inline Prisma and their `inferProcedureOutput` aliases. Check 2 returns the
now-empty untracked `organization/_utils/` folder: `git ls-files` shows it holding nothing and the
sandbox refuses `rmdir`, so it stays the maintainer's to remove, like the `account/_utils/` and
`admin/users/_utils/` ones.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                   | Result                                                               |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `GET /api/trpc/authenticated.organization.get`                          | `401 UNAUTHORIZED`, the key resolves and `protectedProcedure` guards |
| `GET /api/trpc/authenticated.organization.invitation.listReceived`      | `401 UNAUTHORIZED`, the renamed key resolves                         |
| `GET /api/trpc/authenticated.organization.invitation.getReceived`       | `404 No procedure found on path`, the old key is gone                |
| `POST /api/trpc/authenticated.organization.update`, `updateLogo`        | `401 UNAUTHORIZED`, both resolve                                     |
| `POST /api/trpc/authenticated.organization.leave`                       | `401 UNAUTHORIZED`, same                                             |
| `POST /api/trpc/authenticated.organization.invitation.accept`, `reject` | `401 UNAUTHORIZED`, both resolve                                     |
| `invitation.create`, `invitation.get`, `invitation.delete`              | `401 UNAUTHORIZED`, the member keys issue #71 owns still resolve     |
| `member.updateRole`, `member.delete`                                    | `401 UNAUTHORIZED`, same                                             |
| `GET /organization`, `/organization/invitations` signed out             | `307` to `/login`, both page guards are unchanged                    |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials and no
mail or storage provider, so no user can sign in, no Organization can be rendered and no invitation
can be issued. Renaming the Organization, changing the logo, accepting and rejecting an invitation
and leaving an Organization as a plain member and as the owner are on the QA checklist of issue #70.

### `(authenticated)/organization`, part 2: members, and the scope lock (issue #71)

Commit: `b21a3cb`. The five member operations become services and the scope is **locked**:
`migratedScopes` gains `"(authenticated)/organization"`, so the step's nine rules report at
`error` for the whole scope, part 1 included.

**Files moved.** Ten modules, all with `git mv`, from `_features/members/*` to `_services/`. No
file dissolved, so this segment leaves no `_deprecated_` stub.

| Operation        | Before                                                                   | After                                |
| ---------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| Invite a member  | `_features/members/create-invitation/create-invitation.trpc.mutation.ts` | `_services/create-invitation.ts`     |
| Pending list     | `_features/members/get-invitations.trpc.query.ts`                        | `_services/list-invitations.ts`      |
| Cancel an invite | `_features/members/delete-invitation/delete-invitation.trpc.mutation.ts` | `_services/delete-invitation.ts`     |
| Remove a member  | `_features/members/delete/delete-member.trpc.mutation.ts`                | `_services/delete-member.ts`         |
| Change a role    | `_features/members/update-role/update-member-role.trpc.mutation.ts`      | `_services/update-member-role.ts`    |
| Schemas          | the five, next to their procedure                                        | the same five, next to their service |

The `members` feature keeps its five client components, `invite-member-dialog.client.tsx`
included. Three of its operation subfolders (`delete/`, `delete-invitation/`, `update-role/`) are
now empty, like `organization/_utils/`.

**Renamed service and procedure key.** One of each, and they are the same operation:
`getInvitations` becomes `listInvitations` and the key `invitation.get` becomes `invitation.list`.
It returns a collection and `list-` is the read verb the closed vocabulary forces, the same call
`invitation.getReceived` to `invitation.listReceived` made in part 1. Its three call sites follow:
the members tab's `queryOptions`, and the `queryFilter` of the cancel dropdown and of the invite
dialog. The other four keys (`invitation.create`, `invitation.delete`, `member.updateRole`,
`member.delete`) already mirror their service verb under a router that carries the noun.

**A verb deliberately left alone.** `deleteInvitation` marks the Invitation `canceled` rather than
deleting the row, and the button reads "Cancel invitation", so `cancelInvitation` would read more
precisely. Neither this ticket nor the step 3 spec lists that rename, and a procedure key rename is
a behaviour change with call sites; it stays `delete` and is written down here instead.

**Authorization, all of it in the services.** Seven denials, every one of them needing a loaded
Member, Invitation or membership, so every one moved into the service that loads it. Same codes,
same messages.

| Service            | Denials now in the service                                                                                           |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `createInvitation` | `ForbiddenError` "You do not have permission to invite members."                                                     |
| `listInvitations`  | `ForbiddenError` "You do not have permission to view invitations."                                                   |
| `deleteInvitation` | `NotFoundError` "Invitation not found." and `ForbiddenError` for a caller who is not owner or admin                  |
| `deleteMember`     | `NotFoundError` "Member not found.", `ForbiddenError` for the caller's role, `ForbiddenError` for removing the owner |
| `updateMemberRole` | `NotFoundError` "Member not found." and `ForbiddenError` "Only the owner can change member roles."                   |

The one check that stayed at the transport edge is the seat limit: `invitation.create` keeps
`planAwareProcedure.use(enforceLimit("seats"))`, because a plan limit is answered by the context
alone and has no domain-error equivalent. That is the same placement the `(authenticated)` shell
made for `createProject` and its `projects` limit.

**Removed generic wrapper, the deliberate behaviour change.** One. `createInvitation`'s
`INTERNAL_SERVER_ERROR` "Error sending invitation." sat under a branch that already translated
every `Error` into a `BAD_REQUEST`, so it could only fire on a non-`Error` throw. It is gone and
the value propagates untouched; the invite dialog still falls back to the same sentence when a
message is empty, so the copy a user sees is unchanged in practice. No error is reclassified, which
is why no service of this segment owes a reclassification test.

**Better Auth.** `createInvitation` is the only caller here. Its try/catch moves unchanged:
`BadRequestError` carrying Better Auth's own message, which is the copy the dialog's root alert
shows. The service takes `headers` explicitly, resolved by the router with `await headers()`, the
same value the tRPC context carries.

**Services holding a database client.** All five, each holding an authorization check. None
receives the tRPC context or the session: the router passes `userId`, `organizationId`, `memberId`,
`invitationId`, `role` and `headers` as plain values, and the services import `prisma` directly
instead of reading it from `ctx`.

**Output types.** The five `inferProcedureOutput` aliases of the segment are gone, and the scope
now has none. The single read exports `ListInvitationsOutput`; the four writes owe none. No file
imported any of the five, so no consumer changed beyond the renamed key.

**Schemas.** The five plural `*Inputs` aliases become singular `*Input`, which is what
`require-schema-conventions` demands now that the scope is locked, and `GetInvitationsSchema`
follows its service to `ListInvitationsSchema`. `member-actions-dropdown.client.tsx` follows
`UpdateMemberRoleInput` to `_services/`, which is the documented exception to
`no-client-import-of-services`.

**Tests.** `delete-member.test.ts` (4 cases) pins the `NotFoundError` for an unknown Member, the
`ForbiddenError` for a caller who is neither owner nor admin, the `ForbiddenError` for removing the
owner and the deletion for a plain member. `create-invitation.test.ts` (3 cases) pins the
`ForbiddenError` before Better Auth is ever called, the `BadRequestError` carrying Better Auth's
message, and the body and headers passed through on success. Both drive the trailing client; no
tRPC context is built. The other three services are behaviour-preserving moves whose denials are
the same shape as `deleteMember`'s, so the step's policy leaves them untested.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 52 app
tests (7 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **117 problems, 0
errors, 117 warnings** (88 `no-raw-tailwind-colors` / 28 `require-schema-conventions` / 1
`require-use-client-suffix`), down 5 from the 122 of part 1, the five being the plural `Inputs`
aliases this ticket renamed. Zero errors with the scope locked is what makes the lock real.
`npx next build` compiles and still lists `/organization` and `/organization/invitations`;
`pnpm build` is refused by the sandbox, as the earlier entries record.

**Per-scope "must be gone" checks.** Restricted to `(authenticated)/organization`, checks 1 and 3
to 10 all return nothing: no role-suffixed file, no router in a bucket or a feature, no service
importing tRPC or holding a `TRPCError`, no `'use server'`, no `prisma.` outside `_services/` and
no `inferProcedureOutput` left in the scope. Check 2 still returns the empty untracked
`organization/_utils/` folder, joined by the three empty operation subfolders this ticket left in
`_features/members/`: `git ls-files` shows all four holding nothing and the sandbox refuses
`rmdir`, so they stay the maintainer's to remove, like the `account/_utils/` and
`admin/users/_utils/` ones.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                          | Result                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `GET /api/trpc/authenticated.organization.invitation.list`                     | `401 UNAUTHORIZED`, the renamed key resolves                 |
| `GET /api/trpc/authenticated.organization.invitation.get`                      | `404 No procedure found on path`, the old key is gone        |
| `POST /api/trpc/authenticated.organization.invitation.create`                  | `401 UNAUTHORIZED`, the plan-aware procedure still guards it |
| `POST /api/trpc/authenticated.organization.invitation.delete`                  | `401 UNAUTHORIZED`, the key resolves                         |
| `POST /api/trpc/authenticated.organization.member.updateRole`, `member.delete` | `401 UNAUTHORIZED`, both resolve                             |
| `GET /api/trpc/authenticated.organization.get`, `invitation.listReceived`      | `401 UNAUTHORIZED`, part 1 is unaffected by the lock         |
| `POST /api/trpc/authenticated.organization.leave`                              | `401 UNAUTHORIZED`, same                                     |
| `GET /organization` signed out                                                 | `307` to `/login`, the page guard is unchanged               |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials and
no mail provider, so no user can sign in, no Organization can be rendered and no invitation can be
sent. Inviting a member, cancelling an invitation, promoting and demoting a member, removing a
member, and the denials seen as a plain member and at the seat limit are on the QA checklist of
issue #71.

### `(authenticated)/integrations`, part 1: agent tokens (issue #72)

Commit: `d60d149`. The scope router leaves `_utils/` for the scope root and the four agent token
operations become services. The scope is **not** locked: issue #73 owns the ten installation
operations of GitHub, Jira, Linear and Slack, and the `migratedScopes` entry.

**Files moved.** Six modules, all with `git mv`. No file dissolved, so this segment leaves no
`_deprecated_` stub.

| Operation        | Before                                                       | After                                    |
| ---------------- | ------------------------------------------------------------ | ---------------------------------------- |
| Scope router     | `_utils/trpc-router.ts`                                      | `trpc-router.ts`                         |
| Token list       | `_features/agent-tokens/get-agent-tokens.trpc.query.ts`      | `_services/list-agent-tokens.ts`         |
| Token creation   | `_features/agent-tokens/create-agent-token.trpc.mutation.ts` | `_services/create-agent-token.ts`        |
| Token revocation | `_features/agent-tokens/revoke-agent-token.trpc.mutation.ts` | `_services/revoke-agent-token.ts`        |
| Token deletion   | `_features/agent-tokens/delete-agent-token.trpc.mutation.ts` | `_services/delete-agent-token.ts`        |
| Creation schema  | `_features/agent-tokens/create-agent-token.schema.ts`        | `_services/create-agent-token.schema.ts` |

The `agent-tokens` feature keeps its three client components; only the four operations and the one
schema left. `integrations/_utils/` held nothing but the router, so the folder disappears with the
move rather than surviving as the empty untracked leftover the account, admin users and organization
scopes each recorded.

**Renamed service, no renamed procedure key.** One service: `getAgentTokens` becomes
`listAgentTokens`, because it returns a collection and `list-` is the read verb the closed vocabulary
forces, the same call as `listInvitations` in the organization scope. Its key was already
`agentToken.list`, so the rename costs no call site: the router key mirrored the intended verb before
the file name did. The other three keys, `create`, `revoke` and `delete`, each already mirror their
service verb under a router that carries the noun.

**`revoke` stays distinct from `delete`.** They are two domain transitions, not one verb with a flag.
`revokeAgentToken` keeps the row and writes `isActive: false` with a `revokedAt` stamp, so the token
stays listed with a "Revoked" badge and the REST agent API stops accepting it; `deleteAgentToken`
removes the row and the token leaves the list. The naming rule accepts `revoke-` as a precise write
verb for a distinct state transition the domain already names, and issue #72 asks for the distinction
explicitly. `revoke-agent-token.test.ts` pins it: the revoking case asserts the `update` call and
that `delete` was never reached.

**Authorization, all of it in the services.** Every denial of this segment needs a loaded membership,
so none of them could stay at the transport edge:

| Denial             | Where it lives now                                                     |
| ------------------ | ---------------------------------------------------------------------- |
| "Access denied."   | `ForbiddenError` in `listAgentTokens` (any member of the Organization) |
| "Access denied."   | `ForbiddenError` in `createAgentToken` (owner or admin)                |
| "Access denied."   | `ForbiddenError` in `revokeAgentToken` (owner or admin)                |
| "Access denied."   | `ForbiddenError` in `deleteAgentToken` (owner or admin)                |
| "Token not found." | `NotFoundError` in `revokeAgentToken`                                  |
| "Token not found." | `NotFoundError` in `deleteAgentToken`                                  |

Same codes, same messages. The read and the three writes deliberately keep their different membership
predicates: the list query accepts any member, the three writes require `owner` or `admin`, exactly
as the procedures did. No `UNAUTHORIZED`, no rate limit and no plan limit is involved, so nothing
moved into a procedure and `protectedProcedure` answers the identity question alone.

The "Token not found." branch is also the tenancy guard: both writes look the token up with
`{ id, organizationId }`, so a token id belonging to another Organization reads as not found rather
than as a denial, which is the behaviour the procedures already had.

**Reclassified errors.** None. The segment held no `INTERNAL_SERVER_ERROR`, so there was nothing to
triage and no generic wrapper to remove. Every `TRPCError` became the domain subclass of the same
code with the same message, so no toast changes wording.

**Nothing reachable from the REST agent API throws a `DomainError`.** The agent API never calls these
four operations: it resolves a bearer token through `@/server/api/resolve-agent-token`, which this
ticket does not touch and which returns `null` rather than throwing. The four services are reachable
from the tRPC router alone. Smoked below: `GET /api/v1/agent/feedbacks` with no bearer token still
answers `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, byte for byte.

**Services holding a database client.** All four, since each holds an authorization check and the two
token writes hold a domain error branch as well. None is a pass-through read. No service receives the
tRPC context or the session: the router passes `organizationId`, `tokenId`, `name`, `scopes` and
`userId` as plain values, and each service imports `prisma` directly instead of reading it from
`ctx`.

**Output types.** The four `inferProcedureOutput` aliases of the segment are gone. The read exports
`ListAgentTokensOutput` derived from its service; the three writes owe none, and their aliases
(`CreateAgentTokenOutput`, `RevokeAgentTokenOutput`, `DeleteAgentTokenOutput`) are dropped rather
than replaced, because no file imported them. The one consumer, `agent-token-item.client.tsx`,
changes an import path and a type name; the type-only import of a `_services/` module is the
documented exception to `no-client-import-of-services`.

**Schemas.** `CreateAgentTokenSchemaType` becomes `CreateAgentTokenInput`, which clears both
`require-schema-conventions` warnings the file carried: the misnamed alias, and the "must export at
least one type ending with `Input`" line the same defect raises at file level. The three procedures
that declared their input inline gain a schema file next to their service:
`list-agent-tokens.schema.ts`, `revoke-agent-token.schema.ts` and `delete-agent-token.schema.ts`.

**Debt noted, not fixed.** `create-agent-token-dialog.client.tsx` repeats the three scope literals
twice, once in its own `AVAILABLE_SCOPES` constant and once as an inline cast on
`createToken.mutate`. Importing `CreateAgentTokenInput` from the schema would remove the cast, but
the dialog is UI this ticket does not own and the duplication predates the migration. Recorded here
rather than fixed.

**Tests.** Three colocated files, eight cases, all driven through the trailing database client with
no tRPC context built: `list-agent-tokens.test.ts` (2) pins the `ForbiddenError` for a non-member and
that a plain member is queried without a role filter; `revoke-agent-token.test.ts` (3) and
`delete-agent-token.test.ts` (3) each pin the `ForbiddenError`, the `NotFoundError` for a token of
another Organization, and the write itself, `update` for one and `delete` for the other.
`createAgentToken` is left untested: its one branch is the same denial, and the rest of it is
`crypto.randomBytes`, which the step's policy does not ask to pin.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 60 app
tests (8 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **115 problems, 0
errors, 115 warnings** (88 `no-raw-tailwind-colors` / 26 `require-schema-conventions` / 1
`require-use-client-suffix`), down 2 from the 117 of the organization scope, the two being the
`CreateAgentTokenSchemaType` warnings above. `npx next build` compiles and still lists
`/integrations`; `pnpm build` is refused by the sandbox, as the earlier entries record.

**Prettier drift found, not caused.** `agent-token-item.client.tsx` and
`create-agent-token-dialog.client.tsx` were already unformatted at `f83a3b1`: four Tailwind class
lists sat in an order the current `prettier-plugin-tailwindcss` no longer produces, and
`npx prettier --check` fails on the untouched `f83a3b1` content of both. They are normalised here
rather than left for the pre-commit hook to reformat under an unrelated commit. The churn is class
ordering only; no class is added or removed.

**Per-scope "must be gone" checks.** Restricted to `(authenticated)/integrations`, checks 2 to 8
return nothing: `_utils/` is gone, no service imports tRPC, none holds a `TRPCError`, none carries
`'use server'`, and no router sits in a bucket or a feature. Checks 1, 9 and 10 return exactly the ten
installation modules issue #73 owns, with their role suffixes, their inline Prisma and their
`inferProcedureOutput` aliases.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                            | Result                                                               |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `GET /api/trpc/authenticated.integrations.agentToken.list`                       | `401 UNAUTHORIZED`, the key resolves and `protectedProcedure` guards |
| `POST …agentToken.create`, `agentToken.revoke`, `agentToken.delete`              | `401 UNAUTHORIZED`, all three resolve with their keys unchanged      |
| `GET …agentToken.get`                                                            | `404 No procedure found on path`, no stray key was introduced        |
| `GET …github.getInstallation`, `linear.getInstallation`, `slack.getInstallation` | `401 UNAUTHORIZED`, the keys issue #73 owns still resolve            |
| `GET …jira.getInstallation`, `jira.listAccessibleSites`                          | `401 UNAUTHORIZED`, same                                             |
| `POST …jira.selectSite`, `github.disconnect`                                     | `401 UNAUTHORIZED`, same                                             |
| `GET /api/v1/agent/feedbacks` with no bearer token                               | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged      |
| `GET /integrations` signed out                                                   | `307` to `/login`, the page guard is unchanged                       |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials, so no
user can sign in and no Organization can be rendered. Creating a token and copying it once, seeing
the list refresh only after the dialog closes, revoking a token and watching it stay listed as
"Revoked", deleting a token, and the denial seen as a plain member are on the QA checklist of
issue #72.

### `(authenticated)/integrations`, part 2: installations, and the scope lock (issue #73)

Commit: `ec003fb`. The ten installation operations of GitHub, Jira, Linear and Slack become services,
the four feature folders keep their client components alone, and the scope is locked.

**Files moved.** Eleven modules, all with `git mv`. No file dissolved, so this segment leaves no
`_deprecated_` stub either.

| Operation             | Before                                                   | After                                     |
| --------------------- | -------------------------------------------------------- | ----------------------------------------- |
| GitHub installation   | `_features/github/get-github-installation.trpc.query.ts` | `_services/get-github-installation.ts`    |
| GitHub disconnect     | `_features/github/disconnect-github.trpc.mutation.ts`    | `_services/disconnect-github.ts`          |
| Jira installation     | `_features/jira/get-jira-installation.trpc.query.ts`     | `_services/get-jira-installation.ts`      |
| Jira accessible sites | `_features/jira/list-accessible-sites.trpc.query.ts`     | `_services/list-accessible-jira-sites.ts` |
| Jira site selection   | `_features/jira/select-jira-site.trpc.mutation.ts`       | `_services/select-jira-site.ts`           |
| Jira selection schema | `_features/jira/select-jira-site.schema.ts`              | `_services/select-jira-site.schema.ts`    |
| Jira disconnect       | `_features/jira/disconnect-jira.trpc.mutation.ts`        | `_services/disconnect-jira.ts`            |
| Linear installation   | `_features/linear/get-linear-installation.trpc.query.ts` | `_services/get-linear-installation.ts`    |
| Linear disconnect     | `_features/linear/disconnect-linear.trpc.mutation.ts`    | `_services/disconnect-linear.ts`          |
| Slack installation    | `_features/slack/get-slack-installation.trpc.query.ts`   | `_services/get-slack-installation.ts`     |
| Slack disconnect      | `_features/slack/disconnect-slack.trpc.mutation.ts`      | `_services/disconnect-slack.ts`           |

**No renamed procedure key, one renamed file.** All ten keys already mirrored their service verb
under a router carrying the noun (`github.getInstallation`, `jira.listAccessibleSites`,
`jira.selectSite`, `slack.disconnect`), so no call site moved and the published packages, which never
call tRPC, are untouched by construction. The one rename is the file:
`list-accessible-sites.trpc.query.ts` exported `listAccessibleJiraSites`, so the file becomes
`list-accessible-jira-sites.ts` to satisfy "match function names to file names". `disconnect` stays a
precise write verb for all four integrations: it is a distinct domain transition with its own entry
point and, for GitHub and Jira, its own owner-only authorization, not a field write.

**Authorization, all of it in the services.** Every denial of this segment needs a loaded row, so
none of them could stay at the transport edge. The active Organization is itself IO: the services
take the request `headers` and call `auth.api.getFullOrganization` themselves, the pattern the
billing segment set.

| Denial                                               | Where it lives now                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| "No active organization."                            | `BadRequestError` in all ten services, after the Better-Auth lookup |
| "Access denied."                                     | `ForbiddenError` in the four installation reads (any member)        |
| "Only the organization owner can disconnect GitHub." | `ForbiddenError` in `disconnectGitHub`                              |
| "Only the organization owner can disconnect Jira."   | `ForbiddenError` in `disconnectJira` (owner-only per ADR 0008)      |
| "Only owners and admins can disconnect Linear."      | `ForbiddenError` in `disconnectLinear`                              |
| "Only owners and admins can disconnect Slack."       | `ForbiddenError` in `disconnectSlack`                               |
| "Only owners and admins can configure Jira."         | `ForbiddenError` in `listAccessibleJiraSites` and `selectJiraSite`  |
| "Selected site is no longer accessible."             | `BadRequestError` in `selectJiraSite`                               |

Same codes, same messages, same three different membership predicates as before: any member reads an
installation, owners and admins configure Jira and disconnect Linear and Slack, the owner alone
disconnects GitHub and Jira. No `UNAUTHORIZED`, no rate limit and no plan limit is involved, so
nothing moved into a procedure and `protectedProcedure` answers the identity question alone.

**Reclassified errors.** None. The segment held no `INTERNAL_SERVER_ERROR`, so there was nothing to
triage and no generic wrapper to remove. The `BAD_REQUEST` and `FORBIDDEN` throws became the domain
subclass of the same code with the same message, so no toast changes wording.

**Tracker clients untouched.** `@/server/jira/*`, `@/server/linear/*` and the Jira token and request
error classes are unchanged: only the `TRPCError` throws of this scope were converted.
`disconnectLinear` keeps its revoke-then-delete order and its swallowed revoke failure verbatim;
`disconnectJira` keeps deregistering the Jira-side webhooks before the cascade removes the links;
`selectJiraSite` keeps re-reading the accessible resources so the stored site never comes from client
input, and keeps sending `jira/webhooks.refresh-requested`.

**Nothing reachable from an OAuth callback, a webhook or an Inngest function throws a `DomainError`.**
The ten services are reachable from the tRPC router alone: the install and callback route handlers
under `src/app/api/{github,jira,linear,slack}/` build their own Prisma writes and never import these
modules, and `selectJiraSite` only sends an Inngest event rather than being called by one. The shared
code the services call (`getValidJiraAccessToken`, `getAccessibleResources`,
`deregisterProjectJiraWebhook`, `revokeAccessToken`) is unchanged and still throws what it threw.

**Services holding a database client.** All ten, since each holds at least the active-Organization
branch and a membership check. None is a pass-through read. No service receives the tRPC context or
the session: the router passes `headers`, `userId` and, for the site selection, `cloudId` as plain
values, and each service imports `prisma` directly instead of reading it from `ctx`.

**Output types.** The ten `inferProcedureOutput` aliases of the segment are gone. The four
installation reads and the site list export `<Service>Output` derived from their own service; the
five writes owe none, and their aliases (`DisconnectGitHubOutput`, `DisconnectJiraOutput`,
`DisconnectLinearOutput`, `DisconnectSlackOutput`, `SelectJiraSiteOutput`) are dropped rather than
replaced, because no file imported them. The four consumers, one `*-connected.client.tsx` per
integration, change an import path and keep the type name; the type-only import of a `_services/`
module is the documented exception to `no-client-import-of-services`.

**Schemas.** One schema file, `select-jira-site.schema.ts`, whose `SelectJiraSiteSchemaType` becomes
`SelectJiraSiteInput`. That clears both `require-schema-conventions` warnings it carried, the
misnamed alias and the file-level "must export at least one type ending with `Input`". The other nine
operations took no input before and take none now.

**The scope lock.** `"(authenticated)/integrations"` joins `migratedScopes`, so the nine step-3 rules
report at `error` for the scope. The `(authenticated)` entry keeps its `integrations` ignore, exactly
as it keeps its `account` one, so the lock comes from the new entry; both ignores go away with the
array itself at the final lock. One child scope of `(authenticated)` is left unmigrated, `(project)`,
which issues #74 to #79 own.

**Tests.** Two colocated files, six cases, all driven through the trailing database client with a
mocked `auth.api.getFullOrganization` and no tRPC context built: `disconnect-github.test.ts` (3) pins
the `BadRequestError` with no active Organization, the `ForbiddenError` for a non-owner with its
`role: "owner"` predicate, and that the deletion is scoped to the active Organization;
`get-slack-installation.test.ts` (3) pins the same two denials for a read and that a plain member is
queried without a role filter. They cover the two authorization shapes of the segment, owner-only
write and any-member read; the other eight services repeat one of the two, and the rest of their
bodies is tracker IO the step's policy does not ask to pin.

**Per-scope "must be gone" checks.** All ten, restricted to `(authenticated)/integrations`, return
nothing: no role-suffixed file, no old bucket, no `_constants/`, no `*.types.ts`, no router in a
bucket or a feature, no service importing tRPC, no `TRPCError` in a service, no `'use server'`, no
inline Prisma outside `_services/` and no `inferProcedureOutput` alias. Checks 1, 9 and 10 clear here
for the first time in this scope: the agent tokens entry recorded them returning exactly the ten
modules this ticket owns.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 66 app
tests (6 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **113 problems, 0
errors, 113 warnings** (88 `no-raw-tailwind-colors` / 24 `require-schema-conventions` / 1
`require-use-client-suffix`), down 2 from the 115 of the agent tokens segment, the two being the
`SelectJiraSiteSchemaType` warnings above. `npx next build` compiles and still lists `/integrations`
and the five public integration pages; `pnpm build` is refused by the sandbox, as the earlier entries
record.

**Prettier drift left alone.** Five client components of the four integration features
(`github-not-connected`, `jira-not-connected`, `jira-select-site`, `slack-not-connected`,
`slack-integration-section`) fail `npx prettier --check` on their untouched `488b409` content, the
same Tailwind class-order drift the agent tokens entry recorded. This ticket changes none of them, so
they are left as found rather than reformatted under an unrelated commit. The four
`*-connected.client.tsx` files it does touch are normalised, which is why their diffs carry a few
class-order lines beside the import change.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                                 | Result                                                                |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET …github.getInstallation`, `linear.getInstallation`, `slack.getInstallation`      | `401 UNAUTHORIZED`, each key resolves and `protectedProcedure` guards |
| `GET …jira.getInstallation`, `jira.listAccessibleSites`                               | `401 UNAUTHORIZED`, same                                              |
| `POST …github.disconnect`, `linear.disconnect`, `slack.disconnect`, `jira.disconnect` | `401 UNAUTHORIZED`, all four resolve with their keys unchanged        |
| `POST …jira.selectSite`                                                               | `401 UNAUTHORIZED`, the key and its input schema resolve              |
| `GET …agentToken.list`                                                                | `401 UNAUTHORIZED`, part 1 of the scope still resolves                |
| `GET …jira.listSites`                                                                 | `404 No procedure found on path`, no stray key was introduced         |
| `GET /api/v1/agent/feedbacks` with no bearer token                                    | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged       |
| `GET /integrations` signed out                                                        | `307` to `/login`, the page guard is unchanged                        |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials and no
tracker OAuth application, so no user can sign in, no Organization can be rendered and no Jira,
Linear, GitHub or Slack grant exists. Viewing each of the four installation states, disconnecting an
integration and watching the section fall back to its not-connected copy, the denial seen by a plain
member, and the multi-site Jira picker storing a site are on the QA checklist of issue #73.

### `(authenticated)/(project)`, part 1: scope router, inbox reads and bulk actions (issue #74)

Commit: `4f4a646`. The scope router leaves `_utils/`, seven operations become services, and the
inbox filter parsers move to `_helpers/`. The scope is **not** locked: issues #75 to #79 own the
remaining 37 operations and the `migratedScopes` entry.

**Files moved.** Eleven modules with `git mv`, plus five new schema files and two new test files. No
file dissolved, so this segment leaves no `_deprecated_` stub.

| Operation               | Before                                                                         | After                                                       |
| ----------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Scope router            | `_utils/trpc-router.ts`                                                        | `trpc-router.ts`                                            |
| Project list            | `_utils/get-projects.trpc.query.ts`                                            | `_services/list-projects.ts`                                |
| Feedback list           | `inbox/_features/get-feedback.trpc.query.ts`                                   | `inbox/_services/list-feedback.ts`                          |
| Archived Feedback       | `inbox/_features/archive/get-archived-feedback.trpc.query.ts`                  | `inbox/_services/list-archived-feedback.ts`                 |
| Distinct page URLs      | `inbox/_features/filters/get-distinct-page-urls.trpc.query.ts`                 | `inbox/_services/list-distinct-page-urls.ts`                |
| Feedback delete         | `inbox/_features/archive/hard-delete-feedback.trpc.mutation.ts`                | `inbox/_services/delete-feedback.ts`                        |
| Feedback delete schema  | `inbox/_features/archive/hard-delete-feedback.schema.ts`                       | `inbox/_services/delete-feedback.schema.ts`                 |
| Bulk Feedback delete    | `inbox/_features/archive/bulk-hard-delete-feedback.trpc.mutation.ts`           | `inbox/_services/delete-feedbacks.ts`                       |
| Bulk status update      | `inbox/_features/actions-toolbar/bulk-update-feedback-status.trpc.mutation.ts` | `inbox/_services/update-feedbacks-status.ts`                |
| Feedback filter parsers | `inbox/_features/filters/feedback-filters.schema.ts`                           | `inbox/_helpers/feedback-filters-parsers.ts`                |
| Permanent-delete dialog | `inbox/_features/archive/hard-delete-dialog.client.tsx`                        | `inbox/_features/archive/delete-feedback-dialog.client.tsx` |

Services sit in `inbox/_services/` next to the segment UI while the procedures stay inlined in the
scope-root `(project)/trpc-router.ts`, the shape the account scope set: the Project scope has 44
operations across three segments and one router file keeps its API surface readable.

**Renamed services.** Seven, three of them the renames the ticket lists and four forced by the closed
read vocabulary.

| Before                     | After                   | Why                                                                                                       |
| -------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `hardDeleteFeedback`       | `deleteFeedback`        | There is no soft delete of a Feedback: the reversible state is **Archived**, so "hard" carries no meaning |
| `bulkHardDeleteFeedback`   | `deleteFeedbacks`       | Same, plus the plural says "many" without a `bulk` prefix                                                 |
| `bulkUpdateFeedbackStatus` | `updateFeedbacksStatus` | Same                                                                                                      |
| `getFeedback`              | `listFeedback`          | It returns a collection, and `list-` is the read verb the closed vocabulary forces                        |
| `getProjects`              | `listProjects`          | Same                                                                                                      |
| `getArchivedFeedback`      | `listArchivedFeedback`  | Same, behind a pagination envelope                                                                        |
| `getDistinctPageUrls`      | `listDistinctPageUrls`  | Same                                                                                                      |

The four `list-` renames repeat the `getPastInvoices` to `listPastInvoices` and `getAgentTokens` to
`listAgentTokens` renames of the billing and agent-token segments: the step spec's rename list names
the cases it knew about, not the whole set the closed read vocabulary forces.

**Renamed procedure keys.** Four, all under `projects.feedback`.

| Before             | After                  | Call sites updated                                   |
| ------------------ | ---------------------- | ---------------------------------------------------- |
| `distinctPageUrls` | `listDistinctPageUrls` | `inbox-tabs.client.tsx`                              |
| `hardDelete`       | `delete`               | `archive/archive-tab.client.tsx`                     |
| `bulkHardDelete`   | `deleteMany`           | none: the procedure has no client caller (see below) |
| `bulkUpdateStatus` | `updateManyStatus`     | `use-feedback-mutations.ts`                          |

`projects.list`, `feedback.list` and `feedback.listArchived` keep their key: each service drops the
entity the router already carries, which is what the key already said. `listDistinctPageUrls` takes
the full service name instead, because the entity is the URL list, not the Feedback the router
carries; that is the same reading that produced `subscription.getStatus` in the billing segment. The
two plural services collide with their singular siblings once the entity is dropped, so their key
keeps the `Many` that tells them apart rather than repeating the entity (`feedback.deleteFeedbacks`
would have been the literal alternative). The published packages call the `/api/v1/*` REST surface
and never tRPC, so no key rename can reach them.

**An orphan procedure found.** `feedback.bulkHardDelete` has no caller anywhere in `src/`: the
archive tab deletes one row at a time and the bulk toolbar only changes status. It is migrated as
`feedback.deleteMany` rather than left behind, because removing a procedure is a behaviour change
this step does not allow, but it is recorded here as a candidate for deletion by the maintainer.

**Authorization, all of it in the services.** Every denial of this segment needs a loaded row, so
none of them could stay at the transport edge. `protectedProcedure` answers identity alone and no
`UNAUTHORIZED`, rate limit or plan limit is involved.

| Denial                                               | Where it lives now                                                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| "You do not have access to this organization."       | `ForbiddenError` in `listProjects`, after the membership lookup                                       |
| "Project not found."                                 | `NotFoundError` in the three inbox reads                                                              |
| "Access denied."                                     | `ForbiddenError` in the three inbox reads and the three writes, after the Project's membership lookup |
| "Feedback not found."                                | `NotFoundError` in `deleteFeedback`, `deleteFeedbacks` and `updateFeedbacksStatus`                    |
| "Only archived feedback can be permanently deleted." | `BadRequestError` in `deleteFeedback` and `deleteFeedbacks`                                           |

Membership in the Project's Organization is checked in the service that loads the Project, as the
ticket asks: the three reads load the Project first, the three writes reach the Organization through
the Feedback's `project` relation. The seven services each keep the exact predicate, order and
message they had as procedures.

**Reclassified errors.** None. The segment held no `INTERNAL_SERVER_ERROR` and no generic wrapper, so
there was nothing to triage. Every `TRPCError` became the `DomainError` subclass of the same code
with the same message, so no toast or form error changes wording.

**Nothing reachable from an Inngest function throws a `DomainError`.** `updateFeedbacksStatus` keeps
sending the `feedback/status-changed` fan-out with its swallowed failure, but it is a sender, not a
step body: no Inngest function imports any of the seven services.

**Services holding a database client.** All seven, since each holds at least one authorization check
and one domain error branch. None is a pass-through read. No service receives the tRPC context or the
session: the router passes `userId` and the parsed input as plain values, and each service imports
`prisma` directly instead of reading it from `ctx`.

**Output types.** The four `inferProcedureOutput` aliases of the segment are gone. `listProjects`,
`listFeedback`, `listArchivedFeedback` and `listDistinctPageUrls` export `<Service>Output` derived
from their own function. `BulkUpdateFeedbackStatusOutput` is dropped rather than replaced: it was a
write and no file imported it. The fourteen consumers of `GetFeedbackOutput` and
`GetArchivedFeedbackOutput` change an import path and the type name; the type-only import of a
`_services/` module is the documented exception to `no-client-import-of-services`, and
`use-feedback-mutations.ts` gains the `type` modifier its import was missing.

**Schemas.** Five new pure-Zod schema files, one moved. `HardDeleteFeedbackSchema` became
`DeleteFeedbackSchema` and its `HardDeleteFeedbackSchemaType` alias became `DeleteFeedbackInput`; the
other five operations parsed an inline `z.object` in the procedure and now own a `*.schema.ts` next
to their service. `list-archived-feedback.schema.ts` exports both `Input` and `Values`, since its
four defaulted fields make the parsed and caller-facing shapes diverge. That is the whole 24 to 19
burn-down of `require-schema-conventions` below.

**The filter parsers left their schema file.** `feedbackFiltersParsers` is a `nuqs` parser record,
not Zod, so `feedback-filters.schema.ts` becomes `inbox/_helpers/feedback-filters-parsers.ts`. It has
no importer today: `inbox-tabs.client.tsx` builds the same three parsers inline. It is moved rather
than retired, and folding the duplication into the helper is left to the feature work, not to a
behaviour-preserving refactor.

**Tests.** Two colocated files, seven cases, all driven through the trailing database client with no
tRPC context built. `delete-feedback.test.ts` (4) pins the not-found, not-archived and non-member
denials and the deletion of an archived Feedback, with `deleteAsset` mocked.
`list-distinct-page-urls.test.ts` (3) pins the two denials of the "load the Project, then its
membership" read shape and the membership predicate itself. The two files cover the two
authorization shapes of the segment; the other five services repeat one of the two.

**Per-scope "must be gone" checks**, restricted to `(authenticated)/(project)`:

| Check                                | Result                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| 1 role suffixes                      | 37 files, exactly the operations issues #75 to #79 own                        |
| 2 old buckets                        | the now-empty `(project)/_utils/` and `settings/_features/jira/_utils/` (#78) |
| 3 `_constants/` inside a scope       | nothing                                                                       |
| 4 `*.types.ts`                       | nothing                                                                       |
| 5 routers in a bucket or a feature   | nothing: the scope router now sits at the scope root                          |
| 6 tRPC imported by a service         | nothing                                                                       |
| 7 `TRPCError` in a service           | nothing                                                                       |
| 8 `'use server'` in a service/router | nothing: the seven moved modules all dropped the directive                    |
| 9 Prisma outside a service           | 36 files, the same set as check 1 minus the scope router                      |
| 10 `inferProcedureOutput`            | 36 files, all owned by the later parts                                        |

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 73 app
tests (7 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **108 problems, 0
errors, 108 warnings** (88 `no-raw-tailwind-colors` / 19 `require-schema-conventions` / 1
`require-use-client-suffix`), down 5 from the 113 of the integrations lock. `npx next build` compiles
and still lists `/inbox`, `/reviewers` and `/settings`; `pnpm build` is refused by the sandbox, as
the earlier entries record.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                                               | Result                                                                |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET …projects.list`, `feedback.list`, `feedback.listArchived`, `feedback.listDistinctPageUrls`     | `401 UNAUTHORIZED`, each key resolves and `protectedProcedure` guards |
| `POST …feedback.delete`, `feedback.deleteMany`, `feedback.updateManyStatus`                         | `401 UNAUTHORIZED`, same                                              |
| `GET …feedback.distinctPageUrls`, `POST …feedback.hardDelete`, `bulkHardDelete`, `bulkUpdateStatus` | `404 No procedure found on path`, the four old keys are gone          |
| `POST …feedback.getDiagnostics`, `…reviewer.list`                                                   | `405` query-over-POST, the unmigrated keys still resolve              |
| `GET /api/v1/agent/feedbacks` with no bearer token                                                  | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged       |
| `GET /inbox` signed out                                                                             | `307` to `/login`, the page guard is unchanged                        |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials, so no
user can sign in and no Project can be rendered. Walking the inbox list and its board, the page-URL
and sort filters, the archive tab with its pagination and search, a bulk status change from the
toolbar and a permanent delete from the archive are on the QA checklist of issue #74.

**Left for the maintainer.** The now-empty `(project)/_utils/` folder: the sandbox refuses `rmdir`,
as the account and organization entries record for their own scopes.

### `(authenticated)/(project)`, part 2: inbox Feedback panel (issue #75)

Commit: `08563bb`. The six operations of the Feedback panel become services, the shared inbox
mutations hook becomes a feature of its own, and the single-consumer org-members hook joins the
feature that uses it. The scope is still **not** locked: issues #76 to #79 own the remaining 31
operations and the `migratedScopes` entry.

**Files moved.** Ten modules with `git mv`, plus four new schema files and two new test files. No
file dissolved, so this segment leaves no `_deprecated_` stub.

| Operation                 | Before                                                                      | After                                                          |
| ------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| GitHub issue creation     | `inbox/_features/feedback-panel/create-issue-for-feedback.trpc.mutation.ts` | `inbox/_services/create-github-issue-for-feedback.ts`          |
| Jira issue creation       | `…/create-jira-issue-for-feedback.trpc.mutation.ts`                         | `inbox/_services/create-jira-issue-for-feedback.ts`            |
| Linear issue creation     | `…/create-linear-issue-for-feedback.trpc.mutation.ts`                       | `inbox/_services/create-linear-issue-for-feedback.ts`          |
| Feedback diagnostics      | `…/get-feedback-diagnostics.trpc.query.ts`                                  | `inbox/_services/get-feedback-diagnostics.ts`                  |
| Assignee update           | `…/update-feedback-assignee.trpc.mutation.ts`                               | `inbox/_services/update-feedback-assignee.ts`                  |
| Assignee update schema    | `…/update-feedback-assignee.schema.ts`                                      | `inbox/_services/update-feedback-assignee.schema.ts`           |
| Status update             | `…/update-feedback-status.trpc.mutation.ts`                                 | `inbox/_services/update-feedback-status.ts`                    |
| Status update schema      | `…/update-feedback-status.schema.ts`                                        | `inbox/_services/update-feedback-status.schema.ts`             |
| Shared mutations hook     | `inbox/_features/use-feedback-mutations.ts`                                 | `inbox/_features/feedback-mutations/use-feedback-mutations.ts` |
| Organization members hook | `inbox/_features/use-org-members.ts`                                        | `inbox/_features/feedback-panel/use-org-members.ts`            |

**The two hooks, placed by the number of their consumers.** `useFeedbackMutations` is read by three
features (`feedback-panel/status-select`, `feedback-panel/assignee-select`, `kanban/kanban-board`),
so it becomes a feature of its own, `_features/feedback-mutations/`, exactly as the plan gate hook
became `subscription/plan-gate/`. No `_hooks/` bucket is created: a hook is a capability, and a
capability is a feature. `useOrgMembers` has a single consumer, `feedback-panel/assignee-select`, so
the same rule puts it inside that feature rather than in a folder of its own; it was only sitting
next to its sibling because the flat `_features/` root was the pre-migration home of both. It is not
named by the ticket, but leaving one bare hook flat in `_features/` while its neighbour moves is the
half-converted folder the standards warn about.

**Renamed services.** One. The other five keep the name they had as a procedure.

| Before                   | After                          | Why                                                                                                           |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `createIssueForFeedback` | `createGitHubIssueForFeedback` | Its two siblings name their tracker; the unqualified one read as "the" issue tracker, which is no longer true |

**Renamed procedure keys.** One, under `projects.feedback`.

| Before        | After               | Call sites updated                                             |
| ------------- | ------------------- | -------------------------------------------------------------- |
| `createIssue` | `createGitHubIssue` | `inbox/_features/feedback-panel/github-issue-badge.client.tsx` |

`getDiagnostics`, `updateStatus` and `updateAssignee` keep their key: each drops the `Feedback` the
router already carries, which is what the key already said. `createLinearIssue` and `createJiraIssue`
keep theirs for the same reason. The published packages call the `/api/v1/*` REST surface and never
tRPC, so the rename cannot reach them.

**Authorization, all of it in the services.** Every denial needs a loaded row, so none of them could
stay at the transport edge. `protectedProcedure` answers identity alone and no `UNAUTHORIZED`, rate
limit or plan limit is involved.

| Denial                                                       | Where it lives now                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| "Feedback not found."                                        | `NotFoundError` in all six services                                                   |
| "Project not found."                                         | `NotFoundError` in `getFeedbackDiagnostics`, which loads the Project first            |
| "Access denied."                                             | `ForbiddenError` in all six, after the membership lookup                              |
| "A GitHub/Jira/Linear issue already exists …"                | `ConflictError` in the three tracker services                                         |
| "No GitHub repository / Jira project / Linear team linked …" | `BadRequestError` in the three tracker services                                       |
| "Member not found."                                          | `NotFoundError` in `updateFeedbackAssignee`, for an assignee outside the Organization |

The check order of each service is unchanged, so a Feedback that is both already mirrored and in a
project with no link still reports the conflict first, as it did before.

**Reclassified errors.** None. The ticket anticipates expected tracker failures dressed as
`INTERNAL_SERVER_ERROR`, and the segment holds none: the three tracker operations only queue an
Inngest event, and the failures they report (already mirrored, no link, unknown Feedback) were
already `CONFLICT`, `BAD_REQUEST` and `NOT_FOUND`. The tracker API calls themselves live in the
Inngest functions under `src/server/`, outside this step's perimeter, so their error handling is
untouched. Every `TRPCError` became the `DomainError` subclass of the same code with the same
message, so no toast changes wording.

**Nothing reachable from an Inngest function throws a `DomainError`.** The three tracker services and
`updateFeedbackStatus` are senders: they publish `feedback/integration-issue-requested` and
`feedback/status-changed` and are imported by nothing under `src/server/inngest/`. The step bodies
that consume those events are untouched.

**Services holding a database client.** All six, since each holds at least one authorization check
and one domain error branch. None is a pass-through read. No service receives the tRPC context or the
session: the router passes `userId` and the parsed input as plain values, and each service imports
`prisma` directly instead of reading it from `ctx`.

**Output types.** The five `inferProcedureOutput` aliases of the segment are gone.
`getFeedbackDiagnostics`, the one read, exports `GetFeedbackDiagnosticsOutput` derived from its own
function. The four write aliases (`CreateIssueForFeedbackOutput`, `CreateJiraIssueForFeedbackOutput`,
`CreateLinearIssueForFeedbackOutput`, `UpdateFeedbackStatusOutput`) are dropped rather than replaced:
no file imported any of them, and the same call was made for `BulkUpdateFeedbackStatusOutput` in
part 1.

**Schemas.** Four new pure-Zod schema files, two moved. The three tracker operations and the
diagnostics read parsed an inline `z.object` in the procedure and now own a `*.schema.ts` next to
their service. `UpdateFeedbackAssigneeSchemaType` and `UpdateFeedbackStatusSchemaType` became
`UpdateFeedbackAssigneeInput` and `UpdateFeedbackStatusInput`, which is the whole 19 to 15 burn-down
of `require-schema-conventions` below: each of those two files was reported twice, once for the alias
and once for exporting no `Input` type at all. The hand-written `z.enum(["new", "in_progress",
"resolved", "closed"])` of the status schema is kept as it is, matching `UpdateFeedbacksStatusSchema`
from part 1; `Feedback.status` is a string column, not a Prisma enum, so there is no generated enum
to import.

**Tests.** Two colocated files, ten cases, all driven through the trailing database client with no
tRPC context built. `create-github-issue-for-feedback.test.ts` (5) pins the not-found, non-member,
already-mirrored and no-repository-linked denials and the queued event for a member caller, with
`inngest.send` mocked and asserted. `update-feedback-assignee.test.ts` (5) pins the two Feedback
denials, the unknown assignee, the write itself and the fact that clearing an assignee makes no
second member lookup. Between them they cover the two shapes of this segment: the four-branch tracker
guard and the second, nested lookup.

**Per-scope "must be gone" checks**, restricted to `(authenticated)/(project)`:

| Check                                | Result                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| 1 role suffixes                      | 31 files, down from 37, exactly the operations issues #76 to #79 own          |
| 2 old buckets                        | the now-empty `(project)/_utils/` and `settings/_features/jira/_utils/` (#78) |
| 3 `_constants/` inside a scope       | nothing                                                                       |
| 4 `*.types.ts`                       | nothing                                                                       |
| 5 routers in a bucket or a feature   | nothing                                                                       |
| 6 tRPC imported by a service         | nothing                                                                       |
| 7 `TRPCError` in a service           | nothing                                                                       |
| 8 `'use server'` in a service/router | nothing: the six moved modules all dropped the directive                      |
| 9 Prisma outside a service           | 30 files, down from 36, the same set as check 1 minus the scope router        |
| 10 `inferProcedureOutput`            | 31 files, down from 36, all owned by the later parts                          |

The old-bucket check also answers the ticket's "no `_hooks/` bucket exists": the scope has none, and
the two hooks moved into features rather than into one.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 83 app
tests (10 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **104 problems, 0
errors, 104 warnings** (88 `no-raw-tailwind-colors` / 15 `require-schema-conventions` / 1
`require-use-client-suffix`), down 4 from the 108 of part 1. `npx next build` compiles and still
lists `/inbox`, `/reviewers` and `/settings`; `pnpm build` is refused by the sandbox, as the earlier
entries record.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                      | Result                                                               |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `GET …feedback.getDiagnostics`                                             | `401 UNAUTHORIZED`, the key resolves and `protectedProcedure` guards |
| `POST …feedback.createGitHubIssue`, `createLinearIssue`, `createJiraIssue` | `401 UNAUTHORIZED`, same                                             |
| `POST …feedback.updateStatus`, `feedback.updateAssignee`                   | `401 UNAUTHORIZED`, same                                             |
| `GET …feedback.createIssue`                                                | `404 No procedure found on path`, the old key is gone                |
| `GET …feedback.createGitHubIssue`                                          | `405` mutation-over-GET, so the key is mounted as a mutation         |
| `GET /api/v1/agent/feedbacks` with no bearer token                         | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged      |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials, so no
user can sign in and no Project can be rendered, and no GitHub, Jira, Linear or Slack Installation
exists to mirror into. Creating an issue on each linked tracker, changing the assignee and the status
from the panel and from the kanban board, and opening the diagnostics modal are on the QA checklist
of issue #75.

**Left for the maintainer.** Nothing new. The now-empty `(project)/_utils/` folder recorded by part 1
is still there: the sandbox refuses `rmdir`.

### `(authenticated)/(project)`, part 3: reviewers and core settings (issue #76)

Commit: `3e03177`. The five Reviewer operations and the four core Project settings operations become
services in two new `_services/` folders. The scope is still **not** locked: issues #77 to #79 own
the remaining 22 operations and the `migratedScopes` entry.

**Files moved.** Eleven modules with `git mv`, plus seven new schema files and three new test files.
No file dissolved, so this segment leaves no `_deprecated_` stub.

| Operation              | Before                                                                      | After                                           |
| ---------------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| Reviewer list          | `reviewers/_features/get-reviewers.trpc.query.ts`                           | `reviewers/_services/list-reviewers.ts`         |
| Reviewer create        | `reviewers/_features/create/create-reviewer.trpc.mutation.ts`               | `reviewers/_services/create-reviewer.ts`        |
| Reviewer create schema | `reviewers/_features/create/create-reviewer.schema.ts`                      | `reviewers/_services/create-reviewer.schema.ts` |
| Reviewer revoke        | `reviewers/_features/revoke/revoke-reviewer.trpc.mutation.ts`               | `reviewers/_services/revoke-reviewer.ts`        |
| Reviewer restore       | `reviewers/_features/restore/restore-reviewer.trpc.mutation.ts`             | `reviewers/_services/restore-reviewer.ts`       |
| Reviewer delete        | `reviewers/_features/delete/delete-reviewer.trpc.mutation.ts`               | `reviewers/_services/delete-reviewer.ts`        |
| Project read           | `settings/_features/get-project.trpc.query.ts`                              | `settings/_services/get-project.ts`             |
| Project update         | `settings/_features/update/update-project.trpc.mutation.ts`                 | `settings/_services/update-project.ts`          |
| Project update schema  | `settings/_features/update/update-project.schema.ts`                        | `settings/_services/update-project.schema.ts`   |
| Project delete         | `settings/_features/delete/delete-project.trpc.mutation.ts`                 | `settings/_services/delete-project.ts`          |
| API key regeneration   | `settings/_features/regenerate-api-key/regenerate-api-key.trpc.mutation.ts` | `settings/_services/regenerate-api-key.ts`      |

The two segments each get their own `_services/` folder next to their UI, and the procedures stay
inlined in the scope-root `(project)/trpc-router.ts`, as parts 1 and 2 did. The `_features/`
subfolders the operations left (`create/`, `revoke/`, `restore/`, `delete/`, `update/`,
`regenerate-api-key/`) keep their client component, which is what a feature is for; none is
flattened, because flattening them is a placement change no ticket asked for.

The three client files this segment touches (`reviewers-table.client.tsx`,
`create-reviewer-dialog.client.tsx`, `update-project-form.client.tsx`) carried pre-existing Prettier
drift and are normalised on the way through, as the integrations entry did for the files it touched,
so their diffs carry a few Tailwind class-order lines beside the import change.

**Renamed services.** One, forced by the closed read vocabulary.

| Before         | After           | Why                                                                               |
| -------------- | --------------- | --------------------------------------------------------------------------------- |
| `getReviewers` | `listReviewers` | It returns a collection, so `list-` is the read verb the closed vocabulary forces |

That is the fifth `get-` to `list-` rename of the step, after `listProjects`, `listFeedback`,
`listArchivedFeedback` and `listDistinctPageUrls` in part 1.

**Renamed procedure keys.** None. `projects.get`, `update`, `delete` and the five `projects.reviewer`
keys each already say what their service says once the entity the router carries is dropped, and
`regenerateApiKey` keeps the full service name because the entity is the API key, not the Project.
Nine operations move without a single call-site key change.

**Authorization, all of it in the services.** Every denial of this segment needs a loaded row, so
none of them could stay at the transport edge. `protectedProcedure` answers identity alone and no
`UNAUTHORIZED`, rate limit or plan limit is involved.

| Denial                | Where it lives now                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| "Project not found."  | `NotFoundError` in `listReviewers`, `createReviewer`, `getProject`, `updateProject`, `deleteProject`, `regenerateApiKey` |
| "Reviewer not found." | `NotFoundError` in `revokeReviewer`, `restoreReviewer`, `deleteReviewer`                                                 |
| "Access denied."      | `ForbiddenError` in all nine, after the membership lookup                                                                |

The membership predicate is not uniform and is kept exactly as found: the two reads (`listReviewers`,
`getProject`) accept any member of the Project's Organization, while the seven writes require
`role: { in: ["owner", "admin"] }`. The three Reviewer writes reach the Organization through the
Reviewer's `project` relation, the same shape as the Feedback writes of part 1.

**No plan limit on reviewers.** The ticket asks that plan limit denials on reviewers stay in the
procedure or a middleware. There are none: `createReviewer` was a plain `protectedProcedure`, nothing
under `server/auth/subscription` counts Reviewers, and the reviewers UI has no plan gate. The
criterion is satisfied vacuously and is recorded here so the absence is not read as an omission. If a
Reviewer limit is added later, it belongs at the transport edge like the other plan denials, not in
the service.

**Reclassified errors.** None. The segment held no `INTERNAL_SERVER_ERROR` and no generic wrapper.
Every `TRPCError` became the `DomainError` subclass of the same code with the same message, so no
toast or form error changes wording.

**Nothing reachable from an Inngest function throws a `DomainError`.** None of the nine services is
imported by anything under `src/server/`, and none of them sends an Inngest event.

**Services holding a database client.** All nine, since each holds a not-found branch and an
authorization check. None is a pass-through read. No service receives the tRPC context or the
session: the router passes `userId` and the parsed input as plain values, and each service imports
`prisma` directly instead of reading it from `ctx`.

**Output types.** The nine `inferProcedureOutput` aliases of the segment are gone. The two reads
export `<Service>Output` derived from their own function: `ListReviewersOutput`, consumed by
`reviewers-table.client.tsx`, which changes an import path and the type name, and `GetProjectOutput`,
which has no importer and is kept because the read's return type is the type source of truth. The
seven write aliases are dropped rather than replaced, as parts 1 and 2 did: no file imported any of
them.

**Schemas.** Seven new pure-Zod schema files, two moved. Six operations parsed an inline
`z.object({ projectId })` or `z.object({ reviewerId })` in the procedure and now own a `*.schema.ts`
next to their service; `create-reviewer.schema.ts` and `update-project.schema.ts` moved with their
service. `CreateReviewerInputs` and `UpdateProjectInputs` became `CreateReviewerInput` and
`UpdateProjectInput`, which is the whole 15 to 13 burn-down of `require-schema-conventions` below.
`update-project.schema.ts` keeps its `DomainSchema` import from `_domains/project/normalize-domain`:
it is a Zod schema with no server-only dependency, so the file stays pure-Zod.

**Tests.** Three colocated files, eleven cases, all driven through the trailing database client with
no tRPC context built. `create-reviewer.test.ts` (4) pins the not-found and non-privileged denials,
the owner/admin predicate, and the fact that only the SHA-256 hash of the returned token is
persisted while the share URL carries the raw one. `revoke-reviewer.test.ts` (3) pins the "load the
Reviewer, then its Project's Organization" shape. `get-project.test.ts` (4) pins the any-role read
predicate, the two denials, and the projection that keeps `apiKeyHash` out of the response. Between
them they cover the three authorization shapes of the segment.

**Per-scope "must be gone" checks**, restricted to `(authenticated)/(project)`:

| Check                                | Result                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| 1 role suffixes                      | 22 files, down from 31, exactly the operations issues #77 to #79 own          |
| 2 old buckets                        | the now-empty `(project)/_utils/` and `settings/_features/jira/_utils/` (#78) |
| 3 `_constants/` inside a scope       | nothing                                                                       |
| 4 `*.types.ts`                       | nothing                                                                       |
| 5 routers in a bucket or a feature   | nothing                                                                       |
| 6 tRPC imported by a service         | nothing                                                                       |
| 7 `TRPCError` in a service           | nothing                                                                       |
| 8 `'use server'` in a service/router | nothing: the eleven moved modules all dropped the directive                   |
| 9 Prisma outside a service           | 21 files, down from 30, the same set as check 1 minus the scope router        |
| 10 `inferProcedureOutput`            | 22 files, down from 31, all owned by the later parts                          |

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 94 app
tests (11 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **102 problems, 0
errors, 102 warnings** (88 `no-raw-tailwind-colors` / 13 `require-schema-conventions` / 1
`require-use-client-suffix`), down 2 from the 104 of part 2. `npx next build` compiles and still
lists `/inbox`, `/reviewers` and `/settings`; `pnpm build` is refused by the sandbox, as the earlier
entries record.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                   | Result                                                                        |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `GET …projects.get`, `projects.reviewer.list`                           | `401 UNAUTHORIZED`, each key resolves and `protectedProcedure` guards         |
| `POST …projects.update`, `projects.delete`, `projects.regenerateApiKey` | `401 UNAUTHORIZED`, same                                                      |
| `POST …projects.reviewer.create`, `revoke`, `restore`, `delete`         | `401 UNAUTHORIZED`, same                                                      |
| `GET …projects.regenerateApiKey`                                        | `405` mutation-over-GET, so the key is mounted as a mutation                  |
| `POST …projects.listReviewers`                                          | `404 No procedure found on path`, no stray key was introduced                 |
| `GET …projects.github.getLink`, `projects.feedback.list`                | `401 UNAUTHORIZED`, the unmigrated and already-migrated siblings both resolve |
| `GET /api/v1/agent/feedbacks` with no bearer token                      | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged               |
| `GET /reviewers`, `GET /settings` signed out                            | `307` to `/login`, the page guards are unchanged                              |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials, so no
user can sign in and no Project can be rendered. Creating a reviewer and copying its share link,
revoking and restoring it, deleting it, renaming the Project, regenerating the API key and deleting
the Project are on the QA checklist of issue #76.

**Left for the maintainer.** Nothing new. The now-empty `(project)/_utils/` folder recorded by part 1
is still there: the sandbox refuses `rmdir`.

### `(authenticated)/(project)`, part 4: GitHub and Slack link settings (issue #77)

Commit: `3f60bf9`. The five GitHub repository link operations and the four Slack channel link
operations become services in the existing `settings/_services/` folder. The scope is still **not**
locked: issues #78 and #79 own the remaining 13 operations and the `migratedScopes` entry.

**Files moved.** Thirteen modules with `git mv`, plus three new schema files and three new test
files. No file dissolved, so this segment leaves no `_deprecated_` stub.

| Operation            | Before                                                                             | After                                                     |
| -------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------- |
| GitHub link read     | `settings/_features/github/get-project-link.trpc.query.ts`                         | `settings/_services/get-project-github-link.ts`           |
| GitHub repo lookup   | `settings/_features/github/link-repo/list-accessible-repos.trpc.query.ts`          | `settings/_services/list-accessible-repos.ts`             |
| GitHub link write    | `settings/_features/github/link-repo/link-repo.trpc.mutation.ts`                   | `settings/_services/link-repo.ts`                         |
| GitHub link schema   | `settings/_features/github/link-repo/link-repo.schema.ts`                          | `settings/_services/link-repo.schema.ts`                  |
| GitHub unlink        | `settings/_features/github/unlink-repo/unlink-repo.trpc.mutation.ts`               | `settings/_services/unlink-repo.ts`                       |
| GitHub link update   | `settings/_features/github/update-link/update-project-link.trpc.mutation.ts`       | `settings/_services/update-project-github-link.ts`        |
| GitHub update schema | `settings/_features/github/update-link/update-project-link.schema.ts`              | `settings/_services/update-project-github-link.schema.ts` |
| Slack link read      | `settings/_features/slack/get-project-slack-link.trpc.query.ts`                    | `settings/_services/get-project-slack-link.ts`            |
| Slack channel lookup | `settings/_features/slack/link-channel/list-slack-channels.trpc.query.ts`          | `settings/_services/list-slack-channels.ts`               |
| Slack link write     | `settings/_features/slack/link-channel/set-project-slack-channel.trpc.mutation.ts` | `settings/_services/link-slack-channel.ts`                |
| Slack link schema    | `settings/_features/slack/link-channel/set-project-slack-channel.schema.ts`        | `settings/_services/link-slack-channel.schema.ts`         |
| Slack link update    | `settings/_features/slack/update-link/update-project-slack-link.trpc.mutation.ts`  | `settings/_services/update-project-slack-link.ts`         |
| Slack update schema  | `settings/_features/slack/update-link/update-project-slack-link.schema.ts`         | `settings/_services/update-project-slack-link.schema.ts`  |

The nine operations join the four core Project settings services of part 3 in one flat
`settings/_services/`, the shape the integrations scope already uses for its four trackers: the
tracker name is carried by the service name, not by a subfolder. The `_features/` subfolders the
operations left (`link-repo/`, `unlink-repo/`, `update-link/`, `link-channel/`) keep their client
component, which is what a feature is for.

**Renamed services.** Two, both forced by the naming conventions.

| Before                   | After                     | Why                                                                                                                        |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `updateProjectLink`      | `updateProjectGitHubLink` | In a flat `_services/` shared with Slack, Jira and Linear, "project link" names no tracker; the read already said `GitHub` |
| `setProjectSlackChannel` | `linkSlackChannel`        | `set-` is an `update` synonym in all but spelling, and the operation is the Slack half of the link/unlink pair             |

**Renamed procedure keys.** One. `projects.slack.setProjectChannel` became
`projects.slack.linkChannel`, mirroring `projects.github.linkRepo` and the renamed service. The
single call site, `channel-picker.client.tsx`, was updated in the same commit. The other eight keys
(`github.getLink`, `github.listRepos`, `github.linkRepo`, `github.unlinkRepo`, `github.updateLink`,
`slack.getLink`, `slack.listChannels`, `slack.updateLink`) already mirror their service once the
tracker the sub-router carries is dropped, so they are untouched, and `unlinkRepo` stays the precise
write verb the ticket asks for.

**Plan gating stayed at the transport edge.** Four of the nine operations were
`planAwareProcedure.use(enforceFeature(...))` and still are: `github.linkRepo`, `github.updateLink`,
`slack.linkChannel`, `slack.updateLink`. A plan denial is transport policy with no domain-error
equivalent, so it never entered a service. The five others keep `protectedProcedure`. No
`UNAUTHORIZED` and no rate limit is involved.

**Authorization, all of it in the services.** Every denial needs a loaded row or the resolved active
Organization, so none could stay at the transport edge.

| Denial                                                | Where it lives now                                                                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| "Project not found."                                  | `NotFoundError` in `getProjectGitHubLink`, `getProjectSlackLink`, `linkRepo`, `unlinkRepo`, `linkSlackChannel`, `updateProjectSlackLink` |
| "No GitHub link found for this project."              | `NotFoundError` in `updateProjectGitHubLink`                                                                                             |
| "No Slack workspace connected."                       | `NotFoundError` in `listSlackChannels` and `linkSlackChannel`                                                                            |
| "No active organization."                             | `BadRequestError` in `listAccessibleRepos` and `listSlackChannels`                                                                       |
| "No GitHub installation found. Connect GitHub first." | `BadRequestError` in `linkRepo`                                                                                                          |
| "Access denied."                                      | `ForbiddenError` in the two link reads                                                                                                   |
| "Only owners and admins can …"                        | `ForbiddenError` in the seven remaining services, each with its original wording                                                         |

The predicate is the one found in the code and is kept: the two link reads accept any member of the
Project's Organization, the seven other operations require `role: { in: ["owner", "admin"] }`.
`updateProjectGitHubLink` reaches the Organization through the link's `project` relation, the same
shape part 3 used for the Reviewer writes.

**Better-Auth in a service.** The two lookups resolved the active Organization from
`auth.api.getFullOrganization` inside the procedure. They now take `headers` as an explicit named
value (`{ userId, headers }`), the router passes `await headers()`, and no service sees the tRPC
context. This follows the shape the Subscription domain and the integrations scope already use.

**Reclassified errors.** None. The segment held no `INTERNAL_SERVER_ERROR` and no generic wrapper.
Every `TRPCError` became the `DomainError` subclass of the same code with the same message, so no
toast or form error changes wording. `listAccessibleRepos` still returns `[]` rather than throwing
when the Organization has no GitHub installation.

**Nothing reachable from an Inngest function throws a `DomainError`.** None of the nine services is
imported by anything under `src/server/`, and none of them sends an Inngest event.

**Services holding a database client.** All nine: each holds an authorization check and a domain
error branch, and none is a pass-through read.

**Output types.** The nine `inferProcedureOutput` aliases of the segment are gone. The four reads
export `<Service>Output` derived from their own function: `GetProjectGitHubLinkOutput` (consumed by
`linked-repo-view.client.tsx`), `ListAccessibleReposOutput` (`repo-picker.client.tsx`),
`ListSlackChannelsOutput` (`channel-picker.client.tsx`) and `GetProjectSlackLinkOutput`, which has
no importer and is kept because the read's return type is the type source of truth. The five write
aliases are dropped rather than replaced: no file imported any of them. The three client imports
changed path only; the type names are unchanged.

**Schemas.** Three new pure-Zod schema files for the operations that parsed an inline
`z.object({ projectId })` in the procedure (`get-project-github-link.schema.ts`,
`get-project-slack-link.schema.ts`, `unlink-repo.schema.ts`), and four moved with their service.
`LinkRepoSchemaType` and `UpdateProjectLinkSchemaType` became `LinkRepoInput` and
`UpdateProjectGitHubLinkInput`, which is the 13 to 9 burn-down of `require-schema-conventions`
below. `LinkRepoSchema` keeps its two `.default()` calls and needs no `Values` companion: no form
resolver consumes it, only the tRPC `.input()`.

**Tests.** Three colocated files, eleven cases, all driven through the trailing database client with
no tRPC context built. `link-repo.test.ts` (4) pins the not-found, the owner/admin predicate, the
missing-installation `BadRequestError` and the upsert against the Organization's installation.
`link-slack-channel.test.ts` (4) pins the two not-found branches, the privileged predicate and the
fact that changing the channel clears a stale health failure. `list-accessible-repos.test.ts` (3)
pins the no-active-organization and non-privileged denials of the header-taking lookup and the empty
list returned when GitHub is not installed; it mocks `@/server/github/github-app`, whose module body
reads `GITHUB_PRIVATE_KEY` at import time.

**Per-scope "must be gone" checks**, restricted to `(authenticated)/(project)`:

| Check                                | Result                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| 1 role suffixes                      | 13 files, down from 22, exactly the Jira (#78) and Linear (#79) operations    |
| 2 old buckets                        | the now-empty `(project)/_utils/` and `settings/_features/jira/_utils/` (#78) |
| 3 `_constants/` inside a scope       | nothing                                                                       |
| 4 `*.types.ts`                       | nothing                                                                       |
| 5 routers in a bucket or a feature   | nothing                                                                       |
| 6 tRPC imported by a service         | nothing                                                                       |
| 7 `TRPCError` in a service           | nothing                                                                       |
| 8 `'use server'` in a service/router | nothing: the thirteen moved modules all dropped the directive                 |
| 9 Prisma outside a service           | 12 files, down from 21, the same set as check 1 minus the scope router        |
| 10 `inferProcedureOutput`            | 13 files, down from 22, all owned by the two later parts                      |

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 105 app
tests (11 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **98 problems, 0
errors, 98 warnings** (88 `no-raw-tailwind-colors` / 9 `require-schema-conventions` / 1
`require-use-client-suffix`), down 4 from the 102 of part 3. `npx next build` compiles and still
lists `/inbox`, `/reviewers` and `/settings`; `pnpm build` is refused by the sandbox, as the earlier
entries record.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                   | Result                                                                |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET …projects.github.getLink`, `github.listRepos`                      | `401 UNAUTHORIZED`, each key resolves and the auth procedure guards   |
| `GET …projects.slack.getLink`, `slack.listChannels`                     | `401 UNAUTHORIZED`, same                                              |
| `POST …projects.github.linkRepo`, `unlinkRepo`, `updateLink`            | `401 UNAUTHORIZED`, same                                              |
| `POST …projects.slack.linkChannel`, `slack.updateLink`                  | `401 UNAUTHORIZED`, the renamed key resolves                          |
| `GET …projects.slack.setProjectChannel`                                 | `404 No procedure found on path`, no call site is left on the old key |
| `GET …` on each of the five mutations                                   | `405` mutation-over-GET, so all five are mounted as mutations         |
| `GET …projects.jira.getLink`, `projects.linear.getLink`, `projects.get` | `401 UNAUTHORIZED`, the unmigrated and migrated siblings both resolve |
| `GET /api/v1/agent/feedbacks` with no bearer token                      | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged       |
| `GET /settings` signed out                                              | `307` to `/login`, the page guard is unchanged                        |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials and no
GitHub App or Slack workspace, so no user can sign in and no Installation exists to link. Linking a
repository, toggling auto-create, unlinking it, picking a Slack channel and toggling the Slack
notification switch are on the QA checklist of issue #77.

**Left for the maintainer.** Nothing new. The now-empty `(project)/_utils/` folder recorded by part 1
is still there: the sandbox refuses `rmdir`.

### `(authenticated)/(project)`, part 5: Jira link settings (issue #78)

Commit: `47c4911`. The six Jira project link operations and the three-step access preamble they share
become services in the existing `settings/_services/` folder, and the `_utils/` folder that sat
inside the Jira feature is emptied. The scope is still **not** locked: issue #79 owns the remaining 7
operations and the `migratedScopes` entry.

**Files moved.** Nine modules with `git mv`, plus four new schema files and one new test file. No
file dissolved, so this segment leaves no `_deprecated_` stub.

| Operation          | Before                                                                          | After                                                     |
| ------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Access preamble    | `settings/_features/jira/_utils/require-jira-access.ts`                         | `settings/_services/get-jira-access.ts`                   |
| Jira link read     | `settings/_features/jira/get-project-jira-link.trpc.query.ts`                   | `settings/_services/get-project-jira-link.ts`             |
| Jira project list  | `settings/_features/jira/link-project/list-jira-projects.trpc.query.ts`         | `settings/_services/list-accessible-jira-projects.ts`     |
| Issue type list    | `settings/_features/jira/link-project/list-jira-issue-types.trpc.query.ts`      | `settings/_services/list-jira-issue-types-for-project.ts` |
| Jira link write    | `settings/_features/jira/link-project/link-jira-project.trpc.mutation.ts`       | `settings/_services/link-jira-project.ts`                 |
| Jira link schema   | `settings/_features/jira/link-project/link-jira-project.schema.ts`              | `settings/_services/link-jira-project.schema.ts`          |
| Jira unlink        | `settings/_features/jira/unlink-project/unlink-jira-project.trpc.mutation.ts`   | `settings/_services/unlink-jira-project.ts`               |
| Jira link update   | `settings/_features/jira/update-link/update-project-jira-link.trpc.mutation.ts` | `settings/_services/update-project-jira-link.ts`          |
| Jira update schema | `settings/_features/jira/update-link/update-project-jira-link.schema.ts`        | `settings/_services/update-project-jira-link.schema.ts`   |

The six operations join the GitHub and Slack services of part 4 in the same flat
`settings/_services/`. The `_features/jira/` subfolders the operations left (`link-project/`,
`unlink-project/`, `update-link/`) keep their client component, which is what a feature is for.

**The feature's `_utils/` fanned out into one shared service.** `requireJiraAccess` was the only
member of that bucket and it is IO, not a pure helper: it loads the Project, checks the caller's
membership in the Project's Organization, and returns the Organization's Jira installation, throwing
on each of the four failures. So `_helpers/` was the wrong home and it became
`settings/_services/get-jira-access.ts`, a read service that four other services call. That is the
first service-calling-a-service of the step, and it is the right seam: the only alternative was
inlining its forty lines four times. It takes the trailing database client and forwards it, so one
test drives the whole preamble.

**Renamed services.** Two, both forced by the naming conventions.

| Before                     | After                          | Why                                                                                                             |
| -------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `requireJiraAccess`        | `getJiraAccess`                | `require-` is not in the closed read vocabulary; the function reads and returns, and the throwing is the denial |
| `listJiraIssueTypes` (own) | `listJiraIssueTypesForProject` | The export already carried the suffix, to avoid colliding with the REST client's `listJiraIssueTypes`           |

The second row is a file rename, not an export rename: `list-jira-issue-types.trpc.query.ts` already
exported `listJiraIssueTypesForProject`, and a `_services/` file is named after its export.
`list-jira-projects.trpc.query.ts` is the same case and becomes `list-accessible-jira-projects.ts`,
matching `list-accessible-jira-sites.ts` in the integrations scope.

**Renamed procedure keys.** None. All six keys (`jira.getLink`, `jira.listProjects`,
`jira.listIssueTypes`, `jira.linkProject`, `jira.unlinkProject`, `jira.updateLink`) already mirror
their service once the tracker the sub-router carries is dropped, exactly as the GitHub keys did in
part 4. No call site changed its key, and the published packages call the `/api/v1/*` REST surface
and never tRPC.

**Plan gating stayed at the transport edge.** `jira.linkProject` and `jira.updateLink` were
`planAwareProcedure.use(enforceFeature("jiraIntegration"))` and still are. `jira.unlinkProject` is
deliberately not plan-gated, so a downgraded Organization can always unlink; the router now carries
that comment, which used to sit on the procedure module. The three reads keep `protectedProcedure`.
No `UNAUTHORIZED` and no rate limit is involved.

**Authorization, all of it in the services.** Every denial needs the loaded Project, so none could
stay at the transport edge.

| Denial                                                        | Where it lives now                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| "Project not found."                                          | `NotFoundError` in `getJiraAccess`, `getProjectJiraLink`, `unlinkJiraProject` |
| "Access denied."                                              | `ForbiddenError` in `getJiraAccess` (read path) and `getProjectJiraLink`      |
| "Only owners and admins can link Jira projects."              | `ForbiddenError` in `getJiraAccess`, called by `linkJiraProject`              |
| "Only owners and admins can change Jira link settings."       | `ForbiddenError` in `getJiraAccess`, called by `updateProjectJiraLink`        |
| "Only owners and admins can unlink Jira projects."            | `ForbiddenError` in `unlinkJiraProject`                                       |
| "Jira is not connected. Connect a Jira site first."           | `BadRequestError` in `getJiraAccess`                                          |
| "The Jira connection needs to be re-authorized."              | `BadRequestError` in `getJiraAccess`                                          |
| "This issue type requires fields Faster Fixes cannot fill: …" | `BadRequestError` in `linkJiraProject`                                        |
| "This project is not linked to a Jira project."               | `NotFoundError` in `updateProjectJiraLink`                                    |

The predicate is the one found in the code and is kept: the two reads accept any member of the
Project's Organization, the three writes require `role: { in: ["owner", "admin"] }`, and the
per-caller denial wording travels as the `adminDeniedMessage` argument it already was.
`getProjectJiraLink` and `unlinkJiraProject` keep their own inline preamble rather than calling
`getJiraAccess`: both must work when the org-level installation is missing or needs
re-authorization, which `getJiraAccess` rejects. That was already true before the move, and the
comments saying so moved with the code.

**Reclassified errors.** None. The segment held no `INTERNAL_SERVER_ERROR` and no generic wrapper.
Every `TRPCError` became the `DomainError` subclass of the same code with the same message, so no
toast or form error changes wording. `linkJiraProject` still swallows a failed webhook registration
with the same `console.error`, because inbound status sync is an enhancement and not a precondition
for linking.

**Nothing reachable from an Inngest function throws a `DomainError`.** None of the seven services is
imported by anything under `src/server/`. The three Jira Inngest functions (`create-jira-issue.ts`,
`sync-jira-issue-status.ts`, `sync-feedback-status-to-jira.ts`) read `ProjectJiraLink` through
Prisma directly and never call these services.

**Services holding a database client.** All seven. The two lookups (`listAccessibleJiraProjects`,
`listJiraIssueTypesForProject`) are pass-through reads in their own body, but they hold their
authorization check transitively through `getJiraAccess` and must forward the client to it, so they
take the trailing parameter too.

**Output types.** The six `inferProcedureOutput` aliases of the segment are gone. The three reads
export `<Service>Output` derived from their own function: `GetProjectJiraLinkOutput` (consumed by
`linked-jira-project-view.client.tsx`), `ListAccessibleJiraProjectsOutput`
(`jira-project-picker.client.tsx`) and `ListJiraIssueTypesForProjectOutput`, which has no importer
and is kept because the read's return type is the type source of truth. `GetJiraAccessOutput` is
added for the same reason. The three write aliases are dropped rather than replaced: no file
imported any of them. The two client imports changed path only; the type names are unchanged.

**Schemas.** Four new pure-Zod schema files for the operations that parsed an inline `z.object` in
the procedure (`get-project-jira-link.schema.ts`, `list-accessible-jira-projects.schema.ts`,
`list-jira-issue-types-for-project.schema.ts`, `unlink-jira-project.schema.ts`), and two moved with
their service. `LinkJiraProjectSchemaType` and `UpdateProjectJiraLinkSchemaType` became
`LinkJiraProjectInput` and `UpdateProjectJiraLinkInput`, which is the 9 to 5 burn-down of
`require-schema-conventions` below. `JiraLabelSchema` stays in `link-jira-project.schema.ts` and the
update schema keeps importing it from there, one folder closer than before. `LinkJiraProjectSchema`
has no `.default()` call, so the form resolver in `jira-project-picker.client.tsx` types itself on
`LinkJiraProjectInput` and needs no `Values` companion.

**Tests.** One colocated file, seven cases, all driven through the trailing database client with no
tRPC context built. `get-jira-access.test.ts` pins the whole shared preamble: the unknown Project,
the plain-member denial, the privileged denial with its caller-supplied wording, the fact that the
owner/admin role predicate is applied only when `requireAdmin` is set, the missing installation, the
`reconnect_required` installation, and the successful return. The four services that call it inherit
that coverage; the three branches left (the inline preamble of `getProjectJiraLink` and
`unlinkJiraProject`, and the missing-link branch of `updateProjectJiraLink`) repeat shapes that part
3 and part 4 already pin.

**Per-scope "must be gone" checks**, restricted to `(authenticated)/(project)`:

| Check                                | Result                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------- |
| 1 role suffixes                      | 7 files, down from 13, exactly the Linear operations (#79)              |
| 2 old buckets                        | the now-empty `(project)/_utils/` and `settings/_features/jira/_utils/` |
| 3 `_constants/` inside a scope       | nothing                                                                 |
| 4 `*.types.ts`                       | nothing                                                                 |
| 5 routers in a bucket or a feature   | nothing                                                                 |
| 6 tRPC imported by a service         | nothing                                                                 |
| 7 `TRPCError` in a service           | nothing                                                                 |
| 8 `'use server'` in a service/router | nothing: the six moved procedure modules all dropped the directive      |
| 9 Prisma outside a service           | 7 files, down from 12, the same set as check 1                          |
| 10 `inferProcedureOutput`            | 7 files, down from 13, all owned by part 6                              |

The Jira feature's `_utils/` folder is empty: its only file left with `git mv`. It still shows in
check 2 because the sandbox refuses `rmdir`, the same reason `(project)/_utils/` is still listed.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 112 app
tests (7 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **94 problems, 0 errors,
94 warnings** (88 `no-raw-tailwind-colors` / 5 `require-schema-conventions` / 1
`require-use-client-suffix`), down 4 from the 98 of part 4. `npx next build` compiles and still lists
`/inbox`, `/reviewers` and `/settings`; `pnpm build` is refused by the sandbox, as the earlier
entries record.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                      | Result                                                                |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `GET …projects.jira.getLink`, `jira.listProjects`, `jira.listIssueTypes`   | `401 UNAUTHORIZED`, each key resolves and `protectedProcedure` guards |
| `POST …projects.jira.linkProject`, `jira.unlinkProject`, `jira.updateLink` | `401 UNAUTHORIZED`, the plan-aware and protected writes both resolve  |
| `GET …` on each of the three mutations                                     | `405` mutation-over-GET, so all three are mounted as mutations        |
| `GET …projects.linear.getLink`, `projects.github.getLink`                  | `401 UNAUTHORIZED`, the unmigrated and migrated siblings both resolve |
| `GET /api/v1/agent/feedbacks` with no bearer token                         | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged       |
| `GET /settings` signed out                                                 | `307` to `/login`, the page guard is unchanged                        |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials and no
Atlassian app, so no user can sign in and no `JiraInstallation` exists to link against. Picking a Jira
project and issue type, the required-fields rejection, toggling auto-create, editing the default
labels and unlinking are on the QA checklist of issue #78.

**Left for the maintainer.** Nothing new beyond one more empty folder:
`settings/_features/jira/_utils/` joins `(project)/_utils/`, both emptied by `git mv` and both kept
on disk because the sandbox refuses `rmdir`. Git does not track empty folders, so neither appears in
the commit.

### `(authenticated)/(project)`, part 6: Linear link settings, and the scope lock (issue #79)

Commit: `f3fca41`. The seven Linear team link operations become services in the existing
`settings/_services/` folder, which closes the last segment of the 44-operation Project scope. The
scope is now listed in `migratedScopes` and its nine rules report at `error`.

**Files moved.** Nine modules with `git mv`, plus four new schema files, one new shared access
service and two new test files. No file dissolved, so this segment leaves no `_deprecated_` stub.

| Operation          | Before                                                                              | After                                                     |
| ------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Linear link read   | `settings/_features/linear/get-project-linear-link.trpc.query.ts`                   | `settings/_services/get-project-linear-link.ts`           |
| Team list          | `settings/_features/linear/link-team/list-accessible-teams.trpc.query.ts`           | `settings/_services/list-accessible-linear-teams.ts`      |
| Team state list    | `settings/_features/linear/link-team/list-team-states.trpc.query.ts`                | `settings/_services/list-linear-team-states.ts`           |
| Team label list    | `settings/_features/linear/link-team/list-team-labels.trpc.query.ts`                | `settings/_services/list-linear-team-labels.ts`           |
| Team link write    | `settings/_features/linear/link-team/link-team.trpc.mutation.ts`                    | `settings/_services/link-linear-team.ts`                  |
| Team link schema   | `settings/_features/linear/link-team/link-team.schema.ts`                           | `settings/_services/link-linear-team.schema.ts`           |
| Team unlink        | `settings/_features/linear/unlink-team/unlink-team.trpc.mutation.ts`                | `settings/_services/unlink-linear-team.ts`                |
| Link update        | `settings/_features/linear/update-link/update-project-linear-link.trpc.mutation.ts` | `settings/_services/update-project-linear-link.ts`        |
| Link update schema | `settings/_features/linear/update-link/update-project-linear-link.schema.ts`        | `settings/_services/update-project-linear-link.schema.ts` |

The three `_features/linear/` subfolders (`link-team/`, `unlink-team/`, `update-link/`) keep their
client component, which is what a feature is for. Linear had no `_utils/` folder of its own.

**Renamed services.** Four file renames, no export renamed: each moved file was named after its
feature folder rather than after its export, and a `_services/` file is named after what it exports.

| Export                      | Before                                | After                             |
| --------------------------- | ------------------------------------- | --------------------------------- |
| `linkLinearTeam`            | `link-team.trpc.mutation.ts`          | `link-linear-team.ts`             |
| `listAccessibleLinearTeams` | `list-accessible-teams.trpc.query.ts` | `list-accessible-linear-teams.ts` |
| `listLinearTeamStates`      | `list-team-states.trpc.query.ts`      | `list-linear-team-states.ts`      |
| `listLinearTeamLabels`      | `list-team-labels.trpc.query.ts`      | `list-linear-team-labels.ts`      |

**One shared preamble extracted: `getLinearAccess`.** `listLinearTeamStates` and
`listLinearTeamLabels` held the same twenty-line preamble twice (privileged membership, installation
lookup, decrypt, build the SDK client) and differed only in the resolver they call afterwards. It
became `settings/_services/get-linear-access.ts`, the Linear twin of part 5's `getJiraAccess`, with
one difference recorded on the function: it starts from the **caller's** privileged membership, not
from a Project, because the two pickers run before any team is attached to a Project. That predicate
is the one found in the code and is preserved as is; a user who administrates several Organizations
still resolves through `findFirst`, which is pre-existing behaviour and not something this
behaviour-preserving step changes. `listAccessibleLinearTeams` deliberately does **not** use it: it
resolves the Organization from the Better-Auth session instead, and returns `[]` rather than throwing
when no installation exists, so the section can render its connect prompt.

**Renamed procedure keys.** None. All seven keys (`linear.getLink`, `linear.listTeams`,
`linear.listTeamStates`, `linear.listTeamLabels`, `linear.linkTeam`, `linear.unlinkTeam`,
`linear.updateLink`) already mirror their service once the `projects` and `linear` nouns the routers
carry are dropped, exactly as the GitHub and Jira keys did in parts 4 and 5. No call site changed its
key, and the published packages call the `/api/v1/*` REST surface and never tRPC.

**Reclassified errors.** None. The segment had no `INTERNAL_SERVER_ERROR` throw, so every
`TRPCError` became the `DomainError` subclass of the same code with the same message.

**Plan gating stayed at the transport edge.** `linear.linkTeam` and `linear.updateLink` keep
`planAwareProcedure.use(enforceFeature("linearIntegration"))`. `linear.unlinkTeam` is deliberately
not plan-gated, so a downgraded Organization can always unlink; the comment that used to sit on the
procedure module now sits on the router key. The four reads keep `protectedProcedure`. No
`UNAUTHORIZED` and no rate limit is involved.

**Authorization, all of it in the services.** Every denial needs a row the service loads (the
Project, or the caller's membership), so none could stay at the transport edge.

| Denial                                                | Where it lives now                                               |
| ----------------------------------------------------- | ---------------------------------------------------------------- |
| "Project not found."                                  | `NotFoundError` in the four Project-scoped services              |
| "Access denied."                                      | `ForbiddenError` in `getProjectLinearLink` and `getLinearAccess` |
| "Only owners and admins can link Linear teams."       | `ForbiddenError` in `linkLinearTeam`                             |
| "Only owners and admins can unlink Linear teams."     | `ForbiddenError` in `unlinkLinearTeam`                           |
| "Only owners and admins can update the Linear link."  | `ForbiddenError` in `updateProjectLinearLink`                    |
| "Only owners and admins can list teams."              | `ForbiddenError` in `listAccessibleLinearTeams`                  |
| "No active organization."                             | `BadRequestError` in `listAccessibleLinearTeams`                 |
| "Linear is not connected."                            | `BadRequestError` in `getLinearAccess`                           |
| "No Linear installation found. Connect Linear first." | `BadRequestError` in `linkLinearTeam`                            |

**Services holding a database client.** All eight. The two team lookups are one call each in their
own body, but they hold their authorization check transitively through `getLinearAccess` and must
forward the client to it.

**Output types.** The seven `inferProcedureOutput` aliases of the segment are gone, which clears the
last ones in the scope. Two reads export a consumed `<Service>Output`: `GetProjectLinearLinkOutput`
(`linked-team-view.client.tsx`) and `ListAccessibleLinearTeamsOutput` (`team-picker.client.tsx`).
`ListLinearTeamStatesOutput`, `ListLinearTeamLabelsOutput` and `GetLinearAccessOutput` have no
importer and are kept because the read's return type is the type source of truth. The three write
aliases are dropped rather than replaced: no file imported them. The two client imports changed path
only, plus the one type name below.

**Schemas.** Four new pure-Zod schema files for the operations that parsed an inline `z.object` in
the procedure (`get-project-linear-link.schema.ts`, `list-linear-team-states.schema.ts`,
`list-linear-team-labels.schema.ts`, `unlink-linear-team.schema.ts`), and two moved with their
service. `LinkLinearTeamSchemaType` and `UpdateProjectLinearLinkSchemaType` became
`LinkLinearTeamInput` and `UpdateProjectLinearLinkInput`, which is the 5 to 1 burn-down of
`require-schema-conventions` below. `LinearPrioritySchema` stays next to `LinkLinearTeamSchema` and
the update schema keeps importing it from there, now a sibling instead of a folder away.
`LinkLinearTeamSchema` has no `.default()` call, so `team-picker.client.tsx` types its form on
`LinkLinearTeamInput` and needs no `Values` companion. The update schema stays a discriminated union,
so `updateProjectLinearLink` takes its input as one named argument object rather than destructuring
it: destructuring would erase the `kind` narrowing the two update branches rely on.

**Tests.** Two colocated files, eight cases, all driven through the trailing database client with no
tRPC context built. `get-linear-access.test.ts` pins the shared preamble (the denial, the missing
installation, the owner/admin predicate, and the client built from the decrypted token, with the
Linear SDK and the token cipher mocked), so both team lookups inherit that coverage.
`link-linear-team.test.ts` pins the three denials of the link write and the fact that a re-link
clears `linkHealthIssue`. The branches left (the read's membership check, the unlink denial, the two
update branches) repeat shapes parts 3 to 5 already pin.

**Scope lock.** `"(authenticated)/(project)"` is now an entry of `migratedScopes`, which raises the
nine step 3 rules to `error` over the whole scope. The `(authenticated)` shell entry keeps its
`(project)` ignore: every child segment of the route group is locked under its own entry, and the
shell entry must not match a scope root that is not its own. All four ignored children now have their
own entry, and the whole array goes at the final lock (issue #82).

**Per-scope "must be gone" checks**, restricted to `(authenticated)/(project)`:

| Check                                | Result                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------- |
| 1 role suffixes                      | nothing, down from 7                                                    |
| 2 old buckets                        | the now-empty `(project)/_utils/` and `settings/_features/jira/_utils/` |
| 3 `_constants/` inside a scope       | nothing                                                                 |
| 4 `*.types.ts`                       | nothing                                                                 |
| 5 routers in a bucket or a feature   | nothing                                                                 |
| 6 tRPC imported by a service         | nothing                                                                 |
| 7 `TRPCError` in a service           | nothing                                                                 |
| 8 `'use server'` in a service/router | nothing: the seven moved procedure modules all dropped the directive    |
| 9 Prisma outside a service           | nothing, down from 7                                                    |
| 10 `inferProcedureOutput`            | nothing, down from 7                                                    |

Both folders in check 2 are empty and untracked: `git mv` emptied them in parts 1 and 5, git does not
track empty folders, and the sandbox refuses `rmdir`. They are on the maintainer's stub-deletion pass
(issue #81).

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 120 app
tests (8 new) plus the ESLint rule and config tests; `pnpm lint:agent-rules` **90 problems, 0 errors,
90 warnings** (88 `no-raw-tailwind-colors` / 1 `require-schema-conventions`, the agent API's
`agent.schema.ts`, owned by issue #80 / 1 `require-use-client-suffix`,
`src/lib/trpc/trpc-provider.tsx`, outside `src/app`), down 4 from the 94 of part 5 and now with the
Project scope locked at `error`. `npx next build` compiles and still lists `/inbox`, `/reviewers` and
`/settings`; `pnpm build` is refused by the sandbox, as the earlier entries record.

**Smoke, walked on 2026-09-18 against `next dev` with dummy environment values:**

| Check                                                                           | Result                                                                     |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `GET …projects.linear.getLink`, `listTeams`, `listTeamStates`, `listTeamLabels` | `401 UNAUTHORIZED`, each key resolves and `protectedProcedure` guards      |
| `POST …projects.linear.linkTeam`, `unlinkTeam`, `updateLink`                    | `401 UNAUTHORIZED`, the plan-aware and protected writes both resolve       |
| `GET …` on each of the three mutations                                          | `405` mutation-over-GET, so all three are mounted as mutations             |
| `GET …projects.linear.doesNotExist`                                             | `404 NOT_FOUND`, so the 401s above are key resolution, not a blanket guard |
| `GET …projects.jira.getLink`, `github.getLink`, `feedback.list`                 | `401 UNAUTHORIZED`, the sibling segments of the locked scope still resolve |
| `GET /api/v1/agent/feedbacks` with no bearer token                              | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged            |
| `GET /settings` signed out                                                      | `307` to `/login`, the page guard is unchanged                             |

**Not smoked here, and why.** The sandbox `.env.local` holds placeholder Postgres credentials and no
Linear OAuth application, so no user can sign in and no `LinearInstallation` exists to link against.
Picking a team with its default state, labels and priority, toggling auto-create, clearing the
stale-ID warning by saving again, and unlinking are on the QA checklist of issue #79.

**Left for the maintainer.** Nothing new: the same two empty folders recorded by parts 1 and 5.

### `api/v1/agent`, the REST agent API buckets (issue #80)

Commit `d045ea5`. The last scope of step 3 and the only one with no tRPC in it. Nothing was extracted
and nothing was reclassified: the ticket is a bucket rename, so that the structural checks of the
final lock clear without the agent API growing a service layer before step 4 gives it one.

**Buckets.** Three `_utils/` folders, ten files, all moved with `git mv`.

| From                                                      | To                                                           | Why                                  |
| --------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------ |
| `agent/_utils/agent-error.ts`                             | `agent/_helpers/agent-error.ts`                              | pure: builds a `NextResponse`, no IO |
| `agent/_utils/resolve-project-id.ts`                      | `agent/_helpers/resolve-project-id.ts`                       | pure: matches an ID against a list   |
| `agent/_utils/agent.schema.ts`                            | `agent/_services/agent.schema.ts`                            | schemas live next to their services  |
| `agent/_utils/require-agent-auth.ts`                      | `agent/_services/require-agent-auth.ts`                      | IO: token lookup, plan, rate limit   |
| `agent/feedbacks/_utils/list-feedbacks.ts`                | `agent/feedbacks/_services/list-feedbacks.ts`                | IO                                   |
| `agent/feedbacks/_utils/create-feedbacks.ts`              | `agent/feedbacks/_services/create-feedbacks.ts`              | IO                                   |
| `agent/feedbacks/_utils/get-or-create-import-reviewer.ts` | `agent/feedbacks/_services/get-or-create-import-reviewer.ts` | IO                                   |
| `…/[id]/status/_utils/update-feedback-status.ts`          | `…/[id]/status/_services/update-feedback-status.ts`          | IO                                   |

No file was renamed: every basename already satisfied `services-verb-prefix` (`require-`, `list-`,
`create-`, `get-`, `update-`). The two `route.ts` files and the four cross-folder imports were
repointed; nothing outside `src/app/api/v1/agent/` referenced any of the ten files, so the published
packages and the MCP server are untouched by construction.

**Behaviour.** Unchanged, and deliberately so. `agentError` and the `ResolvedAgentToken | NextResponse`
result style stay exactly as they were, no `DomainError` is introduced, and no path, payload, status
code, error code or rate-limit header moved. The only edits inside a file body are import paths, the
type exports below, one comment, and Prettier reflowing two files that were already unformatted at
`HEAD` (the `check-agent-scope` import in `require-agent-auth.ts`, the `inngest.send` payload in
`update-feedback-status.ts`).

**Schemas.** `agent.schema.ts` is the one file the whole scope shares, and it was the last
`require-schema-conventions` warning in the repo: four exported `*Schema` consts and no `Input` type.
It gained `ListFeedbacksQueryInput`, `UpdateFeedbackStatusInput` and `CreateFeedbacksInput`, plus
`ListFeedbacksQueryValues` because `format` carries a `.default("json")`. `FeedbackIdSchema` gets no
companion: it is a bare `z.string().uuid()` whose input type is `string`. The file was already
pure-Zod (its only non-Zod import is the Feedback status enum from the `feedback` domain), so
`schema-must-be-pure-zod` needed nothing. It stays one shared file rather than one schema file per
service: splitting it is an edit no consumer asks for, and the rule does not require it.

**Output types.** Two files match the read vocabulary of `require-trpc-output-type` and now export a
derived return type: `GetOrCreateImportReviewerOutput` and `ListFeedbacksOutput`. The first is an
ordinary Reviewer row. The second is a `NextResponse`, because the agent API answers at the transport
edge and has no data-returning service under its handler until step 4. That is recorded in a comment
above `listFeedbacks` rather than hidden behind an exemption: the alias is still the read's type
source of truth, it just describes a response today. No rule was disabled for this scope.

**Scope lock.** `"api/v1/agent"` is an entry of `migratedScopes`, which raises the nine step 3 rules
to `error` over the whole tier. Verified rather than assumed, with
`ESLINT_AGENT_RULES=1 npx eslint --print-config src/app/api/v1/agent/feedbacks/_services/list-feedbacks.ts`
from `apps/web`: all nine resolve to `2`.

**Per-scope "must be gone" checks**, restricted to `api/v1/agent`:

| Check                                | Result                             |
| ------------------------------------ | ---------------------------------- |
| 1 role suffixes                      | nothing                            |
| 2 old buckets                        | nothing, down from three `_utils/` |
| 3 `_constants/` inside a scope       | nothing                            |
| 4 `*.types.ts`                       | nothing                            |
| 5 routers in a bucket or a feature   | nothing: the scope has no router   |
| 6 tRPC imported by a service         | nothing                            |
| 7 `TRPCError` in a service           | nothing                            |
| 8 `'use server'` in a service/router | nothing                            |
| 9 Prisma outside a service           | nothing, down from 4               |
| 10 `inferProcedureOutput`            | nothing                            |

Check 9 run repo-wide now returns nothing as well: these four files were its last entries outside the
excluded `route.ts` handlers. Check 2 run repo-wide is down to `(auth)/_utils/` and
`(public)/_features/github-stars/_utils/`, which hold only `_deprecated_trpc-router.ts` stubs and are
issue #81's to delete.

**Gate.** `pnpm typecheck` clean (4 tasks); `pnpm lint` 0 warnings (5 tasks); `pnpm test` 120 app
tests plus the ESLint rule and config tests (33 + 16 files); `pnpm lint:agent-rules` **89 problems, 0
errors, 89 warnings** (88 `no-raw-tailwind-colors` / 1 `require-use-client-suffix`,
`src/lib/trpc/trpc-provider.tsx`, outside `src/app`), down 1 from the 90 of the Project scope part 6.
`require-schema-conventions` is at **0** for the first time since the baseline of 28. Every rule of
step 3 now reports zero warnings; the 89 left are the two rules outside this step's definition of
done. `npx next build` compiles and still lists `/api/v1/agent/feedbacks` and
`/api/v1/agent/feedbacks/[id]/status`; `pnpm build` is refused by the sandbox, as the earlier entries
record.

**Smoke, walked on 2026-09-18 against `next dev` on port 3111 with dummy environment values:**

| Check                                                                 | Result                                                            |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `GET /api/v1/agent/feedbacks?project=proj_x`, no bearer token         | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged   |
| `POST /api/v1/agent/feedbacks`, no bearer token                       | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged   |
| `POST /api/v1/agent/feedbacks/<uuid>/status`, no bearer token         | `401 {"error":"Unauthorized","code":"UNAUTHORIZED"}`, unchanged   |
| `GET /api/v1/agent/feedbacks/<uuid>/status`                           | `405`, the route still exports `POST` only                        |
| response headers of the 401                                           | `content-type: application/json`, no rate-limit header, as before |
| `GET …/feedbacks` with a syntactically valid but unknown bearer token | reaches Postgres and fails there, see below                       |

The last row is the useful one for a rename ticket: the server stack trace reads
`listFeedbacks (src/app/api/v1/agent/feedbacks/_services/list-feedbacks.ts) → requireAgentAuth
(src/app/api/v1/agent/_services/require-agent-auth.ts) → resolveAgentToken`, so the moved modules
resolve and the call chain is intact. It ends in `DriverAdapterError: DatabaseNotReachable`.

**Not smoked here, and why.** The sandbox has no Postgres, so no Agent token exists and a real
`feedbacks:read` listing or a `feedbacks:update_status` write cannot be issued: every authenticated
path stops at the token lookup. Listing Feedback in both `json` and `markdown` format, the
`page_url` and `status` filters, a bulk create with its plan-limit rejection, and a status update with
its `feedback/status-changed` fan-out are on the QA checklist of issue #80.

**Left for the maintainer.** Nothing new. The three `_utils/` folders of the agent API are gone from
disk, stubs included: every file in them had surviving logic and moved with `git mv`, so this scope
leaves no `_deprecated_` file behind.

### Corrections to the recipe found by the pilot

The kit's per-scope recipe survived the pilot, with one gap worth writing down.

**The lock mechanism's own test asserted that nothing was locked.** `next-config.test.js` pinned
`migratedScopes` as empty ("locks no scope while the array is empty") and asserted that the schema
rules had exactly one config entry each, so listing the first scope turned three passing tests red.
The tests now track the array instead of its emptiness: `migratedScopes` is exported from
`next.js`, the schema tests assert the burn-down ramp entry and allow one locked block per listed
scope, and the lock test asserts that the expansion of `migratedScopes` is appended last, after the
ramp. Every later scope only edits the array. The final lock deletes the array, its export and the
three tests together.

**A scope can be migrated at one tier while its children are not, and the lock had no way to say
so.** `(authenticated)` is a route group holding the app shell plus four child segments, each a scope
of its own with its own ticket. Listing `"(authenticated)"` as a plain fragment would have raised the
general convention rules to `error` over `account/`, `organization/`, `integrations/` and
`(project)/`, turning about forty burn-down warnings into errors and making
`pnpm lint:agent-rules` red for work no ticket has started. Listing `"(authenticated)/_features"`
instead cannot work either: the services block's glob is
`**/src/app/<scope>/**/_services/**/*.{ts,tsx}`, which needs the fragment to be the scope root.
So an entry of `migratedScopes` may now be either a string or `{ scope, ignores }`, where `ignores`
are the nested scopes the lock does not cover; `migratedScopeEntry` reads both forms and
`migratedScopeConfigs` takes the patterns as a third argument, spreading an `ignores` key into both
blocks only when there is one. Each ignored path disappears from the entry when its own ticket lists
it as a scope, and the whole array goes at the final lock. Two tests were added: one resolves the
severity through ESLint's own matcher to assert the shell is locked while a child segment is not, the
other asserts no `ignores` key appears for a scope that needs none.

**The web app's vitest could not load a `.tsx` module at all.** The app's tsconfig sets
`jsx: "preserve"`, because Next.js compiles JSX itself, and `vitest.config.ts` said nothing about
JSX, so importing any `.tsx` file failed with "Failed to parse source for import analysis because the
content contains invalid JS syntax". It went unnoticed until the first service that renders JSX
(`send-feedback.tsx`, which builds a mail body from a React Email template) needed a test. The fix is
one line in `vitest.config.ts`: `oxc: { jsx: { runtime: "automatic" } }`. Vitest 5 runs on
rolldown-vite, so the `esbuild` option is ignored with a warning and `oxc` is the one that applies.
This is not the jsdom question kit amendment 3 deferred: the environment stays `node` and no
component is rendered, only compiled.

## Step 5 scope log

### The `feedback` and `organization` barrels start exporting (issue #109)

The first foundation ticket of step 5. No file moved, no logic changed: two barrels gained an export
and ten files under `src/server/**` were repointed from a deep path into the app tree to the barrel
address, which is what the lint lock of issue #139 will require.

**Exports added.**

| Barrel                           | Export                                        | Bucket of origin                       |
| -------------------------------- | --------------------------------------------- | -------------------------------------- |
| `_domains/feedback/index.ts`     | `FeedbackStatusEnum`, `type FeedbackStatus`   | `_types/feedback-status.ts`            |
| `_domains/feedback/index.ts`     | `formatDiagnosticTrailLines`                  | `_helpers/format-feedback-markdown.ts` |
| `_domains/organization/index.ts` | `ORGANIZATION_ROLES`, `type OrganizationRole` | `_helpers/organization-roles.ts`       |

Contracts only, per ADR-0010 and the architecture rules: a constant, a Zod enum, two types and one
pure formatter. No service function and no router is exported. `formatFeedbackAsMarkdown` and
`formatFeedbackListAsMarkdown` stay internal, since no file outside the domain asks for them.
`getRoleLabel`, `canManageMembers` and `canManageInvitations` stay internal for the same reason: the
Better Auth plugin only needs the label map.

**Deep imports rewritten** (ten files, import path only):

| File under `src/server/`                    | Was                                                   | Now                           |
| ------------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| `inngest/create-linear-issue.ts`            | `_domains/feedback/_types/feedback-status`            | `@/app/_domains/feedback`     |
| `inngest/sync-feedback-status-to-jira.ts`   | same                                                  | `@/app/_domains/feedback`     |
| `inngest/sync-feedback-status-to-linear.ts` | same                                                  | `@/app/_domains/feedback`     |
| `inngest/update-slack-feedback-message.ts`  | same                                                  | `@/app/_domains/feedback`     |
| `jira/resolve-transition.ts`                | same                                                  | `@/app/_domains/feedback`     |
| `linear/resolve-team-state.ts`              | same                                                  | `@/app/_domains/feedback`     |
| `linear/state-mapping.ts`                   | same                                                  | `@/app/_domains/feedback`     |
| `slack/build-feedback-blocks.ts`            | same                                                  | `@/app/_domains/feedback`     |
| `github/format-issue-body.ts`               | `_domains/feedback/_helpers/format-feedback-markdown` | `@/app/_domains/feedback`     |
| `auth/plugins/organization.tsx`             | `_domains/organization/_helpers/organization-roles`   | `@/app/_domains/organization` |

**The Better Auth organization plugin no longer needs an exemption.** The question issue #109 was
asked to answer for the lint lock (#139): `src/server/auth/plugins/organization.tsx` had exactly one
import into the app tree, `ORGANIZATION_ROLES`, and it now reads the barrel. Verified with
`grep -rn 'from "@/app/' src/server` from `apps/web`: the file's only remaining app-tree import is
the barrel address. **The lint lock must name two exemptions, not three**: the root router
(`trpc/routers/_app.ts`, seven router mounts) and the Better Auth database hooks
(`auth/config/database-hooks.ts`, which calls `getUniqueOrganizationSlug`, a service a barrel may not
export). The organization plugin exemption is dropped.

**What is left inverted after this ticket**, for the tickets that own it:

| Remaining deep import                                                                   | Owner                                         |
| --------------------------------------------------------------------------------------- | --------------------------------------------- |
| `api/validate-origin.ts` → `project/_helpers/normalize-domain`                          | #133 moves the file into the `project` domain |
| `auth/config/database-hooks.ts` → `organization/_services/get-unique-organization-slug` | #139, named exemption                         |
| `trpc/routers/_app.ts` → seven routers                                                  | #139, named exemption (composition)           |

**Gate.** `pnpm typecheck`, `pnpm test` (52 files, 279 tests), `pnpm lint` and `pnpm lint:agent-rules`
all pass at zero. `npx next build` from `apps/web` with dummy environment values lists every route,
the three widget API routes and the two agent API routes included. `pnpm build` is still refused by
the sandbox, and `next build` still needs placeholder values for `GITHUB_PRIVATE_KEY`, the three
token encryption keys and the R2 credentials, as earlier entries record.

### The Plan vocabulary moves into the `subscription` domain (issue #110)

The second foundation ticket of step 5. `@/server/auth/config/subscription-plans` is split: the
vocabulary is now owned by `_domains/subscription`, the Stripe plan list stays with the Better Auth
configuration.

**What moved, and into which bucket.**

| Symbol                                                                                                                                    | New home                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `SubscriptionPlanName`, `SubscriptionStatus`, `PLAN_LIMITS`, `AGENT_API_RATE_LIMITS`, `PLAN_PRICES`, `PLAN_DESCRIPTIONS`, `PLAN_FEATURES` | `subscription/_helpers/subscription-plans.ts`       |
| `PlanLimits`, `LimitableResource`, `FeatureGate`                                                                                          | `subscription/_types/plan-limits.ts`                |
| `SUBSCRIPTION_PLANS`                                                                                                                      | stays in `server/auth/config/subscription-plans.ts` |

Bucket choice: runtime values in `_helpers/`, following the `ORGANIZATION_ROLES` precedent; the three
type-only declarations in `_types/`, following `feedback/_types/feedback-status.ts`. The types read
`typeof PLAN_LIMITS` through an `import type`, so the types file adds no runtime edge.

The server module now imports the vocabulary through the domain barrel, so the Stripe list is built
from the same constants as before and no price identifier leaves `@/server`.

**Importers rewritten.** Twenty-three files outside the domain now import the vocabulary from
`@/app/_domains/subscription`; the four files inside the domain that read the vocabulary use
relative paths, since a domain does not import its own barrel. The four client components that also read `SUBSCRIPTION_PLANS` keep
that one import pointed at `@/server/auth/config/subscription-plans`: switching them is issue #111,
which this ticket unblocks. `plan-selection.client.tsx`, inside the domain, reads the Stripe list too
and is a fifth candidate for #111, which speaks of four.

**The schema purity suppression is gone.** `admin/users/_services/create-subscription.schema.ts` now
imports the two enums from the barrel, so it is pure by the rule's own definition and needs no
`eslint-disable`. The dedicated config block in `packages/eslint-config/next.js` that turned
`reportUnusedDisableDirectives` off for that one file is deleted with it, and
`next-config.test.js` asserts that no per-file block of that kind is left in the config (seam 2).

**One consequence worth knowing.** The barrel also exports `usePlanGate`, a `'use client'` hook, so a
server file that imports the vocabulary now pulls the hook module into its graph. Next replaces it
with a client reference, and vitest loads `@/lib/auth` without executing a hook, so the agent API
route tests and the production build are unaffected. If a future ticket makes that pull expensive,
the fix is to move the hook, not to reopen the barrel rule.

**Gate.** `pnpm typecheck`, `pnpm test` (52 files, 279 web tests; 192 `@workspace/eslint-config`
tests), `pnpm lint` and `pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web`
with dummy environment values lists every route, `/pricing` and the widget and agent API routes
included.

### The client components read the Plan vocabulary (issue #111)

The third foundation ticket of step 5. No client file imports `SUBSCRIPTION_PLANS` any more, so no
client code depends on a price identifier that is `undefined` in the browser. The two importers left
are server-side: the Better Auth Stripe plugin and `subscription/_services/get-plans-prices.ts`.

**Five client files, not four.** The spec counts four; the fifth is
`subscription/upgrade-subscription/plan-selection.client.tsx`, which sits inside the domain and was
already flagged as a candidate by issue #110. All five are rewritten.

**`PAID_PLAN_NAMES` is the replacement.** Four of the five read the Stripe list only for "which Plans
can be subscribed to, in order". That list is `[Pro, Agency]`, which is Plan vocabulary and not Stripe
configuration, so it is now a constant in `subscription/_helpers/subscription-plans.ts`, exported by
the barrel next to the rest of the vocabulary. It is the only symbol this ticket adds.

| File                                                          | Read from the Stripe list                       | Now                                                   |
| ------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `admin/users/[id]/.../subscription-create-dialog.client.tsx`  | plan options, default value                     | `PAID_PLAN_NAMES`                                     |
| `admin/users/[id]/.../subscription-edit-dialog.client.tsx`    | plan options, default value                     | `PAID_PLAN_NAMES`                                     |
| `subscription/upgrade-subscription/plan-selection.client.tsx` | card list, skeleton count, `planNames` argument | `PAID_PLAN_NAMES`                                     |
| `account/billing/.../current-plan-card.client.tsx`            | `plan?.name \|\| subscription.plan`             | `subscription.plan`                                   |
| `account/billing/.../billing-details-card.client.tsx`         | `annualDiscountPriceId`                         | the annual `Stripe.Price.id` of the plans-prices read |

The `id: index + 1` the two admin dialogs built over the Stripe list was never read, and the
`freeTrial?.days` the plan selection passed to `PlanCard` was always `undefined`, because no entry of
the Stripe list declares `freeTrial`. Both are dropped rather than carried over.

**One visible difference, and it is the point of the ticket.** `billing-details-card` told an annual
Subscription from a monthly one by comparing the current Stripe price identifier to
`plan.annualDiscountPriceId`, which is `process.env.PRO_YEARLY_PRICE_ID`. In a client bundle that is
`undefined`, so the comparison never matched and an annual subscriber was shown "Monthly price" with
the monthly amount. Reading the identifier from the plans-prices query, as the ticket requires,
makes the comparison work: an annual subscriber now sees "Annual price" and the annual amount. Worth
a look during the manual pass on `/account/billing` with a yearly Subscription.

**Gate.** `pnpm typecheck`, `pnpm test` (52 files, 279 web tests), `pnpm lint` and
`pnpm lint:agent-rules` all pass at zero. `pnpm build` from `apps/web` with dummy environment values
lists every route.

### The `integration` domain, GitHub pilot part 1 (issue #113)

The first relocation ticket of step 5, and the one that fixes the pattern the Linear (#116), Jira
(#120) and Slack (#125) tickets copy. `_domains/integration/` is created per ADR 0014 and receives
the three GitHub files of the server folder and the three GitHub durable functions. No behaviour
changed: every edit in the six moved files is an import path.

**Files moved.** Six modules with `git mv`, plus the domain barrel. No file dissolved, so this ticket
leaves no `_deprecated_` stub.

| Before                                             | After                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| `server/github/github-app.ts`                      | `_domains/integration/_services/github/github-app.ts`                             |
| `server/github/format-issue-body.ts`               | `_domains/integration/_helpers/github/format-issue-body.ts`                       |
| `server/github/verify-webhook.ts`                  | `_domains/integration/_helpers/github/verify-webhook-signature.ts`                |
| `server/inngest/create-github-issue.ts`            | `_domains/integration/_services/github/create-github-issue.inngest.ts`            |
| `server/inngest/sync-github-issue-status.ts`       | `_domains/integration/_services/github/sync-github-issue-status.inngest.ts`       |
| `server/inngest/sync-feedback-status-to-github.ts` | `_domains/integration/_services/github/sync-feedback-status-to-github.inngest.ts` |

`src/server/github/` is gone. `src/server/inngest/` keeps the client and the fourteen functions the
later tickets own.

#### The pattern the next providers copy

**Buckets, sub-structured by provider.** `_services/github/` and `_helpers/github/`. No category
level (Tracker, Notification channel) appears in the tree, and no file sits at a bucket root yet: the
first shared file is the OAuth state cookie Linear brings in #116. Bucket choice followed the
existing rule and needed no judgement call: the GitHub App client does IO (it builds an authenticated
Octokit) and is a service; issue body formatting and webhook signature verification are pure and are
helpers.

**Durable function files.** `<function-name>.inngest.ts` inside the services bucket, one file per
function, exporting the same symbol as before. `.inngest.ts` is already exempt from
`services-verb-prefix` and from `require-trpc-output-type`, so the suffix is not decoration: it is
what tells the two rules the file is a job and not a read. `services-no-bare-error` still applies to
it. The three functions kept their identifier (`create-github-issue`, `sync-github-issue-status`,
`sync-feedback-status-to-github`), their triggers, their concurrency keys and their retries; the
registration route imports each by deep path and still registers seventeen functions.

**Renames, decided by running the rules, not in advance.** One rename in six files:
`verify-webhook.ts` became `verify-webhook-signature.ts`, so the helper is named after its export.
`github-app.ts` **keeps its noun name inside `_services/`**, and this is the correction worth
carrying: `services-verb-prefix` only checks the `<token>-` shape of the basename, so `github-`
satisfies it, and `require-trpc-output-type` only fires on the closed read-verb set, which
`github-app` is not in. Running the rules on the file therefore reports nothing, which is the test
the spec sets for an SDK client module ("keeps a noun name only if the verb-prefix rule allows it").
`linear-client.ts`, `jira-client.ts`, `jira-rest-client.ts` and `slack-client.ts` clear the same bar,
so the following tickets should move them under their noun name rather than invent a `get-` name. A
file whose basename has no dash at all (`crypto.ts`, `errors.ts`) does **not** clear it and must be
renamed when it lands in a services bucket.

**Error classes: none created here, by design.** The GitHub files contain no `throw new Error(` and
no throw at all, so the pilot had no bare error site to convert and creating an unused request or
configuration class would be dead code. The shape the next ticket creates on its first real site:
a plain `Error` subclass per provider for an upstream failure (`LinearRequestError`, following the
existing `JiraRequestError`), and **one** shared configuration error class at the services bucket
root for a missing environment value or an impossible configuration, since every provider needs the
same one. Neither is a `DomainError`: they keep surfacing as a masked 500 at a transport and keep
default retries in a durable function (ADR 0012). Linear (#116) creates both.

**Intra-domain imports are relative, cross-domain imports go through the barrel.** The durable
functions reach the client with `./github-app` and the formatter with
`../../_helpers/github/format-issue-body`, following the `_domains/*/` precedent. The formatter
reaches the Feedback domain through `@/app/_domains/feedback`, the export #109 added, so
`no-cross-domain-deep-import` has nothing to report on a domain file that formats a Feedback.

**The barrel is empty.** `_domains/integration/index.ts` is `export {}` with a comment: no other
domain imports the integration domain, and route scopes and route handlers reach its services by deep
path, exactly as they do for every other domain. Do not publish a service through it.

**Two temporary inverted imports, created on purpose.** `server/inngest/create-linear-issue.ts` and
`server/jira/format-issue-adf.ts` both reuse the GitHub formatter, so until #116 and #120 move them
they read `@/app/_domains/integration/_helpers/github/format-issue-body` from the server folder. That
is two more `src/server` → app-tree deep imports than the three #109 left, and they disappear with
their own files; the lint lock (#139) lands after both. Once Jira moves, that import becomes the
intra-domain one #120 asks for.

**Consumers rewritten.** Six files, import paths only: the registration route
(`api/inngest/route.ts`, three imports), the GitHub setup route, the GitHub webhook route, the
Project settings repo list service and its test (mock path only), plus the two server-folder files
above. The locked `(authenticated)/(project)` scope changed one import line and its test changed one
`vi.mock` path, which is the whole of what a locked scope is allowed to change.

**Still owned by the following tickets.** The setup route still queries Prisma inline for the Member
check (#115) and the webhook route still owns deduplication, the Installation lookup and the event
emission (#114). This ticket is the relocation only.

**Gate.** `pnpm typecheck`, `pnpm test` (52 files, 279 web tests), `pnpm lint` and
`pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web` with dummy environment
values lists every route, `/api/github/setup`, `/api/webhooks/github` and `/api/inngest` included.

**Smoke, walked on 2026-09-19 against `next dev` on port 3111 with dummy environment values:**

| Check                                                                     | Result                                                                        |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `GET /api/inngest`                                                        | `200`, `"function_count":17`, so every relocated function is still registered |
| `POST /api/webhooks/github` with a wrong signature                        | `401 {"error":"Invalid signature"}`, unchanged                                |
| `POST /api/webhooks/github` with a valid signature and an unhandled event | `200 {"ok":true}`, unchanged                                                  |
| `POST /api/webhooks/github` with a valid signature and an unparsable body | `400`, unchanged                                                              |
| `GET /api/github/setup` with no `installation_id`                         | `307` to `/integrations?error=missing_installation_id`, unchanged             |
| `GET /api/github/setup?installation_id=42` signed out                     | `307` to `/login?nextUrl=…/api/github/setup?installation_id=42…`, unchanged   |
| `GET …authenticated.projects.github.getLink`, `github.listRepos`          | `401 UNAUTHORIZED`, both keys of the locked scope still resolve               |

**Not smoked here, and why.** The sandbox has no Postgres and no GitHub App, so nothing past the
signature check and the session check runs. The checklist below is for the maintainer.

### The GitHub webhook behind a `handle-` service, pilot part 2 (issue #114)

The second pilot ticket, and the one that fixes the webhook shape the Linear (#118) and Jira (#122)
tickets copy. `POST /api/webhooks/github` keeps the signature verification and the JSON parse and
delegates everything after them to one orchestration service. GitHub gets the same responses it got
before, byte for byte.

**Characterization tests first.** `api/webhooks/github/route.test.ts`, fourteen cases, committed
green against the current handler in its own commit (`39e7769`) before a line of the route moved, and
not edited by the extraction. They call `POST` with a `NextRequest`, fake only `@workspace/db` and
`@/server/inngest`, and assert status and exact JSON body. The signature is computed for real with an
HMAC over the raw body, so the verification helper stays inside the covered path rather than being
mocked away. Nothing asserts which function the route calls, which is why the extraction left them
untouched.

**The rows, and what GitHub actually answers today.**

| Policy row                    | GitHub's response                                | Covered by                                                                                                                                 |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Signature invalid or missing  | `401 {"error":"Invalid signature"}`              | two tests (wrong signature, no header)                                                                                                     |
| Body unreadable               | `400 {"error":"Invalid JSON payload"}`           | one test                                                                                                                                   |
| Authentic but not for us      | `200 {"ok":true}`                                | five tests (unknown event, no event header, unhandled `issues` and `installation` actions, `installation.created` with no matching record) |
| Duplicate delivery            | `200 {"ok":true,"skipped":"duplicate delivery"}` | one test, plus one on the delivery key written                                                                                             |
| Accepted                      | `200 {"ok":true}`                                | four tests (closed, reopened, uninstall, no delivery id)                                                                                   |
| Linear signing secret missing | not applicable to GitHub                         | nothing                                                                                                                                    |

**The `ignored` row has no reason in the body, and that is deliberate.** The parent spec's table says
"200 with an `ignored` reason"; GitHub's current body is a bare `{"ok":true}`. The spec's own rule for
a conflict is that the current response wins, so the reason lives in the service's outcome and in the
logs, not in the response. Linear and Jira should check their own current bodies the same way rather
than copy this one.

#### The shape the next Trackers copy

**One service per Tracker, named with the reserved `handle-` verb.**
`_domains/integration/_services/github/handle-github-webhook.ts` exports
`handleGitHubWebhook({ event, deliveryId, payload })`. It owns deduplication, the Installation lookup
and the event emission; the route owns authentication and the HTTP mapping. `handle-` is the
write-orchestration verb of ADR-0011 for exactly this, so `services-verb-prefix` accepts the file
with no rename.

**One shared outcome type, at the domain's `_types/` bucket root.**
`_domains/integration/_types/webhook-outcome.ts` exports `TrackerWebhookOutcome`:

```ts
export type TrackerWebhookOutcome =
  | { status: "accepted" }
  | { status: "ignored"; reason: string }
  | { status: "skipped"; reason: "duplicate delivery" };
```

It sits at the bucket root, not under `github/`, because the three Trackers differ in what they
authenticate and not in what they decide once a delivery is authentic: Linear and Jira return this
type unchanged. This is the first file at a bucket root of the domain, ahead of the OAuth state
cookie #116 brings. The route maps it, and only it: `skipped` becomes the body with the marker,
`accepted` and `ignored` both become `{"ok":true}`.

**What the route keeps.** Reading the raw body, the signature or token check, the JSON parse and the
outcome-to-HTTP mapping above. Everything that needs the database is behind the service, so the route
imports no database client: that is the "must be gone" check #140 runs over the API tree.

**Replay protection stays a `rateLimit` row.** `isFirstDelivery` is a private function of the service
file: it writes `webhook:github:<delivery id>` and reads a unique constraint violation as "already
processed". Moving it did not change the key, so a delivery replayed across the deploy is still
recognised. A delivery with no `x-github-delivery` header skips deduplication, as before.

**No error class, again.** The service throws nothing: an unhandled event is an outcome, not a
failure, and an infrastructure failure propagates to Next as it did from the route. Linear (#116)
still owns creating the first provider request error class and the shared configuration error class.

**Not this ticket.** The setup route still queries Prisma inline for the Member check (#115).

**Gate.** `pnpm typecheck`, `pnpm test` (53 files, 293 web tests; 192 `@workspace/eslint-config`
tests), `pnpm lint` and `pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web`
with dummy environment values lists every route, `/api/webhooks/github` included.

### The GitHub setup route behind services, pilot part 3 (issue #115)

The third pilot ticket, and the one that fixes where the Member authorization check and the
Installation upsert live for the Linear (#119), Jira (#123) and Slack (#126) OAuth tickets.
`GET /api/github/setup` keeps the session, the Organization and the redirect mapping and delegates
every read and write behind them to three services. It imports no database client, and a User coming
back from the GitHub App installation lands exactly where they landed before.

**Characterization tests first.** `api/github/setup/route.test.ts`, nine cases, committed green
against the current handler in its own commit (`579d5ac`) before a line of the route moved, and not
edited by the extraction. They call `GET` with a `NextRequest`, fake `@workspace/db`, `@/server/auth`
and the GitHub App client, and assert the status and the `location` header only: the missing
installation id redirect, the signed out redirect to the login screen with its callback url and its
defaulted setup action, the no active Organization redirect, the insufficient role refusal, the
installation GitHub does not know, and the two accepted paths (an account with and without an
avatar). Every one of them is a redirect target the integrations screen reads back as a query
parameter, so a test that has to change is a broken contract.

#### The placement decision the three OAuth tickets reuse

| Operation                  | Where it landed                                                                | Why                                                     |
| -------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Member authorization check | `_services/find-installing-member.ts`, at the **bucket root**                  | the same query, verbatim, in all four providers         |
| Installation upsert        | `_services/github/upsert-github-installation.ts`, **under the provider**       | it writes `GitHubInstallation`, a table only GitHub has |
| GitHub App account read    | `_services/github/find-github-installation-account.ts`, **under the provider** | it speaks the GitHub REST API                           |

The rule behind it, and the one the next tickets apply rather than rediscover: **a file whose body
would be identical for another provider sits at the bucket root; a file that names a provider's
table, SDK or API sits under the provider subfolder.** `findInstallingMember` is the second file at a
bucket root of the domain, after the webhook outcome type, and the first shared _service_.

The four call sites were compared before the move and are identical, down to the role list:
`prisma.member.findFirst({ where: { organizationId, userId, role: { in: ["owner", "admin"] } } })` in
the GitHub setup route, both Jira routes, the Linear callback and the Slack callback. So #119, #123
and #126 import `findInstallingMember` unchanged and only write their own
`upsert-<provider>-installation`. Slack's callback redirects to `?slack=error` where the others use
`?error=insufficient_role`: that is the route's mapping, not the service's, and it stays as it is.

**The upload route (#128) is not a fifth caller.** Its Member lookup is the same query but it guards
modifying an Organization's assets, not connecting an Integration, so importing an `integration`
service there would be a cross-domain import justified by a coincidence of shape. If it ever needs a
shared home, that home is the `organization` domain.

#### What else this ticket settled

**The GitHub App read became a service too, not just the database work.** The acceptance criterion
only asks that the route import no database client, but a route that still builds an Octokit and
issues a request is not the shape the agent API template sets. `findGitHubInstallationAccount`
returns `null` for both an unknown installation id and an unreachable GitHub, which is precisely what
the route's `try`/`catch` already did: either way the only thing the caller can do is send the User
back to install the App again.

**Names, decided by running the rules.** `find-` for the two nullable reads, `upsert-` for the write,
no process verb anywhere. Both reads export their `<Service>Output` alias, which
`require-trpc-output-type` requires of a read-verb file; the write needs none.

**The role list stays a literal in the service.** `ORGANIZATION_ROLES` in the `organization` barrel is
a role-to-label map for the UI, not a "may connect an Integration" list, so deriving the filter from
it would read as sharing where there is none. The two roles sit in one named constant in
`find-installing-member.ts` with a one-line comment.

**The account shape lives in the read service.** `GitHubInstallationAccount` is exported from
`find-github-installation-account.ts` and imported as a type by the upsert. A `_types/github/` folder
for three fields would cost more than the coupling it removes, and the type is the read's own return
shape.

**No error class, again.** Every refusal on this route is a redirect carrying an error query
parameter, not a throw, so the pilot still creates none. Linear (#116) owns the first provider
request error class and the shared configuration error class.

**Gate.** `pnpm typecheck`, `pnpm test` (54 files, 302 web tests; 192 `@workspace/eslint-config`
tests), `pnpm lint` and `pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web`
with dummy environment values lists every route, `/api/github/setup` included.

**Not smoked here, and why.** The sandbox has no Postgres and no GitHub App, so nothing past the
session check runs. The rows below are for the maintainer.

### Linear moves into the `integration` domain, part 1 (issue #116)

The second relocation ticket of step 5, and the first to apply the pilot pattern rather than fix it.
The six Linear modules and the shared OAuth state cookie leave the server folder for
`_domains/integration/`. No behaviour changed: every edit outside the two new error classes is an
import path, a file name or a function name.

**Files moved.** Seven modules with `git mv`. No file dissolved, so this ticket leaves no
`_deprecated_` stub.

| Before                                | After                                                                         |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| `server/linear/linear-client.ts`      | `_domains/integration/_services/linear/linear-client.ts`                      |
| `server/linear/crypto.ts`             | `_domains/integration/_services/linear/token-crypto.ts`                       |
| `server/linear/resolve-team-state.ts` | `_domains/integration/_services/linear/get-team-states.ts` (split, see below) |
| `server/linear/state-mapping.ts`      | `_domains/integration/_helpers/linear/state-mapping.ts`                       |
| `server/linear/verify-webhook.ts`     | `_domains/integration/_helpers/linear/verify-webhook-signature.ts`            |
| `server/linear/oauth-state-cookie.ts` | `_domains/integration/_helpers/linear/oauth-state-cookie.ts`                  |
| `server/oauth/state-cookie.ts`        | `_domains/integration/_services/oauth-state-cookie.ts`                        |

`src/server/linear/` and `src/server/oauth/` hold no file. The two directories are left empty on
disk because the agent may not delete anything; git tracks nothing in them, so a fresh clone does
not have them. They are on the maintainer list with the rest.

#### What this ticket decided, for Jira (#120) and Slack (#125) to copy

**The shared cookie is a service at the bucket root, the provider constant is a helper under the
provider.** `_services/oauth-state-cookie.ts` keeps the four functions and the `OAuthStateCookie`
type: it mints a random value, reads and writes cookies on a request and a response, so it is IO.
`LINEAR_OAUTH_STATE_COOKIE` is a two-field constant with no behaviour, so it follows the precedent of
the Organization roles and lands in `_helpers/linear/oauth-state-cookie.ts`, importing the type.
Jira's constant makes the same move in #120; Slack keeps its own two string constants, out of scope
by the parent spec.

**A process verb renames to a read verb plus the result noun, and the file splits to match.**
`resolve-team-state.ts` exported four functions, which is what let a banned verb hide in the file
name. It became four files named after their export, each with the `<Service>Output` alias
`require-trpc-output-type` asks of a read-verb file:

| Export before               | Export after         | File                                        |
| --------------------------- | -------------------- | ------------------------------------------- |
| `getTeamStates`             | unchanged            | `_services/linear/get-team-states.ts`       |
| `getTeamLabels`             | unchanged            | `_services/linear/get-team-labels.ts`       |
| `resolveStateIdForFeedback` | `getFeedbackStateId` | `_services/linear/get-feedback-state-id.ts` |
| `filterValidLabelIds`       | `getValidLabelIds`   | `_services/linear/get-valid-label-ids.ts`   |

The two already-read-verb exports kept their names on purpose: the two migrated Project settings
services that call them (`list-linear-team-states.ts`, `list-linear-team-labels.ts`) then change
only an import path, which is what the ticket allows a locked scope to change. The two renamed
exports have no caller outside the server folder.

**`linear-client.ts` keeps its noun name**, as the pilot predicted: `services-verb-prefix` only
checks the `<token>-` shape and `require-trpc-output-type` only fires on the closed read set.
`crypto.ts` has no dash and does not clear that bar, so the module moved unchanged under the name
`token-crypto.ts` rather than being split into `encrypt-` and `decrypt-` files: factoring the four
token cipher modules is out of scope.

**The two infrastructure error classes the pilot specified now exist.** Both are plain `Error`
subclasses, never a `DomainError`, so they keep surfacing as a masked 500 at a transport and keep
their retries in a durable function (ADR 0012), while `services-no-bare-error` sees a named class.

- `_services/linear/linear-request-error.ts` exports `LinearRequestError`, following the existing
  `JiraRequestError`: Linear answered a request with something we cannot use. Five sites (token
  exchange, token refresh, two revoke paths).
- `_services/integration-configuration-error.ts` exports `IntegrationConfigurationError` at the
  bucket root, for a missing environment value or an impossible configuration: three sites in the
  client (missing client id or secret, twice; no base URL to derive the redirect URI from) and one
  in the webhook signature helper (`LINEAR_WEBHOOK_SIGNING_SECRET` unset). Jira and Slack reuse this
  one class rather than adding their own.

Telling a refusal from an outage for Linear, as #89 did for Jira, stays out of scope: none of the
nine sites becomes a `DomainError` here.

**One cross-bucket import, and why it is allowed.** `_helpers/linear/verify-webhook-signature.ts`
imports `IntegrationConfigurationError` from the services bucket root. The class is shared
vocabulary rather than IO, and the alternative, a second configuration error class per bucket,
contradicts the "one shared configuration error class" the pilot wrote down. The helper stays pure
in the sense the rule cares about: it performs no IO, it reads its secret from the environment as it
did before the move.

**Consumers rewritten.** Thirteen files, import paths only, plus the two renamed call sites:
`app/api/linear/install`, `app/api/linear/callback`, `app/api/webhooks/linear`, `app/api/jira/install`,
`app/api/jira/callback`, `server/jira/oauth-state-cookie.ts`, the three Linear durable functions in
`server/inngest/`, `integrations/_services/disconnect-linear.ts`, and the four `(project)/settings`
services (`get-linear-access.ts` and its test's mock paths,
`list-accessible-linear-teams.ts`, `list-linear-team-states.ts`, `list-linear-team-labels.ts`).

**Three temporary inverted imports, created on purpose**, on top of the two the pilot left. The four
Linear durable functions still in `server/inngest/`, `server/jira/oauth-state-cookie.ts` and the two
Jira OAuth routes now read the relocated modules from the app tree. #117 moves the functions and
#120 moves the Jira cookie, both before the lint lock (#139), so none of them survives to meet it.

**Still owned by the following tickets.** The four Linear durable functions (#117), the webhook route
and its `handle-` service (#118), the install and callback routes and their services (#119). The
webhook route still owns deduplication, the Installation lookup and the event emission, and both
OAuth routes still query Prisma inline.

**Gate.** `pnpm typecheck`, `pnpm test` (54 files, 302 web tests), `pnpm lint` and
`pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web` with dummy environment
values lists every route, `/api/linear/install`, `/api/linear/callback` and `/api/webhooks/linear`
included. The registration route still lists seventeen functions.

**Not smoked here, and why.** The sandbox has no Postgres and no Linear OAuth app, so nothing past
the signature check and the session check runs. The rows below are for the maintainer.

### Linear moves into the `integration` domain, part 2: the four durable functions (issue #117)

The four Linear durable functions follow the six modules #116 moved. Nothing in the server folder
imports the relocated Linear code any more: the three temporary inverted imports #116 created in
`server/inngest/` are gone with their files, and the remaining two (`server/jira/oauth-state-cookie.ts`
and the two Jira OAuth routes) are #120's.

**Files moved.** Four modules with `git mv`, under the `.inngest.ts` suffix the pilot fixed. No file
dissolved, so this ticket leaves no `_deprecated_` stub.

| Before                                             | After                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------- |
| `server/inngest/create-linear-issue.ts`            | `_domains/integration/_services/linear/create-linear-issue.inngest.ts`            |
| `server/inngest/sync-linear-issue-status.ts`       | `_domains/integration/_services/linear/sync-linear-issue-status.inngest.ts`       |
| `server/inngest/sync-feedback-status-to-linear.ts` | `_domains/integration/_services/linear/sync-feedback-status-to-linear.inngest.ts` |
| `server/inngest/handle-linear-oauth-revoked.ts`    | `_domains/integration/_services/linear/handle-linear-oauth-revoked.inngest.ts`    |

`src/server/inngest/` now holds the client and the ten functions Jira (#121), Slack (#125) and the
`user` domain (#127) own.

**Identifiers, triggers and wrappers untouched.** `create-linear-issue`, `sync-linear-issue-status`,
`sync-feedback-status-to-linear` and `handle-linear-oauth-revoked` keep their function identifier,
their triggering event names (`feedback/created`, `feedback/integration-issue-requested` filtered on
`target == 'linear'`, `linear/webhook.issue`, `feedback/status-changed`, `linear/oauth.revoked`),
their concurrency keys and their retry counts, so an in-flight run is not orphaned. None of the four
gains the non-retriable wrapper: only the three Jira functions #91 wrapped have one, so an upstream
Linear outage stays retriable, per user story 21 of the parent spec.

**`handle-` on a durable function is not the webhook verb.** `handle-linear-oauth-revoked.inngest.ts`
keeps the name it had. The `handle-` verb the parent spec reserves is for the one webhook
orchestration service per Tracker (#118), and `.inngest.ts` is exempt from `services-verb-prefix`
anyway, so the two do not collide. Jira's `handle-jira-oauth-revoked` makes the same move in #121.

**One bare error converted, on the only site in the four files.**
`create-linear-issue.inngest.ts` threw a bare `Error` when Linear's `createIssue` mutation returned
no issue. It now throws the `LinearRequestError` #116 created: Linear answered with something we
cannot use, which is exactly what that class is for. It stays a plain `Error` subclass, so the
function keeps its three retries (ADR 0012). The other three files contain no `throw` at all.

**Imports rewritten.** Intra-domain imports became relative (`./token-crypto`, `./linear-client`,
`./get-feedback-state-id`, `./get-valid-label-ids`, `./linear-request-error`,
`../../_helpers/linear/state-mapping`, `../../_helpers/github/format-issue-body`), following the
pilot. The durable function client is reached with `@/server/inngest` rather than the old `./index`,
storage with `@/server/storage/get-signed-asset-url`, and the Feedback Status type through the
`@/app/_domains/feedback` barrel, all unchanged in effect.

**Consumers rewritten.** One file: the registration route (`api/inngest/route.ts`, four imports).
It keeps its static list of seventeen functions.

**Gate.** `pnpm typecheck`, `pnpm test` (54 files, 302 web tests), `pnpm lint` and
`pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web` with dummy environment
values lists every route, `/api/inngest` included. `GET /api/inngest` against `next dev` on port
3117 answers `200` with `"function_count":17`.

**Not smoked here, and why.** The sandbox has no Postgres and no Linear OAuth app, so no function
body runs. The Linear rows below are for the maintainer.

### The Linear webhook behind a `handle-` service, part 3 (issue #118)

The first Tracker to copy the shape the GitHub pilot fixed in #114.
`POST /api/webhooks/linear` keeps the signature verification and the JSON parse and delegates
everything after them to one orchestration service. Linear gets the same responses it got before,
byte for byte.

**Characterization tests first.** `api/webhooks/linear/route.test.ts`, fourteen cases, committed
green against the current handler in its own commit (`b701d0d`) before a line of the route moved, and
not edited by the extraction. Same recipe as GitHub: `POST` called with a `NextRequest`, only
`@workspace/db` and `@/server/inngest` faked, the `linear-signature` header computed for real with an
HMAC over the raw body so the verification helper stays inside the covered path, and assertions on
status and exact JSON body only.

**The rows, and what Linear actually answers today.**

| Policy row                    | Linear's response                                | Covered by                                                                     |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Signature invalid or missing  | `401 {"error":"Invalid signature"}`              | two tests (wrong signature, no header)                                         |
| Body unreadable               | `400 {"error":"Invalid JSON"}`                   | one test                                                                       |
| Authentic but not for us      | `200 {"ok":true,"ignored":"<reason>"}`           | three tests (`no_organization_id`, `no_installation`, `type:<type>`)           |
| Duplicate delivery            | `200 {"ok":true,"skipped":"duplicate_delivery"}` | one test, plus two on the delivery key written and its body-hash fallback      |
| Accepted                      | `200 {"ok":true}`                                | four tests (issue delivery, `remove`, `revoke`, another authentication action) |
| Linear signing secret missing | `500 {"error":"webhook secret not configured"}`  | one test                                                                       |

**Linear's `ignored` bodies carry a reason, GitHub's do not, and both stay as they are.** The parent
spec's rule for a conflict is that the current response wins, so the route echoes the outcome reason
verbatim (`no_organization_id`, `no_installation`, `type:Comment`) instead of adopting GitHub's bare
`{"ok":true}`. A widget or a Tracker never sees a rephrased reason.

**The shared outcome type gained one degree of freedom.** `TrackerWebhookOutcome` typed the `skipped`
reason as the literal `"duplicate delivery"`, GitHub's wording. Linear's marker is
`duplicate_delivery`, so the field is now `string`, documented as "the wording the Tracker already
receives". The `ignored` reason was already a `string`. No other change to the type, and GitHub's
route is untouched.

**What moved, and what the route kept.** `_domains/integration/_services/linear/handle-linear-webhook.ts`
exports `handleLinearWebhook({ deliveryId, rawBody, payload })` and owns deduplication, the
Installation lookup and the two event emissions (`linear/webhook.issue`, `linear/oauth.revoked`). The
route keeps reading the raw body, the signature check with its 500 on a missing secret, the JSON
parse and the outcome-to-HTTP mapping. It imports no database client any more, which is the "must be
gone" check #140 runs over the API tree. `prisma` and `crypto` left the route file with the logic.

**Why the service takes the raw body as well as the parsed payload.** Linear's `linear-delivery`
header is not always present, and the fallback replay key is a SHA-256 of the raw body. Deduplication
belongs to the service, so the fallback follows it rather than being computed in the route; the route
passes the header value as it read it, `null` included. The key prefix `webhook:linear:` is unchanged,
so a delivery replayed across the deploy is still recognised.

**Order of checks preserved.** Deduplication runs before the Organization id check, as it did in the
route, so a replayed delivery with no `organizationId` still answers with the skipped marker and not
with `ignored`. The `LinearWebhookPayload` type moved with the logic.

**No error class, and no new one needed.** The service throws nothing: an unhandled type is an
outcome, not a failure. The 500 on a missing `LINEAR_WEBHOOK_SIGNING_SECRET` is still raised by the
verifier as the `IntegrationConfigurationError` #116 created, caught in the route and logged, exactly
as before.

**Not this ticket.** The Linear install and callback routes still query Prisma inline (#119).

**Gate.** `pnpm typecheck`, `pnpm test` (55 files, 316 web tests; 192 `@workspace/eslint-config`
tests), `pnpm lint` and `pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web`
with dummy environment values lists every route, `/api/webhooks/linear` included.

**Not smoked here, and why.** The sandbox has no Postgres and no Linear workspace, so no delivery
past the signature check runs against real data. The Linear rows below are for the maintainer.

### The Linear OAuth routes behind services, part 4 (issue #119)

The first OAuth pair to reuse the placement the GitHub pilot fixed in #115. `GET /api/linear/install`
and `GET /api/linear/callback` keep every redirect target, query parameter and cookie they have
today; the callback stops querying Prisma inline and stops handling tokens in clear. The OAuth app
registered at Linear needs no reconfiguration.

**Characterization tests first.** `api/linear/install/route.test.ts` (five cases) and
`api/linear/callback/route.test.ts` (fourteen cases), committed green against the current handlers in
their own commit (`6d516d8`) before a line of either route moved, and not edited by the extraction.
Same recipe as the setup route: `GET` called with a `NextRequest`, `@workspace/db`, `@/server/auth`,
the Linear client and the token cipher faked, assertions on status, the `location` header and the
cookies only.

| Route    | Pinned paths                                                                                                                                                                                                                                                                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| install  | signed out to `/login?nextUrl=…`, `?error=no_active_org`, `?error=linear_not_configured`, the authorize url with its six parameters, the httpOnly `linear_oauth_state` cookie echoing the state                                                                                                                                                                              |
| callback | `?error=linear_oauth_<provider error>`, `?error=linear_missing_code_or_state`, `?error=linear_state_mismatch` (wrong cookie and no cookie), `?error=not_authenticated`, `?error=no_active_org`, `?error=insufficient_role`, `?error=linear_token_exchange_failed`, `?error=linear_org_fetch_failed`, `?linear=connected` with the full upsert payload and the cleared cookie |

**The install route needed no extraction.** It reads the session and the active Organization through
Better Auth, mints a state and redirects; it never touched a database client. Its tests are here
because the acceptance criteria ask for both routes to be pinned, and because the state cookie is the
callback's CSRF defence and deserved a recorded shape before the pair was reopened.

**What the callback delegates now.**

| Operation                  | Where it landed                                  | Why                                                             |
| -------------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| Member authorization check | `_services/find-installing-member.ts`, unchanged | the pilot's shared service, imported verbatim as #115 predicted |
| Linear organization read   | `_services/linear/find-linear-organization.ts`   | it speaks the Linear SDK                                        |
| Installation upsert        | `_services/linear/upsert-linear-installation.ts` | it writes `LinearInstallation`, a table only Linear has         |

`findInstallingMember` was taken as it stands: the Linear callback's inline query was the same
`prisma.member.findFirst` with the same role list, so the second caller changed nothing in the
service. That is the first confirmation that the pilot's bucket-root call was right.

**The token encryption moved into the write, not into the route.** The route used to call
`encryptToken` twice and compute the expiry itself. `upsertLinearInstallation` takes the token
response as Linear returned it and owns the encryption, the optional refresh token and the expiry
arithmetic, so the access token never exists in clear inside a route handler. The stored columns are
identical, which the accepted-path test asserts field by field against a frozen clock.

**`findLinearOrganization` collapses two failures into `null`, as the pilot's GitHub read does.** A
revoked token and an unreachable Linear both leave the User with the same single option, so the
service returns `null` and the route keeps mapping it to `?error=linear_org_fetch_failed`.

**The code exchange kept its `try`/`catch` in the route, deliberately.** `exchangeOAuthCode` already
lives in the domain and already throws the two named classes #116 created
(`IntegrationConfigurationError`, `LinearRequestError`). Turning it into a nullable read would erase
a distinction the route needs: its failure maps to `?error=linear_token_exchange_failed`, a different
query parameter from the organization read's. The route maps two outcomes to two targets, which is
route work.

**One type became public.** `OAuthTokenResponse` in `linear-client.ts` is now exported as
`LinearOAuthTokenResponse`, because the upsert service takes it as its input. No field changed and
the two internal uses follow the rename.

**Names, decided by running the rules.** `find-` for the nullable read, `upsert-` for the write, no
process verb. The read exports its `FindLinearOrganizationOutput` alias as
`require-trpc-output-type` demands of a read-verb file; the write needs none.

**No file retired, no stub.** Everything here is an addition or an edit in place.

**Gate.** `pnpm typecheck`, `pnpm test` (57 files, 335 web tests; 192 `@workspace/eslint-config`
tests), `pnpm lint` and `pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web`
with dummy environment values lists every route, `/api/linear/install` and `/api/linear/callback`
included.

**Not smoked here, and why.** The sandbox has no Postgres and no Linear workspace, so nothing past
the session check runs. The Linear rows below are for the maintainer.

### Jira moves into the `integration` domain, part 1 (issue #120)

The third relocation ticket of step 5. The ten Jira modules leave the server folder for
`_domains/integration/`, under `jira` subfolders of the services and helpers buckets, following the
pattern the GitHub pilot (#113) fixed and Linear (#116) confirmed. Outside the seven bare errors that
became named classes, every edit is an import path or a file name: no logic changed.

**Files moved.** Ten modules with `git mv`, the colocated token access test included. No file
dissolved, so this ticket leaves no `_deprecated_` stub.

| Before                                | After                                                         |
| ------------------------------------- | ------------------------------------------------------------- |
| `server/jira/jira-client.ts`          | `_domains/integration/_services/jira/jira-client.ts`          |
| `server/jira/jira-rest-client.ts`     | `_domains/integration/_services/jira/jira-rest-client.ts`     |
| `server/jira/errors.ts`               | `_domains/integration/_services/jira/jira-errors.ts`          |
| `server/jira/token-access.ts`         | `_domains/integration/_services/jira/token-access.ts`         |
| `server/jira/token-access.test.ts`    | `_domains/integration/_services/jira/token-access.test.ts`    |
| `server/jira/crypto.ts`               | `_domains/integration/_services/jira/token-crypto.ts`         |
| `server/jira/webhook-registration.ts` | `_domains/integration/_services/jira/webhook-registration.ts` |
| `server/jira/format-issue-adf.ts`     | `_domains/integration/_helpers/jira/format-issue-adf.ts`      |
| `server/jira/resolve-transition.ts`   | `_domains/integration/_helpers/jira/transition-mapping.ts`    |
| `server/jira/oauth-state-cookie.ts`   | `_domains/integration/_helpers/jira/oauth-state-cookie.ts`    |

`src/server/jira/` holds no file. The empty directory is left on disk because the agent may not
delete anything; git tracks nothing in it, so a fresh clone does not have it. It is on the maintainer
list with `src/server/linear/` and `src/server/oauth/`.

#### What this ticket decided, for Slack (#125) to copy

**Bucket choice needed no judgement call.** The two clients, token access, the token cipher and
webhook registration all do IO and are services; ADF formatting and transition mapping are pure and
are helpers. The Jira OAuth state constant follows the Linear precedent and is a helper under the
provider, importing the `OAuthStateCookie` type from the shared service at the services bucket root.

**Two renames, both forced by the rules, neither touching an export.** `crypto.ts` and `errors.ts`
have no dash in their basename, so they do not clear the `services-verb-prefix` shape check and could
not land in a services bucket unrenamed: they became `token-crypto.ts` (the Linear name, so the two
providers read alike) and `jira-errors.ts`. `jira-client.ts`, `jira-rest-client.ts`,
`token-access.ts` and `webhook-registration.ts` all clear the shape check, and none of them opens
with a read verb, so `require-trpc-output-type` does not ask them for an `<Service>Output` alias.
They moved under their own names, which is what the pilot predicted for an SDK client module.

**`resolve-transition.ts` became `transition-mapping.ts`, and its exports did not move.** The file
lands in `_helpers/`, where neither naming rule reaches it, so the parent spec does not require the
rename. It is done anyway to take the banned process verb `resolve-` out of a filename and to match
the Linear counterpart `_helpers/linear/state-mapping.ts`. The exported `resolveJiraTransition` and
`feedbackStatusFromJiraStatusCategory` keep their names: renaming them would churn the four Jira
durable functions that #121 has yet to move, for no rule.

**The three expected Jira error classes moved unchanged**, still extending `PreconditionFailedError`,
still carrying their final user copy and their fields (ADR 0012, #90). `JiraRequestError` stays a
plain `Error` in `jira-rest-client.ts`. The ADR 0012 line that named `src/server/jira/errors.ts` now
names the new path; the rest of the ADR is #138's.

**Seven bare errors became named classes, none of them a `DomainError`.** `services-no-bare-error` is
always on for `**/_services/**`, so the five sites in the two clients and the one in webhook
registration had to be converted the moment the files landed; no disable comment was used.

| Site                                                  | Class                           |
| ----------------------------------------------------- | ------------------------------- |
| `jira-client`, client id or secret unset              | `IntegrationConfigurationError` |
| `jira-client`, redirect URI cannot be derived         | `IntegrationConfigurationError` |
| `jira-client`, token exchange refused                 | `JiraRequestError`              |
| `jira-client`, accessible-resources fetch refused     | `JiraRequestError`              |
| `jira-rest-client`, webhook registration refused      | `JiraRequestError`              |
| `jira-rest-client`, unparseable webhook expiry        | `JiraRequestError`              |
| `webhook-registration`, webhook URL cannot be derived | `IntegrationConfigurationError` |

The shared `IntegrationConfigurationError` Linear created at the services bucket root is reused
rather than a Jira-specific one, as the pilot specified. The two `jira-rest-client` sites pass status
`200`: the HTTP call itself succeeded and Jira put the refusal in the body, and `200` is what it
actually answered with.

**Why converting those four sites to `JiraRequestError` changes no behaviour.** Three code paths
branch on the class, and all three keep their answer. `isRefusedByAtlassian` in `token-access` only
sees the refresh path, which already threw `JiraRequestError`. `isJiraUnauthorizedError` tests for
status `401`, which none of the four new sites carries. The unknown-registration branch of
`refreshProjectJiraWebhook` tests for `400` or `404`, so an unparseable expiry is still rethrown
rather than re-registered. The two OAuth callback sites are caught with a bare `catch`, so the
redirect query parameters are unchanged. What does change is the message text of the four sites,
which is server-log-only: a transport masks it and a durable function logs it.

**The GitHub formatter is now an intra-domain import.** `_helpers/jira/format-issue-adf.ts` reaches
`formatIssueTitle` with `../github/format-issue-body` instead of the absolute app-tree path #113 left
it with. One of the two temporary inverted imports the pilot created is gone.

**Consumers rewritten.** Fourteen files, import paths only. Two route handlers (`api/jira/install`,
`api/jira/callback`), seven already migrated route services (`integrations/_services/` for the site
list, the site selection and the disconnect; `(project)/settings/_services/` for the link, the
unlink, the project list and the issue-type list), the four Jira durable functions still in
`server/inngest/`, and `server/trpc/domain-error-mapping.test.ts`. The locked scopes changed import
lines and nothing else. The colocated `token-access.test.ts` changed the two dynamic `import()`
paths its renamed siblings forced and passes otherwise untouched.

**Inverted imports, after this ticket.** The Jira cookie constant no longer reads the app tree from
the server folder: it is in the app tree. Four new ones appear in `server/inngest/` (the four Jira
durable functions), and they disappear with their files in #121. One is worth flagging for the lint
lock (#139): `server/trpc/domain-error-mapping.test.ts` imports `JiraReauthRequiredError` by deep
path to assert the tRPC mapping. It is a test rather than composition, so #139 has to either exempt
it by name or let the test reach the class another way.

**Still owned by the following tickets.** The six Jira durable functions (#121), the webhook route
and its `handle-` service (#122), the install and callback routes and their services (#123), the
reconnect mail template (#124). The webhook route still owns deduplication and the event emission,
and both OAuth routes still query Prisma inline.

**Gate.** `pnpm typecheck`, `pnpm test` (57 files, 335 web tests; 192 `@workspace/eslint-config`
tests), `pnpm lint` and `pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web`
with dummy environment values lists every route, `/api/jira/install`, `/api/jira/callback` and
`/api/webhooks/jira/[token]` included. The registration route still lists seventeen durable
functions. Prettier reformatted one call the server folder had left unformatted, in
`webhook-registration.ts`.

**Not smoked here, and why.** The sandbox has no Postgres and no Atlassian site, so nothing past the
session check runs. The Jira rows below are for the maintainer.

### Jira moves into the `integration` domain, part 2: the six durable functions (issue #121)

The six Jira durable functions follow the modules #120 relocated. `src/server/inngest/` now holds
the client and the four functions Slack (#125) and the `user` domain (#127) own.

**Files moved.** Six modules with `git mv`, under the `.inngest.ts` suffix the pilot fixed. No file
dissolved, so this ticket leaves no `_deprecated_` stub.

| Before                                                 | After                                                                               |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `server/inngest/create-jira-issue.ts`                  | `_domains/integration/_services/jira/create-jira-issue.inngest.ts`                  |
| `server/inngest/sync-jira-issue-status.ts`             | `_domains/integration/_services/jira/sync-jira-issue-status.inngest.ts`             |
| `server/inngest/sync-feedback-status-to-jira.ts`       | `_domains/integration/_services/jira/sync-feedback-status-to-jira.inngest.ts`       |
| `server/inngest/handle-jira-oauth-revoked.ts`          | `_domains/integration/_services/jira/handle-jira-oauth-revoked.inngest.ts`          |
| `server/inngest/refresh-jira-webhooks.ts`              | `_domains/integration/_services/jira/refresh-jira-webhooks.inngest.ts`              |
| `server/inngest/refresh-jira-installation-webhooks.ts` | `_domains/integration/_services/jira/refresh-jira-installation-webhooks.inngest.ts` |

**Identifiers, triggers and schedules untouched.** `create-jira-issue`, `sync-jira-issue-status`,
`sync-feedback-status-to-jira`, `handle-jira-oauth-revoked`, `refresh-jira-webhooks` and
`refresh-jira-installation-webhooks` keep their function identifier, their triggering event names
(`feedback/created`, `feedback/integration-issue-requested` filtered on `target == 'jira'`,
`jira/webhook.issue`, `feedback/status-changed`, `jira/oauth.revoked`,
`jira/webhooks.refresh-requested`), their concurrency keys and their retry counts, so an in-flight
run is not orphaned. The weekly refresh keeps its `0 4 * * 1` cron, and keeps fanning out one
`jira/webhooks.refresh-requested` event per connected Installation rather than calling Jira inline.

**The three wrappers stay exactly where they were.** `create-jira-issue`, `sync-jira-issue-status`
and `sync-feedback-status-to-jira` still `.catch(rethrowDomainErrorsAsNonRetriable)` on the step
that can raise an expected Jira error (#90, #91). The other three functions stay unwrapped, so an
Atlassian outage still retries. The helper stays at `@/server/errors/non-retriable`: it is the
cross-cutting boundary helper of ADR 0012 and does not move.

**No bare error to convert.** Unlike Linear (#117), the six Jira files contain no `throw new Error(`
at all: the failure paths already raise the Jira classes #120 relocated, or return a skip marker.

**Imports rewritten.** Intra-domain imports became relative (`./jira-errors`, `./jira-rest-client`,
`./token-access`, `./webhook-registration`, `../../_helpers/jira/format-issue-adf`,
`../../_helpers/jira/transition-mapping`), following the pilot. The durable function client is
reached with `@/server/inngest` rather than the old `./index`, storage with
`@/server/storage/get-signed-asset-url`, and the Feedback Status type through the
`@/app/_domains/feedback` barrel, all unchanged in effect.

**The reconnect mail template stays put for now.** `handle-jira-oauth-revoked.inngest.ts` still
imports `@/lib/mailer/templates/jira-reconnect-required`; moving that template next to the Jira code
is #124, the last Jira ticket. Nothing about the rendered mail changed here.

**Consumers rewritten.** One file: the registration route (`api/inngest/route.ts`, six imports). It
keeps its static list of seventeen functions.

**Gate.** `pnpm typecheck`, `pnpm test` (57 files, 335 web tests), `pnpm lint` and
`pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web` with dummy environment
values lists every route, `/api/inngest` included. `GET /api/inngest` against `next dev` on port
3121 answers `200` with `"function_count":17`.

**Not smoked here, and why.** The sandbox has no Postgres and no Atlassian site, so no function body
runs. The Jira rows below are for the maintainer.

### The Jira webhook behind a `handle-` service, part 3 (issue #122)

The third and last Tracker to copy the shape the GitHub pilot fixed in #114.
`POST /api/webhooks/jira/[token]` keeps the token verification and the JSON parse and delegates
everything after them to one orchestration service. Jira gets the same responses it got before, byte
for byte.

**Characterization tests first.** `api/webhooks/jira/[token]/route.test.ts`, eleven cases, committed
green against the current handler in its own commit (`bcd9641`) before a line of the route moved, and
not edited by the extraction. Same recipe as GitHub and Linear: `POST` called with a `NextRequest`
and a resolved `params` promise, only `@workspace/db` and `@/server/inngest` faked, and assertions on
status and exact JSON body only.

**The rows, and what Jira actually answers today.**

| Policy row                    | Jira's response                                  | Covered by                                                                |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| Unknown token                 | `401 {"error":"Unknown webhook"}`                | one test, plus one on the lookup key                                      |
| Body unreadable               | `400 {"error":"Invalid JSON"}`                   | one test                                                                  |
| Authentic but not for us      | `200 {"ok":true,"ignored":"<reason>"}`           | three tests (`event:<type>`, `event:undefined`, `no_issue_id`)            |
| Duplicate delivery            | `200 {"ok":true,"skipped":"duplicate_delivery"}` | one test, plus two on the delivery key written and its body-hash fallback |
| Accepted                      | `200 {"ok":true}`                                | two tests (issue updated, issue deleted)                                  |
| Linear signing secret missing | not applicable to Jira                           | nothing                                                                   |

**No signature row, because Jira signs nothing.** Jira dynamic webhooks carry no signature (ADR-0008);
the per-installation token in the path is the whole of the authenticity. The signature row of the
policy table is therefore the unknown-token row here, and the test that covers it drives the real
lookup rather than mocking the authentication away.

**`event:undefined` is pinned as it is.** A delivery with no `webhookEvent` gets the template
literal's rendering of `undefined` in the `ignored` reason. The parent spec's rule for a conflict is
that the current response wins, so it is characterized and preserved rather than tidied. Jira's
`ignored` bodies carry a reason like Linear's, unlike GitHub's bare `{"ok":true}`.

**The authentication read is its own service, and that is the correction this ticket adds to the
pilot shape.** For GitHub and Linear, authentication is a pure signature check and the Installation
lookup happens after it, inside the `handle-` service. For Jira the Installation lookup _is_ the
authentication, and `TrackerWebhookOutcome` states that authentication failures never reach the
service. So the lookup became a second, read-named service,
`_services/jira/find-jira-installation-by-webhook-token.ts`, which the route calls itself and maps to
the 401. Slack has no Tracker webhook, so no further Tracker copies this; a future Tracker that
authenticates with a stored secret should follow it rather than fold the 401 into the outcome type.

**What moved, and what the route kept.** `_services/jira/handle-jira-webhook.ts` exports
`handleJiraWebhook({ installationId, deliveryId, rawBody, payload })` and owns deduplication, the
handled-event check, the issue id check and the `jira/webhook.issue` emission. The route keeps
resolving the `token` route parameter, the authentication read, reading the raw body, the JSON parse
and the outcome-to-HTTP mapping. It imports no database client any more, which is the "must be gone"
check #140 runs over the API tree. `prisma`, `crypto` and the `JiraWebhookPayload` type left the
route file with the logic.

**Why the service takes the raw body as well as the parsed payload.** Jira's
`x-atlassian-webhook-identifier` header is not always present, and the fallback replay key is a
SHA-256 of the raw body, exactly as on Linear. Deduplication belongs to the service, so the fallback
follows it; the route passes the header value as it read it, `null` included. The key prefix
`webhook:jira:` is unchanged, so a delivery replayed across the deploy is still recognised.

**Order of checks preserved.** The token lookup runs before the body is read, deduplication before
the event-type check, and the event-type check before the issue id check, exactly as in the route. A
replayed delivery of an unhandled event still answers with the skipped marker and not with `ignored`.

**No error class, and none needed.** The service throws nothing: an unhandled event is an outcome,
not a failure. The three expected Jira error classes #120 relocated are raised by the sync path, not
by the webhook receiver, and are untouched here.

**Not this ticket.** The Jira install and callback routes still query Prisma inline (#123), and the
reconnect mail template still lives in the mailer folder (#124).

**Gate.** `pnpm typecheck`, `pnpm test` (58 files, 346 web tests; 192 `@workspace/eslint-config`
tests), `pnpm lint` and `pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web`
with dummy environment values lists every route, `/api/webhooks/jira/[token]` included.

**Not smoked here, and why.** The sandbox has no Postgres and no Atlassian site, so no delivery past
the token check runs against real data. The Jira rows below are for the maintainer.

### The Jira OAuth routes behind services, part 4 (issue #123)

The second OAuth pair to reuse the placement the GitHub pilot fixed in #115, after Linear (#119).
`GET /api/jira/install` and `GET /api/jira/callback` keep every redirect target, query parameter and
cookie they have today; neither queries Prisma inline any more, and the callback stops handling
tokens in clear. The OAuth app registered at Atlassian needs no reconfiguration.

**Characterization tests first.** `api/jira/install/route.test.ts` (seven cases) and
`api/jira/callback/route.test.ts` (seventeen cases), committed green against the current handlers in
their own commit (`c2d2b6f`) before a line of either route moved, and not edited by the extraction.
Same recipe as Linear, with `@/server/inngest` faked as well, because the Jira callback is the only
OAuth callback that emits an event.

| Route    | Pinned paths                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| install  | signed out to `/login?nextUrl=…`, `?error=no_active_org`, `?error=insufficient_role`, `?error=jira_not_configured`, the authorize url with its seven parameters, the httpOnly `jira_oauth_state` cookie echoing the state                                                                                                                                                                                                 |
| callback | `?error=jira_oauth_<provider error>`, `?error=jira_missing_code_or_state`, `?error=jira_state_mismatch` (wrong cookie and no cookie), `?error=not_authenticated`, `?error=no_active_org`, `?error=insufficient_role`, `?error=jira_token_exchange_failed`, `?error=jira_sites_fetch_failed`, `?error=jira_no_sites`, `?jira=connected` with the full upsert payload and the refresh event, `?jira=select_site` without it |

**Unlike Linear, the install route did need an extraction.** Jira's `/install` refuses a plain Member
before it mints a state, so it carried its own `prisma.member.findFirst`. Linear's did not, which is
why #119 reported "the install route needed no extraction" and this one cannot. Both routes now call
the same bucket-root service, the third and fourth caller of it.

**What the pair delegates now.**

| Operation                  | Where it landed                                  | Why                                                          |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------------ |
| Member authorization check | `_services/find-installing-member.ts`, unchanged | the pilot's shared service, imported verbatim on both routes |
| Installation upsert        | `_services/jira/upsert-jira-installation.ts`     | it writes `JiraInstallation`, a table only Jira has          |

**The site choice moved into the write, with the redirect left behind.** The route used to pick the
provisional site, derive `healthState`, encrypt both tokens, compute the expiry and decide whether to
ask for a webhook refresh. `upsertJiraInstallation` takes the accessible sites as Atlassian returned
them and owns all five, returning one `siteSelectionPending` flag. The route maps that flag to
`?jira=connected` or `?jira=select_site`, which is the only part of it a User sees, and therefore
route work. The stored columns are identical, asserted field by field against a frozen clock.

**Why the refresh event went with the write rather than staying in the route.** Renewing the webhook
registrations is a consequence of a connection becoming live, not of a redirect being chosen:
`selectJiraSite` already writes then sends the same event for the multi-site half of the same flow,
and its comment calls itself "the second half of the reconnect flow … the same webhook renewal the
single-site callback does". Keeping the two halves shaped alike is worth more than keeping the route
symmetrical with Linear's, which has no event to send. A provisional selection still sends nothing;
the picker owes it.

**The service takes a non-empty list, and the route guards it.** `?error=jira_no_sites` is a refusal
the User reads, mapped like the other refusals, so the empty-grant check stayed in the route and the
service documents the precondition rather than re-deriving a refusal it cannot render.

**Both `try`/`catch` blocks kept their place in the route**, for the reason #119 recorded: the code
exchange and the accessible-sites read fail to two different query parameters, and mapping two
outcomes to two targets is route work. `exchangeOAuthCode` and `getAccessibleResources` already throw
the named classes #120 relocated.

**Names, decided by running the rules.** `upsert-` for the write, matching GitHub and Linear. No
output alias is exported: `require-trpc-output-type` asks one of read-verb files only, and the two
sibling upsert services export none either.

**No file retired, no stub.** Everything here is an addition or an edit in place.

**Gate.** `pnpm typecheck`, `pnpm test` (60 files, 370 web tests; 192 `@workspace/eslint-config`
tests), `pnpm lint` and `pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web`
with dummy environment values lists every route, `/api/jira/install` and `/api/jira/callback`
included.

**Not this ticket.** The Jira reconnect mail template still lives in the mailer folder (#124), which
is the last Jira ticket.

**Not smoked here, and why.** The sandbox has no Postgres and no Atlassian site, so nothing past the
session check runs. The Jira rows below are for the maintainer.

### The Jira reconnect mail template moves next to the Jira code (issue #124)

The last Jira ticket, and the one file `src/lib/` still held that knows a product rule.
`lib/mailer/templates/jira-reconnect-required.tsx` moved to
`_domains/integration/_components/jira/jira-reconnect-required.tsx`. The mail a Jira Installation
sends when it enters the **Reconnect required** state is unchanged.

**Bucket, decided by the placement rules.** The template is JSX, so `_helpers/` is closed to it
(pure, no JSX) and `_services/` is for data and IO. `_components/` is what is left, and it fits its
definition: pure UI bound to the scope, no schema, no server. It is the first `_components/` bucket
in `_domains/integration/` and follows the domain's provider sub-structure, `jira/`, like the
services and helpers buckets. The file name and the exported `JiraReconnectRequired` are unchanged;
no verb rule reaches a component.

**Two import paths edited, nothing else.** The template reads the email Tailwind config by
`@/lib/mailer/templates/tailwind.config` instead of `./tailwind.config`: that config is shared by
the five remaining templates and is the generic plumbing the mailer folder keeps.
`handle-jira-oauth-revoked.inngest.ts` reaches the template with the intra-domain relative path
`../../_components/jira/jira-reconnect-required`, the convention #120 set. The subject
(`Action required: reconnect Jira`), the recipients query, the `reconnectNotifiedAt` guard and the
`render`/`createElement` call all stayed in the durable function.

**The rendered mail is proven unchanged, not assumed.** The component was rendered with
`@react-email/components` before and after the move with the same props
(`organizationName`, `siteName`, `integrationsLink`): 3550 bytes of HTML, md5
`d7bdedce8313ed7bd84f61046087e0ea`, identical. The scratch script lives outside the repo; no test was
added, per the step 5 testing decisions.

**Anomaly 5 of step 2 is closed.** That entry called this template "the one domain-bound file in
`src/lib/`". `lib/mailer/` now holds the client, the constants, the provider factory, the two
provider adapters, the shared types and five templates, none of which knows an Integration.

**No file retired, no stub.** A `git mv` with two import edits; nothing dissolved.

**Gate.** `pnpm typecheck`, `pnpm test` (60 files, 370 web tests; 192 `@workspace/eslint-config`
tests), `pnpm lint` and `pnpm lint:agent-rules` all pass at zero. `npx next build` from `apps/web`
with dummy environment values lists all 67 routes, `/api/inngest` included, and `GET /api/inngest`
against `next dev` on port 3131 answers `200` with `"function_count":17`.

**Not smoked here, and why.** The sandbox has no Postgres, no Atlassian site and no mail provider, so
the mail is never sent. The Jira row below is for the maintainer.

### Step 5 smoke checklists, one per external system

Grouped per external system rather than per ticket, so the maintainer walks each system once against
a real database rather than once per relocation. **Amend this entry in place**: a later ticket that
touches a system adds its rows here instead of starting a second checklist. Six lists are expected by
the exit verification (#140): GitHub, Linear, Jira, Slack, the widget, and the MCP server against the
agent API. Only the systems a landed ticket has touched appear below.

#### GitHub (started by #113, rows added by #114 and #115)

- [ ] Connect: install the GitHub App from `/integrations/github` and land back on `/integrations`
      with the Installation listed.
- [ ] Reconnect the same App: install it a second time and see the Installation refreshed rather
      than duplicated, with the account login and avatar up to date (row added by #115).
- [ ] Connect signed out: open the setup URL in a signed out browser and see the login screen, then
      land on the Installation after signing in (row added by #115).
- [ ] Connect as a plain Member: with a `member` role account, open the setup URL and land on
      `/integrations?error=insufficient_role` with no Installation recorded (row added by #115).
- [ ] Link a Project: pick a repository in the Project settings, save, reload, and see the link with
      its default labels.
- [ ] Mirror a Feedback: submit a Feedback on a linked Project and see the issue created in the
      repository, with the comment, the page link, the screenshot and the diagnostics block.
- [ ] Status app to GitHub: move the Feedback to Resolved in the inbox and see the issue close as
      completed; move it to Closed and see `not planned`.
- [ ] Status GitHub to app: close and reopen the issue in GitHub and see the Feedback status follow
      (Resolved, then In progress).
- [ ] Receive a webhook: confirm in the GitHub App delivery log that `issues` and `installation`
      deliveries answer `200`, that a replayed delivery answers `200` with the skipped marker, and
      that a delivery for an event the app does not handle also answers `200` (row added by #114).
- [ ] Disconnect: uninstall the App and see the Installation and its Project links removed.

#### Linear (started by #116, rows added by #117, #118 and #119)

- [ ] Connect: start the install from `/integrations/linear`, approve the Linear consent screen and
      land on `/integrations` with the Linear organization listed.
- [ ] State round-trip on the cookie: start the install, then open the callback URL a second time
      with a stale `state` and land on `/integrations?error=linear_state_mismatch`.
- [ ] Reconnect: connect Linear a second time from an Organization that already has an Installation
      and see the same row refreshed with the current workspace and a new token, not duplicated (row
      added by #119).
- [ ] Connect signed out: open `/api/linear/install` in a signed out browser, see the login screen,
      sign in and land back on the install (row added by #119).
- [ ] Connect as a plain Member: with a `member` role account, walk the consent screen and land on
      `/integrations?error=insufficient_role` with no Installation recorded (row added by #119).
- [ ] Refuse at Linear: press Cancel on the Linear consent screen and land on
      `/integrations?error=linear_oauth_access_denied` (row added by #119).
- [ ] Link a Project: pick a Linear team in the Project settings, see the team states and labels
      offered, save, reload, and see the link with its default state.
- [ ] Mirror a Feedback: submit a Feedback on a linked Project and see the issue created in the
      team, with the body, the page link, the screenshot and the diagnostics block, and only the
      labels that still exist on the team.
- [ ] Status app to Linear: move the Feedback to In progress, then Resolved, in the inbox and see
      the Linear issue follow into a started, then a completed, workflow state.
- [ ] Status Linear to app: move the issue to Done, then back to Todo, in Linear and see the
      Feedback status follow (Resolved, then New).
- [ ] Receive a webhook: confirm in Linear's webhook log that a delivery answers `200`, and that a
      delivery with a tampered `linear-signature` answers `401`.
- [ ] Replay a delivery: resend the same delivery from Linear's webhook log and see `200` with
      `{"ok":true,"skipped":"duplicate_delivery"}` and no second issue update (row added by #118).
- [ ] Delivery from an unconnected workspace: after disconnecting, see a still pending delivery
      answer `200` with `{"ok":true,"ignored":"no_installation"}` rather than a retry (row added by
      #118).
- [ ] Disconnect: disconnect Linear from `/integrations` and see the Installation and its Project
      links removed, and the token revoked at Linear.
- [ ] Revoke from Linear: revoke the application from the Linear workspace settings and see the
      Installation removed on the next `linear/oauth.revoked` delivery, with the durable function
      run listed as succeeded (row added by #117).

#### Jira (started by #120, rows added by #121, #123 and #124)

- [ ] Connect: start the install from `/integrations/jira`, approve the Atlassian consent screen and
      land on `/integrations` with the Jira site listed as connected.
- [ ] Multi-site grant: approve the consent screen for an account with several accessible sites, land
      on `/integrations?jira=select_site`, pick a site and see it stored with the health state back to
      connected.
- [ ] State round-trip on the cookie: start the install, then open the callback URL a second time
      with a stale `state` and land on `/integrations?error=jira_state_mismatch`.
- [ ] Refuse at Atlassian: press Cancel on the consent screen and land on `/integrations` with a
      `jira_oauth_*` error parameter.
- [ ] Reconnect: connect Jira a second time from an Organization that already has an Installation
      and see the same row refreshed with the current site and a new token, not duplicated, and its
      Project links still in place (row added by #123).
- [ ] Connect signed out: open `/api/jira/install` in a signed out browser, see the login screen,
      sign in and land back on the install (row added by #123).
- [ ] Connect as a plain Member: with a `member` role account, open `/api/jira/install` and land on
      `/integrations?error=insufficient_role` before the consent screen, with no Installation
      recorded (row added by #123).
- [ ] Link a Project: pick a Jira project and issue type in the Project settings, save, reload, and
      see the link, with a required field the app cannot fill blocking the pick rather than failing
      later.
- [ ] Register the webhook: confirm after linking that the Jira site lists a dynamic webhook pointing
      at `/api/webhooks/jira/<token>`, with an expiry about 30 days out.
- [ ] Mirror a Feedback: submit a Feedback on a linked Project and see the issue created with the
      summary, the ADF body, the page link, the screenshot link and the diagnostics expand block.
- [ ] Status app to Jira: move the Feedback to In progress, then Resolved, in the inbox and see the
      Jira issue transition into an in-progress, then a done-category status, with a resolution the
      transition screen offers.
- [ ] Status Jira to app: move the issue to Done, then back to To Do, in Jira and see the Feedback
      status follow (Resolved, then In progress).
- [ ] Reconnect required: revoke the Faster Fixes grant from the Atlassian account settings, trigger
      any Jira read, and see the Installation flip to Reconnect required with the reconnect mail sent
      once and the Jira screens showing the copy rather than a 500.
- [ ] Outage is not a refusal: with the grant healthy, confirm a transient Atlassian 5xx leaves the
      Installation connected and the durable function retrying.
- [ ] Refresh the registrations: run the weekly `jira/webhooks.refresh` function by hand and see each
      link's expiry pushed back, and a link whose registration Jira no longer knows re-registered
      rather than taking the others down.
- [ ] Revoked at Atlassian, by event: after a `jira/oauth.revoked` delivery, see the durable function
      run listed as succeeded, the Installation flipped to Reconnect required and exactly one
      reconnect mail sent even when several syncs report the same revocation (row added by #121).
- [ ] Read the reconnect mail: open the delivered message and see the subject "Action required:
      reconnect Jira", the Organization name and the Jira site name in the body, and the Reconnect
      Jira button opening `/integrations` (row added by #124).
- [ ] Disconnect: disconnect Jira from `/integrations` and see the Installation and its Project links
      removed, and the webhook registration gone from the Jira site.
