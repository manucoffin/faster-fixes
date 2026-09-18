# Migration log

> Temporary. This folder exists only for the duration of the architecture migration and is deleted at the end of step 5, together with `docs/architecture/migration-kit/`. Nothing here is permanent documentation: anything that must outlive the migration belongs in `docs/architecture/target-architecture.md`, an ADR, or the `coding-standards` skill.

## Purpose

The migration moves the web app from its current `_features/` layout to the target architecture, in five steps described in `docs/architecture/migration-kit/`. This log is what makes the move measurable:

- the **baseline** below records how many convention violations existed before any application code moved, per rule, so each later step can be compared against it;
- the **locked scopes** table records which scopes have been migrated and which rules were flipped from `warn` to `error` for them, so a regression on migrated code fails the build;
- the **prerequisites** section records what must be decided or added before the next step starts;
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
| `no-client-import-of-server-errors` | `off`                   |      n/a |          n/a | Enabled in step 3, when `src/server/errors/` is created.                  |

The built-in `no-throw-literal` is on as an error outside the gate and reports zero.

A zero on a rule whose target folder does not exist yet is expected. A zero on a rule that should match existing files means the glob is wrong: verify with `ESLINT_AGENT_RULES=1 npx eslint --print-config <file>` from `apps/web` before trusting it. The `no-default-export` zero was verified this way.

The planning estimate for `require-use-client-suffix` was 11, under the narrower `_domains/**` scope from the kit. Widening the rule to `src/**` raised it to 14.

### Re-measured after step 2

Re-measured on 2026-09-18 at commit `93b5653`, with the root `_features/` folder gone and `_domains/` locked. Same command, run with `--force` so Turbo does not serve a cached run. Result: **120 problems, 0 errors, 120 warnings**, down 11 from the baseline of 131.

The whole burn-down of step 2 is `require-use-client-suffix`, from 14 to 3, because the step renamed every `'use client'` file that reached its final home. The three left are `admin/users/_features/users-table/users-table.tsx`, `admin/users/_features/users-table/users-table-action-dropdown.tsx` and `src/lib/trpc/trpc-provider.tsx`: route-tier and plumbing files that step 2 did not move. The other rules are flat by design, since step 2 moved files and rewrote import paths without editing file bodies.

A zero on `no-cross-domain-deep-import` is now a real zero rather than a vacuous one: the rule has six domains to guard and reports no violation.

## Locked scopes

A scope is locked when its files satisfy the target convention and the matching rules are raised from `warn` to `error` for it.

| Scope         | Step | Commit    | Rules locked                                       |
| ------------- | ---- | --------- | -------------------------------------------------- |
| `_domains/**` | 2    | `930f233` | `no-cross-domain-deep-import`, `no-default-export` |

`no-cross-domain-deep-import` is always on, outside the agent gate, and was hardened in `51998d2` before the first domain moved. `no-default-export` stays behind `ESLINT_AGENT_RULES=1` but reports at `error` there, so a default export inside a domain fails `pnpm lint:agent-rules` instead of adding a warning to the burn-down. The `_features/**` transition glob was removed from that rule in the same commit: it only ever matched the root folder, which no longer exists, and the route-tier `_features/` folders never matched it. No file under `_domains/` had a default export, so the lock needed no fix.

The `require-server-action-suffix` exemption for `*.trpc.query.ts` and `*.trpc.mutation.ts` is still in place. Step 3 removes it when those files move into `_services/`.

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

1. **Create the domain-error vocabulary and the tRPC mapping middleware first.** `src/server/errors/domain-errors.ts` (five subclasses, zero imports) and the `domainErrorMiddleware` on the base procedure in `src/server/trpc/trpc.ts`, both given verbatim in `docs/architecture/migration-kit/03-services.md`. Extracting a procedure that throws `TRPCError({ code: "CONFLICT" })` into a service that throws a bare `Error` silently turns a 409 into a 500. Creating that folder is also what enables `no-client-import-of-server-errors`, which is `off` and unmeasured today.
2. **Answer the open question on the integration domains** recorded above. It decides the home of `server/github`, `server/linear`, `server/jira`, `server/slack`, `server/oauth`, the domain-bound Inngest functions and the Jira mail template, which together are most of what step 3 has to move.
3. **Decide the domain of `server/storage`.** Asset is not a glossary term. Either add it to `CONTEXT.md` with the `domain-modeling` skill, or place the folder under the domain that owns the files it stores.
4. **Add the per-scope allowlist to the ESLint config.** The kit's strategy is to migrate one scope at a time and flip `servicesRulesSeverity` from `warn` to `error` for that path as it lands. `packages/eslint-config/next.js` has no `migratedScopes` mechanism yet; without it a scope can only be locked once every scope is done.
5. **Plan the removal of the `require-server-action-suffix` exemption.** The exemption for `*.trpc.query.ts` and `*.trpc.mutation.ts` is marked as a transition in `packages/eslint-config/next.js` and comes out when those files are gone. It is the last transition glob left, since the `no-default-export` one was removed in step 2.
6. **Decide the two placements step 2 deliberately left open:** which bucket `_domains/feedback/feedback-status.ts` belongs in (amendment 7), and whether a route-agnostic search-params module needs a bucket of its own or whether `_components/dashboard/search-params.ts` stays where it is (amendment 2).
