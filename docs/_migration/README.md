# Migration log

> Temporary. This folder exists only for the duration of the architecture migration and is deleted at the end of step 5, together with `docs/architecture/migration-kit/`. Nothing here is permanent documentation: anything that must outlive the migration belongs in `docs/architecture/target-architecture.md`, an ADR, or the `coding-standards` skill.

## Purpose

The migration moves the web app from its current `_features/` layout to the target architecture, in five steps described in `docs/architecture/migration-kit/`. This log is what makes the move measurable:

- the **baseline** below records how many convention violations existed before any application code moved, per rule, so each later step can be compared against it;
- the **locked scopes** table records which scopes have been migrated and which rules were flipped from `warn` to `error` for them, so a regression on migrated code fails the build;
- the **prerequisites** section records what must be decided or added before the next step starts;
- the **exit verification** section of a completed step records the commands that closed it and what they returned, plus anything left for the maintainer;
- the **deferred** and **anomalies** sections record what a step left behind, so "what is left" is a lookup rather than a rediscovery.

The burn-down metric is `pnpm lint:agent-rules`. During the migration it runs without `--max-warnings 0`: errors fail the command, warnings are counted. Count them per rule with:

```sh
pnpm lint:agent-rules | grep -o 'local/[a-z-]*' | sort | uniq -c
```

`--max-warnings 0` returns to `lint:agent-rules` at the end of step 4, once every scope is migrated and every convention rule is locked to `error`. Until then, a non-zero warning count is expected and is not a failure; a non-zero **error** count is a regression on a locked scope or on an always-on rule.

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

| Scope                   | Step | Commit    | Rules locked                                                                                                                                                                                                                                        |
| ----------------------- | ---- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_domains/**`           | 2    | `930f233` | `no-cross-domain-deep-import`, `no-default-export`                                                                                                                                                                                                  |
| `(public)`              | 3    | `fb076dd` | `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `services-no-bare-error`, `no-client-import-of-services`, `no-feature-nesting`, `require-schema-conventions`, `schema-must-be-pure-zod`, `require-use-client-suffix` |
| `_domains/organization` | 3    | `a9ba3a3` | `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `services-no-bare-error`, `no-client-import-of-services`, `no-feature-nesting`, `require-schema-conventions`, `schema-must-be-pure-zod`, `require-use-client-suffix` |
| `_domains/user`         | 3    | `ac5a4bb` | `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `services-no-bare-error`, `no-client-import-of-services`, `no-feature-nesting`, `require-schema-conventions`, `schema-must-be-pure-zod`, `require-use-client-suffix` |

`no-cross-domain-deep-import` is always on, outside the agent gate, and was hardened in `51998d2` before the first domain moved. `no-default-export` stays behind `ESLINT_AGENT_RULES=1` but reports at `error` there, so a default export inside a domain fails `pnpm lint:agent-rules` instead of adding a warning to the burn-down. The `_features/**` transition glob was removed from that rule in the same commit: it only ever matched the root folder, which no longer exists, and the route-tier `_features/` folders never matched it. No file under `_domains/` had a default export, so the lock needed no fix.

The `require-server-action-suffix` exemption for `*.trpc.query.ts` and `*.trpc.mutation.ts` is still in place. Step 3 removes it when those files move into `_services/`.

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
2. **Answer the open question on the integration domains** recorded above. It decides the home of `server/github`, `server/linear`, `server/jira`, `server/slack`, `server/oauth`, the domain-bound Inngest functions and the Jira mail template, which together are most of what step 3 has to move.
3. **Decide the domain of `server/storage`.** Asset is not a glossary term. Either add it to `CONTEXT.md` with the `domain-modeling` skill, or place the folder under the domain that owns the files it stores.
4. ~~**Add the per-scope allowlist to the ESLint config.**~~ Done, see the `migratedScopes` section below.
5. **Plan the removal of the `require-server-action-suffix` exemption.** The exemption for `*.trpc.query.ts` and `*.trpc.mutation.ts` is marked as a transition in `packages/eslint-config/next.js` and comes out when those files are gone. It is the last transition glob left, since the `no-default-export` one was removed in step 2.
6. **Decide the two placements step 2 deliberately left open:** which bucket `_domains/feedback/feedback-status.ts` belongs in (amendment 7), and whether a route-agnostic search-params module needs a bucket of its own or whether `_components/dashboard/search-params.ts` stays where it is (amendment 2).

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
