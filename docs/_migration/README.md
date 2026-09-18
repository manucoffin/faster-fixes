# Migration log

> Temporary. This folder exists only for the duration of the architecture migration and is deleted at the end of step 5, together with `docs/architecture/migration-kit/`. Nothing here is permanent documentation: anything that must outlive the migration belongs in `docs/architecture/target-architecture.md`, an ADR, or the `coding-standards` skill.

## Purpose

The migration moves the web app from its current `_features/` layout to the target architecture, in five steps described in `docs/architecture/migration-kit/`. This log is what makes the move measurable:

- the **baseline** below records how many convention violations existed before any application code moved, per rule, so each later step can be compared against it;
- the **locked scopes** table records which scopes have been migrated and which rules were flipped from `warn` to `error` for them, so a regression on migrated code fails the build;
- the **prerequisites** section records what must be decided or added before the next step starts.

The burn-down metric is `pnpm lint:agent-rules`. During the migration it runs without `--max-warnings 0`: errors fail the command, warnings are counted. Count them per rule with:

```sh
pnpm lint:agent-rules | grep -o 'local/[a-z-]*' | sort | uniq -c
```

`--max-warnings 0` returns to `lint:agent-rules` at the end of step 4, once every scope is migrated and every convention rule is locked to `error`. Until then, a non-zero warning count is expected and is not a failure; a non-zero **error** count is a regression on a locked scope or on an always-on rule.

## Baseline

Measured on 2026-09-17 at commit `ebd017c`, after the 14 convention rules landed and before any application code moved. Command: `pnpm lint:agent-rules` from the repo root (gated ESLint over the web app). Result: **131 problems, 0 errors, 131 warnings**.

| Rule                                | Severity in step 1      | Baseline | Note                                                            |
| ----------------------------------- | ----------------------- | -------: | --------------------------------------------------------------- |
| `no-raw-tailwind-colors`            | `agent`                 |       88 | Semantic-token burn-down. Not scoped to a folder.               |
| `require-schema-conventions`        | `agent`                 |       28 | Over 47 `*.schema.ts` files.                                    |
| `require-use-client-suffix`         | `agent`                 |       14 | 13 under `src/app/`, 1 under `src/lib/` from the widened scope. |
| `schema-must-be-pure-zod`           | `agent`                 |        1 |                                                                 |
| `no-client-import-of-services`      | `agent`                 |        0 | No `_services/` folder to import from yet.                      |
| `no-feature-nesting`                | `agent`                 |        0 | No `_features/` folder nested inside another.                   |
| `no-default-export`                 | `domainRulesSeverity`   |        0 | Real zero: the transition glob resolves on `_features/**`.      |
| `services-verb-prefix`              | `servicesRulesSeverity` |        0 | `_services/` does not exist until step 3.                       |
| `services-no-trpc-import`           | `servicesRulesSeverity` |        0 | Same.                                                           |
| `require-trpc-output-type`          | `servicesRulesSeverity` |        0 | Same.                                                           |
| `services-no-bare-error`            | `servicesRulesSeverity` |        0 | Same. Becomes always-on in step 4.                              |
| `no-cross-domain-deep-import`       | `error`, always on      |        0 | `_domains/` does not exist until step 2.                        |
| `require-server-action-suffix`      | `error`, always on      |        0 | `*.trpc.query.ts` and `*.trpc.mutation.ts` exempt until step 3. |
| `no-client-import-of-server-errors` | `off`                   |      n/a | Enabled in step 3, when `src/server/errors/` is created.        |

The built-in `no-throw-literal` is on as an error outside the gate and reports zero.

A zero on a rule whose target folder does not exist yet is expected. A zero on a rule that should match existing files means the glob is wrong: verify with `ESLINT_AGENT_RULES=1 npx eslint --print-config <file>` from `apps/web` before trusting it. The `no-default-export` zero was verified this way.

The planning estimate for `require-use-client-suffix` was 11, under the narrower `_domains/**` scope from the kit. Widening the rule to `src/**` raised it to 14.

## Locked scopes

A scope is locked when its files satisfy the target convention and the matching rules are raised from `warn` to `error` for it. Nothing is locked yet.

| Scope | Step | Commit | Rules locked |
| ----- | ---- | ------ | ------------ |
|       |      |        |              |

## Prerequisites for step 2

Step 2 moves domain-bound code from `src/app/_features/` into `src/app/_domains/<domain>/`. Before any folder moves:

1. **Add the missing glossary terms to `CONTEXT.md`.** Domain folder names come from the glossary, not from the current feature folder names. `CONTEXT.md` defines the reporting, lifecycle, integration and diagnostics vocabulary but not the account side. Missing: Organization, User, Member, Invitation, Subscription, Plan, Auth. Use the `domain-modeling` skill.
2. **Decide the home of the domain-agnostic feature folders.** `src/app/_features/` currently holds 11 folders. Six map to candidate domains (`auth`, `feedback`, `organization`, `project`, `subscription`, `user`). Four are not domains and need a target: `core` (avatar, dashboard, datatable, footer, header, logo, upload), `mdx`, `seo`, `c15t`. The target root layout offers `_components/`, `_hooks/`, `_providers/` and `_constants/` for domain-agnostic code, and `src/lib/` for non-UI plumbing.
3. **Decide the home of the marketing GitHub stars feature.** `_features/github/` serves the public marketing pages only. It is a route feature candidate, so it belongs in the route tier under `(public)/`, not under `_domains/`.
4. **Remove the transition globs** from `packages/eslint-config/next.js` once the root `_features/` folder is gone. Two entries are marked as transition in that file: the `no-default-export` glob on `_features/`, and the `require-server-action-suffix` exemption for the `.trpc.query.ts` and `.trpc.mutation.ts` files (that one goes in step 3, not step 2).
5. **Commit the kit ADR.** `docs/architecture/migration-kit/adrs/app-folder-architecture.md` becomes an ADR under `docs/adr/`, and the `coding-standards` rule files repoint their authority links at it.

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
